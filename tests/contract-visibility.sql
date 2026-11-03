-- Draft contract visibility regression. All fake rows are rolled back.
BEGIN;
INSERT INTO auth.users(id,email)
 VALUES('a0000000-0000-4000-8000-000000000004','fe-test-contract@example.invalid');
INSERT INTO public.profiles(id,role)
 VALUES('a0000000-0000-4000-8000-000000000004','client');
INSERT INTO public.enquiries(id,contact_name,stage,call_completed_at,approved_at,quote_sent_at)
 VALUES('e0000000-0000-4000-8000-000000000004','Fixture contract','accepted',now(),now(),now());
INSERT INTO public.events(id,client_id,enquiry_id,title)
 VALUES('d0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000004','e0000000-0000-4000-8000-000000000004','Fixture contract');
INSERT INTO public.event_documents(id,event_id,kind,storage_path,version)
 VALUES('f0000000-0000-4000-8000-000000000004','d0000000-0000-4000-8000-000000000004','contract','d0000000-0000-4000-8000-000000000004/fixture-contract.pdf',1);
INSERT INTO public.event_contracts(event_id,template_kind,state,document_id)
 VALUES('d0000000-0000-4000-8000-000000000004','individual_reservation','draft','f0000000-0000-4000-8000-000000000004');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000004',true);
DO $test$ BEGIN
 IF (SELECT count(*) FROM public.event_documents WHERE kind='contract')<>0
 THEN RAISE EXCEPTION 'Client can see draft contract'; END IF;
 IF (SELECT count(*) FROM public.event_contracts)<>0
 THEN RAISE EXCEPTION 'Client can see draft contract metadata'; END IF;
END $test$;
RESET ROLE;
UPDATE public.event_contracts SET state='sent' WHERE event_id='d0000000-0000-4000-8000-000000000004';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000004',true);
DO $test$ BEGIN
 IF (SELECT count(*) FROM public.event_documents WHERE kind='contract')<>1
 THEN RAISE EXCEPTION 'Client cannot see sent contract'; END IF;
 IF (SELECT count(*) FROM public.event_contracts)<>1
 THEN RAISE EXCEPTION 'Client cannot see sent contract metadata'; END IF;
END $test$;
RESET ROLE;
ROLLBACK;
SELECT 'Draft/sent contract visibility passed; fixtures rolled back' AS result;
