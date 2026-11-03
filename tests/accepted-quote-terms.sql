BEGIN;
INSERT INTO auth.users(id,email) VALUES
('a0000000-0000-4000-8000-000000000061','fe-test-quote-admin@example.invalid'),
('b0000000-0000-4000-8000-000000000062','fe-test-quote-client@example.invalid'),
('c0000000-0000-4000-8000-000000000063','fe-test-quote-other@example.invalid');
INSERT INTO public.profiles(id,role) VALUES
('a0000000-0000-4000-8000-000000000061','admin'),
('b0000000-0000-4000-8000-000000000062','client'),
('c0000000-0000-4000-8000-000000000063','client');
INSERT INTO public.enquiries(id,contact_name,stage,call_completed_at,approved_at,quote_sent_at)
 VALUES('e0000000-0000-4000-8000-000000000061','Quote fixture','accepted',now(),now(),now());
INSERT INTO public.events(id,client_id,enquiry_id,title) VALUES
('d0000000-0000-4000-8000-000000000061','b0000000-0000-4000-8000-000000000062','e0000000-0000-4000-8000-000000000061','Quote fixture');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000061',true);
INSERT INTO public.accepted_quote_terms(enquiry_id,quote_number,total_payable_eur,deposit_payable_eur,billing_mode,recorded_by)
 VALUES('e0000000-0000-4000-8000-000000000061','TEST-2026-061',1000.00,300.00,'individual_reservation',
'a0000000-0000-4000-8000-000000000061');
SELECT set_config('request.jwt.claim.sub','b0000000-0000-4000-8000-000000000062',true);
DO $test$ DECLARE n int; denied boolean:=false; BEGIN
 SELECT count(*) INTO n FROM public.accepted_quote_terms;
 IF n<>1 THEN RAISE EXCEPTION 'Owner cannot see accepted quote';END IF;
 BEGIN
  UPDATE public.accepted_quote_terms SET total_payable_eur=1;
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'Client altered immutable quote';END IF;
END $test$;
SELECT set_config('request.jwt.claim.sub','c0000000-0000-4000-8000-000000000063',true);
DO $test$ DECLARE n int;BEGIN
 SELECT count(*) INTO n FROM public.accepted_quote_terms;
 IF n<>0 THEN RAISE EXCEPTION 'Other client saw private quote';END IF;
END $test$;
RESET ROLE;
ROLLBACK;
SELECT 'Accepted quote isolation and immutability passed; fixtures rolled back' AS result;