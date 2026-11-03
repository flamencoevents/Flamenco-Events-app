BEGIN;
INSERT INTO auth.users(id,email)
 VALUES('a0000000-0000-4000-8000-000000000009','fe-test-messages@example.invalid');
INSERT INTO public.profiles(id,role)
 VALUES('a0000000-0000-4000-8000-000000000009','client');
INSERT INTO public.enquiries(id,contact_name,stage,call_completed_at,approved_at,quote_sent_at)
 VALUES('e0000000-0000-4000-8000-000000000009','Rate test','accepted',now(),now(),now());
INSERT INTO public.events(id,client_id,enquiry_id,title)
 VALUES('d0000000-0000-4000-8000-000000000009','a0000000-0000-4000-8000-000000000009',
 'e0000000-0000-4000-8000-000000000009','Rate test event');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000009',true);
DO $test$
DECLARE i int;
BEGIN
 FOR i IN 1..15 LOOP
   INSERT INTO public.event_messages(event_id,author_id,message)
   VALUES('d0000000-0000-4000-8000-000000000009',
          'a0000000-0000-4000-8000-000000000009','Test message '||i);
 END LOOP;
 BEGIN
  INSERT INTO public.event_messages(event_id,author_id,message)
  VALUES('d0000000-0000-4000-8000-000000000009',
         'a0000000-0000-4000-8000-000000000009','Over limit');
  RAISE EXCEPTION 'Message limit not enforced';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 BEGIN
  INSERT INTO public.event_messages(event_id,author_id,message)
  VALUES('d0000000-0000-4000-8000-000000000009',
         'a0000000-0000-4000-8000-000000000009','   ');
  RAISE EXCEPTION 'Empty message accepted';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
END $test$;
RESET ROLE;
ROLLBACK;
SELECT 'Message limits passed; fixtures rolled back' AS result;
