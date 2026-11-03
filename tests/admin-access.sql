-- Administrator RLS workflow; entirely rolled back.
BEGIN;
INSERT INTO auth.users(id,email) VALUES
 ('a0000000-0000-4000-8000-000000000021','fe-test-admin@example.invalid'),
 ('c0000000-0000-4000-8000-000000000022','fe-test-adminclient@example.invalid');
INSERT INTO public.profiles(id,role) VALUES
 ('a0000000-0000-4000-8000-000000000021','admin'),
 ('c0000000-0000-4000-8000-000000000022','client');
INSERT INTO public.enquiries(id,contact_name,stage,call_completed_at,approved_at,quote_sent_at) VALUES
 ('e0000000-0000-4000-8000-000000000021','Accepted fixture','accepted',now(),now(),now()),
 ('e0000000-0000-4000-8000-000000000022','Rejected fixture','new',null,null,null);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000021',true);
INSERT INTO public.events(id,client_id,enquiry_id,title)
 VALUES ('d0000000-0000-4000-8000-000000000021','c0000000-0000-4000-8000-000000000022',
 'e0000000-0000-4000-8000-000000000021','Approved admin fixture');
DO $test$ DECLARE rejected boolean:=false; BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin role lookup failed'; END IF;
 BEGIN
  INSERT INTO public.events(client_id,enquiry_id,title)
    VALUES('c0000000-0000-4000-8000-000000000022',
    'e0000000-0000-4000-8000-000000000022','Unapproved fixture');
 EXCEPTION WHEN check_violation THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'Admin bypassed acceptance requirement'; END IF;
END $test$;
INSERT INTO public.event_contracts(event_id,template_kind,state,quotation_number)
 VALUES('d0000000-0000-4000-8000-000000000021','individual_reservation','draft','TEST-021');
RESET ROLE;
ROLLBACK;
SELECT 'Administrator accepted-event and contract draft gates passed; fixtures rolled back' AS result;
