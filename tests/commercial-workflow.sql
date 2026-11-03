-- Commercial gate regression using fictional accounts. All mutations rollback.
BEGIN;
INSERT INTO auth.users(id,email)
 VALUES('c0000000-0000-4000-8000-000000000003','fe-test-staff@example.invalid');
INSERT INTO public.profiles(id,role)
 VALUES('c0000000-0000-4000-8000-000000000003','sales');
INSERT INTO public.enquiries(id,contact_name,stage)
 VALUES('e0000000-0000-4000-8000-000000000003','Fixture transition','new');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','c0000000-0000-4000-8000-000000000003',true);
UPDATE public.enquiries SET stage='called',call_completed_at=now()
 WHERE id='e0000000-0000-4000-8000-000000000003';
UPDATE public.enquiries SET stage='approved',approved_at=now()
 WHERE id='e0000000-0000-4000-8000-000000000003';
UPDATE public.enquiries SET stage='sent',quote_sent_at=now()
 WHERE id='e0000000-0000-4000-8000-000000000003';
UPDATE public.enquiries SET stage='accepted'
 WHERE id='e0000000-0000-4000-8000-000000000003';
DO $test$ DECLARE stage_now text; audit_count integer; BEGIN
 SELECT stage INTO stage_now FROM public.enquiries WHERE id='e0000000-0000-4000-8000-000000000003';
 IF stage_now<>'accepted' THEN RAISE EXCEPTION 'Valid commercial progression failed'; END IF;
 SELECT count(*) INTO audit_count FROM public.enquiry_audit WHERE enquiry_id='e0000000-0000-4000-8000-000000000003';
 IF audit_count<>4 THEN RAISE EXCEPTION 'Commercial audit expected 4 steps, got %',audit_count; END IF;
END $test$;
RESET ROLE;
ROLLBACK;
SELECT 'Commercial workflow and audit passed; fixtures rolled back' AS result;
