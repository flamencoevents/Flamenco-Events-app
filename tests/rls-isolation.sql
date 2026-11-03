-- Regression test against a staging/test Supabase database.
-- All fixtures are deliberately rolled back. Never use real client data.
BEGIN;
INSERT INTO auth.users (id,email) VALUES
 ('a0000000-0000-4000-8000-000000000001','fe-test-a@example.invalid'),
 ('b0000000-0000-4000-8000-000000000002','fe-test-b@example.invalid'),
 ('c0000000-0000-4000-8000-000000000003','fe-test-staff@example.invalid');
INSERT INTO public.profiles(id,role) VALUES
 ('a0000000-0000-4000-8000-000000000001','client'),
 ('b0000000-0000-4000-8000-000000000002','client'),
 ('c0000000-0000-4000-8000-000000000003','sales');
INSERT INTO public.events(id,client_id,title) VALUES
 ('d0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','Fixture A'),
 ('d0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000002','Fixture B');
INSERT INTO public.event_documents(event_id,kind,storage_path)
VALUES ('d0000000-0000-4000-8000-000000000001','quotation','d0000000-0000-4000-8000-000000000001/fixture-a.pdf'),
 ('d0000000-0000-4000-8000-000000000002','quotation','d0000000-0000-4000-8000-000000000002/fixture-b.pdf');
INSERT INTO public.event_messages(event_id,author_id,message) VALUES
 ('d0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','Fixture message A'),
 ('d0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000002','Fixture message B');
INSERT INTO public.event_change_requests(event_id,requester_id,topic,details)
VALUES ('d0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','repertoire','Fixture request A');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
DO $test$ DECLARE num integer; BEGIN
 SELECT count(*) INTO num FROM public.events;
 IF num<>1 THEN RAISE EXCEPTION 'Client A event isolation failed';END IF;
 SELECT count(*) INTO num FROM public.event_messages;
 IF num<>1 THEN RAISE EXCEPTION 'Client A message isolation failed';END IF;
 SELECT count(*) INTO num FROM public.event_documents;
 IF num<>1 THEN RAISE EXCEPTION 'Client A document metadata isolation failed';END IF;
 SELECT count(*) INTO num FROM public.event_change_requests;
 IF num<>1 THEN RAISE EXCEPTION 'Client A request isolation failed';END IF;
 IF public.is_staff() THEN RAISE EXCEPTION 'Client A impersonated staff';END IF;
 UPDATE public.events SET wardrobe='unauthorized' WHERE id='d0000000-0000-4000-8000-000000000001';
 GET DIAGNOSTICS num=ROW_COUNT;
 IF num<>0 THEN RAISE EXCEPTION 'Client A edited an event';END IF;
END $test$;
SELECT set_config('request.jwt.claim.sub','b0000000-0000-4000-8000-000000000002',true);
DO $test$ DECLARE num integer; BEGIN
 SELECT count(*) INTO num FROM public.events;
 IF num<>1 THEN RAISE EXCEPTION 'Client B event isolation failed';END IF;
 SELECT count(*) INTO num FROM public.event_messages;
 IF num<>1 THEN RAISE EXCEPTION 'Client B message isolation failed';END IF;
 SELECT count(*) INTO num FROM public.event_documents;
 IF num<>1 THEN RAISE EXCEPTION 'Client B document isolation failed';END IF;
 SELECT count(*) INTO num FROM public.event_change_requests;
 IF num<>0 THEN RAISE EXCEPTION 'Client B saw client A request';END IF;
END $test$;
SELECT set_config('request.jwt.claim.sub','c0000000-0000-4000-8000-000000000003',true);
DO $test$ DECLARE num integer; BEGIN
 IF NOT public.is_staff() OR public.is_admin() THEN
  RAISE EXCEPTION 'Sales role not properly isolated'; END IF;
 SELECT count(*) INTO num FROM public.events;
 IF num<>2 THEN RAISE EXCEPTION 'Sales did not see team events';END IF;
 UPDATE public.events SET wardrobe='Fixture costume' WHERE id='d0000000-0000-4000-8000-000000000001';
 GET DIAGNOSTICS num=ROW_COUNT;
 IF num<>1 THEN RAISE EXCEPTION 'Sales coordination update failed';END IF;
 BEGIN
  UPDATE public.events SET status='confirmed' WHERE id='d0000000-0000-4000-8000-000000000001';
  RAISE EXCEPTION 'Sales illegally changed booking status';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $test$;
RESET ROLE;
ROLLBACK;
SELECT 'Isolation tests passed; fixtures rolled back' AS result;
