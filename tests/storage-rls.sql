-- Storage metadata RLS regression. No actual files are uploaded.
BEGIN;
INSERT INTO auth.users(id,email) VALUES
('a0000000-0000-4000-8000-000000000041','fe-test-storage-a@example.invalid'),
('b0000000-0000-4000-8000-000000000042','fe-test-storage-b@example.invalid');
INSERT INTO public.profiles(id,role) VALUES
('a0000000-0000-4000-8000-000000000041','client'),
('b0000000-0000-4000-8000-000000000042','client');
INSERT INTO public.enquiries(id,contact_name,stage,call_completed_at,approved_at,quote_sent_at) VALUES
('e0000000-0000-4000-8000-000000000041','Storage A','accepted',now(),now(),now()),
('e0000000-0000-4000-8000-000000000042','Storage B','accepted',now(),now(),now());
INSERT INTO public.events(id,client_id,enquiry_id,title) VALUES
('d0000000-0000-4000-8000-000000000041','a0000000-0000-4000-8000-000000000041','e0000000-0000-4000-8000-000000000041','Storage A'),
('d0000000-0000-4000-8000-000000000042','b0000000-0000-4000-8000-000000000042','e0000000-0000-4000-8000-000000000042','Storage B');
INSERT INTO public.event_documents(id,event_id,kind,storage_path,version) VALUES
('f0000000-0000-4000-8000-000000000041','d0000000-0000-4000-8000-000000000041','quotation','d0000000-0000-4000-8000-000000000041/quote.pdf',1),
('f0000000-0000-4000-8000-000000000042','d0000000-0000-4000-8000-000000000042','quotation','d0000000-0000-4000-8000-000000000042/quote.pdf',1),
('f0000000-0000-4000-8000-000000000043','d0000000-0000-4000-8000-000000000041','contract','d0000000-0000-4000-8000-000000000041/draft.pdf',1);
INSERT INTO public.event_contracts(event_id,template_kind,document_id,state)
VALUES('d0000000-0000-4000-8000-000000000041','individual_reservation',
'f0000000-0000-4000-8000-000000000043','draft');
INSERT INTO storage.objects(bucket_id,name) VALUES
('event-documents','d0000000-0000-4000-8000-000000000041/quote.pdf'),
('event-documents','d0000000-0000-4000-8000-000000000042/quote.pdf'),
('event-documents','d0000000-0000-4000-8000-000000000041/draft.pdf');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000041',true);
DO $test$ DECLARE n integer; BEGIN
 SELECT count(*) INTO n FROM storage.objects WHERE bucket_id='event-documents';
 IF n<>1 THEN RAISE EXCEPTION 'Client A sees % storage objects (expected 1)',n;END IF;
END $test$;
RESET ROLE;
UPDATE public.event_contracts SET state='sent'
 WHERE event_id='d0000000-0000-4000-8000-000000000041';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000041',true);
DO $test$ DECLARE n integer; BEGIN
 SELECT count(*) INTO n FROM storage.objects WHERE bucket_id='event-documents';
 IF n<>2 THEN RAISE EXCEPTION 'Client A did not receive sent contract';END IF;
END $test$;
SELECT set_config('request.jwt.claim.sub','b0000000-0000-4000-8000-000000000042',true);
DO $test$ DECLARE n integer; BEGIN
 SELECT count(*) INTO n FROM storage.objects WHERE bucket_id='event-documents';
 IF n<>1 THEN RAISE EXCEPTION 'Client B storage isolation failed';END IF;
END $test$;
RESET ROLE;
ROLLBACK;
SELECT 'Storage RLS and draft contract controls passed; fixtures rolled back' AS result;
