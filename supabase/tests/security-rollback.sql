
BEGIN;
INSERT INTO auth.users(id,email) VALUES
('00000000-0000-4000-8000-000000000101','fe-client-a@example.invalid'),
('00000000-0000-4000-8000-000000000102','fe-client-b@example.invalid'),
('00000000-0000-4000-8000-000000000103','fe-sales@example.invalid');
INSERT INTO public.profiles(id,role) VALUES
('00000000-0000-4000-8000-000000000101','client'),
('00000000-0000-4000-8000-000000000102','client'),
('00000000-0000-4000-8000-000000000103','sales')
ON CONFLICT(id) DO UPDATE SET role=EXCLUDED.role;
SELECT set_config('request.jwt.claim.sub','6b550638-b44e-49da-8c0d-1a9c04fffe09',true);
SET LOCAL ROLE authenticated;
INSERT INTO public.enquiries(id,contact_name,source) VALUES
('00000000-0000-4000-8000-000000000201','PRUEBA RLS A','test'),
('00000000-0000-4000-8000-000000000202','PRUEBA RLS B','test');
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE body LIKE '%PRUEBA RLS A%') THEN RAISE EXCEPTION 'Missing new enquiry notification'; END IF;
 BEGIN
 UPDATE public.enquiries SET stage='sent',call_completed_at=now(),approved_at=now(),quote_sent_at=now() WHERE id='00000000-0000-4000-8000-000000000201';
 RAISE EXCEPTION 'Admin bypass succeeded';
 EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000103',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.enquiries WHERE source='test')<>2 THEN RAISE EXCEPTION 'Sales cannot read enquiries'; END IF;
 BEGIN
 UPDATE public.enquiries SET stage='sent',call_completed_at=now(),approved_at=now(),quote_sent_at=now() WHERE id='00000000-0000-4000-8000-000000000201';
 RAISE EXCEPTION 'Sales bypass succeeded';
 EXCEPTION WHEN check_violation OR insufficient_privilege THEN NULL; END;
 BEGIN
 UPDATE public.profiles SET role='admin' WHERE id=auth.uid();
 RAISE EXCEPTION 'Role escalation succeeded';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
UPDATE public.enquiries SET stage='called',call_completed_at=now() WHERE source='test';
UPDATE public.enquiries SET stage='approved',approved_at=now() WHERE source='test';
UPDATE public.enquiries SET stage='sent',quote_sent_at=now() WHERE source='test';
UPDATE public.enquiries SET stage='accepted' WHERE source='test';
SELECT set_config('request.jwt.claim.sub','6b550638-b44e-49da-8c0d-1a9c04fffe09',true);
INSERT INTO public.events(id,enquiry_id,client_id,title) VALUES
('00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000101','PRUEBA A'),
('00000000-0000-4000-8000-000000000302','00000000-0000-4000-8000-000000000202','00000000-0000-4000-8000-000000000102','PRUEBA B');
INSERT INTO public.event_documents(event_id,kind,storage_path) VALUES
('00000000-0000-4000-8000-000000000301','quotation','00000000-0000-4000-8000-000000000301/test.pdf'),
('00000000-0000-4000-8000-000000000302','quotation','00000000-0000-4000-8000-000000000302/test.pdf'),
('00000000-0000-4000-8000-000000000301','contract','00000000-0000-4000-8000-000000000301/draft.pdf');
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000103',true);
UPDATE public.events SET repertoire='PRUEBA repertorio',wardrobe='PRUEBA vestuario',schedule_notes='PRUEBA horario' WHERE title='PRUEBA A';
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.events WHERE title='PRUEBA A' AND repertoire='PRUEBA repertorio') THEN RAISE EXCEPTION 'Sales coordination update failed'; END IF;
 BEGIN
 UPDATE public.events SET title='Forbidden sales mutation' WHERE title='PRUEBA A';
 RAISE EXCEPTION 'Sales changed protected commercial fields';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','6b550638-b44e-49da-8c0d-1a9c04fffe09',true);
DO $$ BEGIN
 BEGIN
 UPDATE public.events SET status='confirmed',reservation_reviewed_at=now(),reservation_review_note='PRUEBA no formalizable' WHERE title='PRUEBA A';
 RAISE EXCEPTION 'Reservation gate bypass succeeded';
 EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000101',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.events)<>1 THEN RAISE EXCEPTION 'Client A event isolation failed'; END IF;
 IF (SELECT count(*) FROM public.event_documents)<>1 THEN RAISE EXCEPTION 'Client A document isolation or draft privacy failed'; END IF;
 IF EXISTS(SELECT 1 FROM public.enquiries) THEN RAISE EXCEPTION 'Client read commercial enquiries'; END IF;
 BEGIN
 INSERT INTO public.event_messages(event_id,author_id,message) VALUES('00000000-0000-4000-8000-000000000302',auth.uid(),'PRUEBA intrusión');
 RAISE EXCEPTION 'Cross-client message write succeeded';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000102',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.events)<>1 OR NOT EXISTS(SELECT 1 FROM public.events WHERE title='PRUEBA B') THEN RAISE EXCEPTION 'Client B isolation failed'; END IF;
 IF (SELECT count(*) FROM public.event_documents)<>1 THEN RAISE EXCEPTION 'Client B document isolation failed'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: commercial sequence, sales permissions, role escalation, client A/B isolation, draft privacy, cross-client writes, reservation gate, enquiry notification. All fixtures rolled back.' AS result;

