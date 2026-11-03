-- Negative-access regression; no test records remain after rollback.
BEGIN;
INSERT INTO auth.users(id,email) VALUES
('a0000000-0000-4000-8000-000000000011','fe-test-negative-a@example.invalid'),
('b0000000-0000-4000-8000-000000000012','fe-test-negative-b@example.invalid'),
('c0000000-0000-4000-8000-000000000013','fe-test-negative-sales@example.invalid');
INSERT INTO public.profiles(id,role) VALUES
('a0000000-0000-4000-8000-000000000011','client'),
('b0000000-0000-4000-8000-000000000012','client'),
('c0000000-0000-4000-8000-000000000013','sales');
INSERT INTO public.enquiries(id,contact_name,stage,call_completed_at,approved_at,quote_sent_at) VALUES
('e0000000-0000-4000-8000-000000000011','Negative A','accepted',now(),now(),now()),
('e0000000-0000-4000-8000-000000000012','Negative B','accepted',now(),now(),now()),
('e0000000-0000-4000-8000-000000000013','Pending lead','new',null,null,null);
INSERT INTO public.events(id,client_id,enquiry_id,title) VALUES
('d0000000-0000-4000-8000-000000000011','a0000000-0000-4000-8000-000000000011','e0000000-0000-4000-8000-000000000011','Negative Event A'),
('d0000000-0000-4000-8000-000000000012','b0000000-0000-4000-8000-000000000012','e0000000-0000-4000-8000-000000000012','Negative Event B');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000011',true);
DO $test$
DECLARE success boolean;
BEGIN
 success:=false;
 BEGIN
  UPDATE public.profiles SET role='admin' WHERE id='a0000000-0000-4000-8000-000000000011';
 EXCEPTION WHEN insufficient_privilege THEN success:=true;
 END;
 IF NOT success THEN RAISE EXCEPTION 'Client profile role update unexpectedly succeeded';END IF;
 success:=false;
 BEGIN
  INSERT INTO public.event_messages(event_id,author_id,message)
  VALUES('d0000000-0000-4000-8000-000000000012','a0000000-0000-4000-8000-000000000011','Illegal cross event');
 EXCEPTION WHEN insufficient_privilege THEN success:=true;
 END;
 IF NOT success THEN RAISE EXCEPTION 'Client posted to a foreign event';END IF;
 success:=false;
 BEGIN
  INSERT INTO public.notifications(recipient_id,category,body)
  VALUES('b0000000-0000-4000-8000-000000000012','message','Forged notification');
 EXCEPTION WHEN insufficient_privilege THEN success:=true;
 END;
 IF NOT success THEN RAISE EXCEPTION 'Client forged notification';END IF;
END $test$;
SELECT set_config('request.jwt.claim.sub','c0000000-0000-4000-8000-000000000013',true);
DO $test$ DECLARE success boolean:=false; BEGIN
 BEGIN
  UPDATE public.enquiries SET stage='sent',call_completed_at=now(),approved_at=now(),quote_sent_at=now()
   WHERE id='e0000000-0000-4000-8000-000000000013';
 EXCEPTION WHEN insufficient_privilege OR check_violation THEN success:=true;
 END;
 IF NOT success THEN RAISE EXCEPTION 'Sales bypassed required phone and approval sequence';END IF;
END $test$;
RESET ROLE;
ROLLBACK;
SELECT 'Negative access tests passed; all fixtures rolled back' AS result;
