BEGIN;
INSERT INTO auth.users(id,email) VALUES
 ('a0000000-0000-4000-8000-000000000071','fe-test-payment-admin@example.invalid'),
 ('b0000000-0000-4000-8000-000000000072','fe-test-payment-client@example.invalid'),
 ('c0000000-0000-4000-8000-000000000073','fe-test-payment-sales@example.invalid'),
 ('d0000000-0000-4000-8000-000000000074','fe-test-payment-other@example.invalid');
INSERT INTO public.profiles(id,role) VALUES
 ('a0000000-0000-4000-8000-000000000071','admin'),
 ('b0000000-0000-4000-8000-000000000072','client'),
 ('c0000000-0000-4000-8000-000000000073','sales'),
 ('d0000000-0000-4000-8000-000000000074','client');
INSERT INTO public.enquiries(id,contact_name,stage,call_completed_at,approved_at,quote_sent_at)
 VALUES('e0000000-0000-4000-8000-000000000071','Payment fixture','accepted',now(),now(),now());
INSERT INTO public.events(id,client_id,enquiry_id,title) VALUES
 ('f0000000-0000-4000-8000-000000000071','b0000000-0000-4000-8000-000000000072',
  'e0000000-0000-4000-8000-000000000071','Payment fixture');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000071',true);
INSERT INTO public.event_payment_schedule(id,event_id,label,amount_eur,due_on)
 VALUES('d0000000-0000-4000-8000-000000000071',
 'f0000000-0000-4000-8000-000000000071','Reserva comprobable',300.00,CURRENT_DATE);
SELECT set_config('request.jwt.claim.sub','b0000000-0000-4000-8000-000000000072',true);
DO $test$ DECLARE n integer; BEGIN
 SELECT count(*) INTO n FROM public.event_payment_schedule;
 IF n<>1 THEN RAISE EXCEPTION 'Payment milestone hidden from its client';END IF;
END $test$;
SELECT set_config('request.jwt.claim.sub','d0000000-0000-4000-8000-000000000074',true);
DO $test$ DECLARE n integer; BEGIN
 SELECT count(*) INTO n FROM public.event_payment_schedule;
 IF n<>0 THEN RAISE EXCEPTION 'Other client saw payment details';END IF;
END $test$;
SELECT set_config('request.jwt.claim.sub','c0000000-0000-4000-8000-000000000073',true);
DO $test$ DECLARE denied boolean:=false; BEGIN
 BEGIN
  UPDATE public.event_payment_schedule SET status='received',received_at=now(),
    confirmed_by='c0000000-0000-4000-8000-000000000073';
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'Sales marked payment received'; END IF;
END $test$;
SELECT set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000071',true);
UPDATE public.event_payment_schedule SET status='received',received_at=now(),
  confirmed_by='a0000000-0000-4000-8000-000000000071'
 WHERE id='d0000000-0000-4000-8000-000000000071';
DO $test$ DECLARE denied boolean:=false; BEGIN
 IF (SELECT status FROM public.event_payment_schedule WHERE id='d0000000-0000-4000-8000-000000000071')<>'received'
 THEN RAISE EXCEPTION 'Admin payment confirmation not persisted'; END IF;
 BEGIN
  UPDATE public.event_payment_schedule SET amount_eur=1
   WHERE id='d0000000-0000-4000-8000-000000000071';
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'Received payment record was editable';END IF;
END $test$;
RESET ROLE;
ROLLBACK;
SELECT 'Payment access, confirmation, and immutable settlement passed; fixtures rolled back' AS result;
