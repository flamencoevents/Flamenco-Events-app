-- Formal reservation transition regression, all records rolled back.
BEGIN;
INSERT INTO auth.users(id,email) VALUES
 ('a0000000-0000-4000-8000-000000000031','fe-test-reservation-admin@example.invalid'),
 ('c0000000-0000-4000-8000-000000000032','fe-test-reservation-client@example.invalid');
INSERT INTO public.profiles(id,role) VALUES
 ('a0000000-0000-4000-8000-000000000031','admin'),
 ('c0000000-0000-4000-8000-000000000032','client');
INSERT INTO public.enquiries(id,contact_name,stage,call_completed_at,approved_at,quote_sent_at)
 VALUES('e0000000-0000-4000-8000-000000000031','Accepted booking','accepted',now(),now(),now());
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000031',true);
INSERT INTO public.events(id,client_id,enquiry_id,title,status)
 VALUES('d0000000-0000-4000-8000-000000000031',
 'c0000000-0000-4000-8000-000000000032',
 'e0000000-0000-4000-8000-000000000031','Reservation fixture','accepted');
DO $test$ DECLARE rejected boolean:=false; BEGIN
 BEGIN
  UPDATE public.events SET status='confirmed' WHERE id='d0000000-0000-4000-8000-000000000031';
 EXCEPTION WHEN check_violation THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'Booking confirmed without contract'; END IF;
END $test$;
INSERT INTO public.event_documents(id,event_id,kind,storage_path,version)
 VALUES('f0000000-0000-4000-8000-000000000031',
 'd0000000-0000-4000-8000-000000000031',
 'contract','d0000000-0000-4000-8000-000000000031/fixture.pdf',1);
INSERT INTO public.event_contracts(event_id,template_kind,state,document_id)
 VALUES('d0000000-0000-4000-8000-000000000031','individual_reservation','sent',
 'f0000000-0000-4000-8000-000000000031');
UPDATE public.event_contracts
 SET state='signed',signed_at=now(),signature_provider='fixture',signature_reference='TEST_SIGNATURE_REF'
 WHERE event_id='d0000000-0000-4000-8000-000000000031';
DO $test$ DECLARE rejected boolean:=false; BEGIN
 BEGIN
  UPDATE public.events SET status='confirmed',
   reservation_reviewed_at=now(),reservation_review_note='short'
  WHERE id='d0000000-0000-4000-8000-000000000031';
 EXCEPTION WHEN check_violation THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'Booking confirmed without sufficient manual review'; END IF;
END $test$;
UPDATE public.events
 SET status='confirmed',reservation_reviewed_at=now(),
 reservation_review_note='Signed contract checked; booking conditions have been reviewed by administrator.'
 WHERE id='d0000000-0000-4000-8000-000000000031';
DO $test$ BEGIN
 IF (SELECT status FROM public.events WHERE id='d0000000-0000-4000-8000-000000000031')<>'confirmed'
 THEN RAISE EXCEPTION 'Valid reservation confirmation failed'; END IF;
END $test$;
RESET ROLE;
ROLLBACK;
SELECT 'Formal reservation gate passed; fixtures rolled back' AS result;
