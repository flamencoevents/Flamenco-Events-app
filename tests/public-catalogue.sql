BEGIN;
SET LOCAL ROLE anon;
DO $test$ DECLARE available integer; denied boolean:=false; BEGIN
 SELECT count(*) INTO available FROM public.services;
 IF available<>15 THEN RAISE EXCEPTION 'Public service catalog does not contain 15 entries';END IF;
 BEGIN
  PERFORM count(*) FROM public.events;
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'Anonymous visitor can access private events';END IF;
END $test$;
RESET ROLE;
ROLLBACK;
SELECT 'Public catalogue visible; private events denied' AS result;
