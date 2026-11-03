BEGIN;
CREATE TEMP TABLE fe_test_ids(label text PRIMARY KEY,id uuid NOT NULL DEFAULT gen_random_uuid());
INSERT INTO fe_test_ids(label,id) SELECT 'admin',p.id FROM public.profiles p JOIN auth.users u ON u.id=p.id WHERE u.email='nachomarroco@gmail.com' AND p.role='admin';
INSERT INTO fe_test_ids(label) VALUES('client_a'),('client_b'),('sales'),('enquiry_a'),('enquiry_b'),('terms_a'),('terms_b'),('submission');
GRANT SELECT,INSERT,UPDATE ON fe_test_ids TO authenticated,service_role;
INSERT INTO auth.users(id,email,email_confirmed_at,raw_app_meta_data)
 SELECT id,'fe-sql-'||label||'@example.invalid',now(),'{"fe_test":true}'::jsonb FROM fe_test_ids WHERE label IN('client_a','client_b','sales');
INSERT INTO public.profiles(id,role) SELECT id,CASE WHEN label='sales' THEN 'sales' ELSE 'client' END FROM fe_test_ids WHERE label IN('client_a','client_b','sales')
 ON CONFLICT(id) DO UPDATE SET role=excluded.role;
SET LOCAL ROLE service_role;
DO $$ DECLARE data jsonb; one uuid; two uuid; n integer; BEGIN
 data:='{"name":"PRUEBA SQL","email":"sql@example.invalid","service":"Servicio ficticio","consent":true,"is_test":true,"consent_version":"test-2026-11-v1"}'::jsonb;
 one:=public.submit_public_test_enquiry((SELECT id FROM fe_test_ids WHERE label='submission'),repeat('a',64),repeat('b',64),data);
 two:=public.submit_public_test_enquiry((SELECT id FROM fe_test_ids WHERE label='submission'),repeat('a',64),repeat('b',64),data);
 IF one<>two OR NOT EXISTS(SELECT 1 FROM public.enquiries WHERE id=one AND stage='new' AND source='public_test' AND is_test AND consented_at IS NOT NULL) THEN RAISE EXCEPTION 'Intake or idempotency failed'; END IF;
 IF EXISTS(SELECT 1 FROM public.accepted_quote_terms WHERE enquiry_id=one) OR EXISTS(SELECT 1 FROM public.events WHERE enquiry_id=one) THEN RAISE EXCEPTION 'Intake created commercial records'; END IF;
 BEGIN PERFORM public.submit_public_test_enquiry(gen_random_uuid(),repeat('a',64),repeat('c',64),data-'consent');RAISE EXCEPTION 'Missing consent allowed';EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 FOR n IN 1..3 LOOP
  BEGIN
   PERFORM public.submit_public_test_enquiry(gen_random_uuid(),repeat('a',64),repeat('d',64),data);
   IF n=3 THEN RAISE EXCEPTION 'Rate limit allowed fourth request'; END IF;
  EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'Límite de solicitudes%' THEN RAISE; END IF;
  END;
 END LOOP;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub',(SELECT id::text FROM fe_test_ids WHERE label='admin'),true);
SET LOCAL ROLE authenticated;
INSERT INTO public.enquiries(id,contact_name,source) SELECT id,'PRUEBA SQL '||label,'admin_test' FROM fe_test_ids WHERE label IN('enquiry_a','enquiry_b');
DO $$ BEGIN
 BEGIN UPDATE public.enquiries SET stage='accepted' WHERE id=(SELECT id FROM fe_test_ids WHERE label='enquiry_a');RAISE EXCEPTION 'Commercial sequence bypass';EXCEPTION WHEN check_violation THEN NULL;END;
 BEGIN UPDATE public.enquiries SET source='website',is_test=false WHERE id=(SELECT id FROM fe_test_ids WHERE label='enquiry_a');RAISE EXCEPTION 'Origin changed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
UPDATE public.enquiries SET stage='called',call_completed_at=now() WHERE id IN(SELECT id FROM fe_test_ids WHERE label IN('enquiry_a','enquiry_b'));
UPDATE public.enquiries SET stage='approved',approved_at=now() WHERE id IN(SELECT id FROM fe_test_ids WHERE label IN('enquiry_a','enquiry_b'));
UPDATE public.enquiries SET stage='sent',quote_sent_at=now() WHERE id IN(SELECT id FROM fe_test_ids WHERE label IN('enquiry_a','enquiry_b'));
UPDATE public.enquiries SET stage='accepted' WHERE id IN(SELECT id FROM fe_test_ids WHERE label IN('enquiry_a','enquiry_b'));
INSERT INTO public.accepted_quote_terms(id,enquiry_id,quote_number,version,total_payable_eur,deposit_payable_eur,billing_mode,tax_details,recorded_by)
 VALUES((SELECT id FROM fe_test_ids WHERE label='terms_a'),(SELECT id FROM fe_test_ids WHERE label='enquiry_a'),'X26-P990991',1,1210,0,'individual_full_invoice','{"base_eur":1000,"invoiced_base_eur":1000,"vat_eur":210,"withholding_eur":0,"rounding_eur":0,"payment_method":"efectivo100"}',auth.uid()),
 ((SELECT id FROM fe_test_ids WHERE label='terms_b'),(SELECT id FROM fe_test_ids WHERE label='enquiry_b'),'X26-P990992',1,520,0,'no_vat_quote',NULL,auth.uid());
INSERT INTO fe_test_ids(label,id) VALUES('event_a',public.prepare_event_from_quote((SELECT id FROM fe_test_ids WHERE label='terms_a'),'PRUEBA SQL evento A')),
 ('event_b',public.prepare_event_from_quote((SELECT id FROM fe_test_ids WHERE label='terms_b'),'PRUEBA SQL evento B'));
DO $$ BEGIN
 IF public.prepare_event_from_quote((SELECT id FROM fe_test_ids WHERE label='terms_a'),'PRUEBA SQL evento A')<>(SELECT id FROM fe_test_ids WHERE label='event_a') THEN RAISE EXCEPTION 'Event duplicated'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.events WHERE id=(SELECT id FROM fe_test_ids WHERE label='event_a') AND client_id IS NULL AND status='contract_pending' AND is_test) THEN RAISE EXCEPTION 'Event not safely prepared'; END IF;
 BEGIN UPDATE public.events SET status='confirmed' WHERE id=(SELECT id FROM fe_test_ids WHERE label='event_a');RAISE EXCEPTION 'Formal booking bypass';EXCEPTION WHEN check_violation THEN NULL;END;
END $$;
UPDATE public.events SET client_id=(SELECT id FROM fe_test_ids WHERE label='client_a') WHERE id=(SELECT id FROM fe_test_ids WHERE label='event_a');
UPDATE public.events SET client_id=(SELECT id FROM fe_test_ids WHERE label='client_b') WHERE id=(SELECT id FROM fe_test_ids WHERE label='event_b');
INSERT INTO public.event_documents(event_id,kind,storage_path)
 SELECT id,'quotation',id::text||'/test.pdf' FROM fe_test_ids WHERE label IN('event_a','event_b');
SELECT set_config('request.jwt.claim.sub',(SELECT id::text FROM fe_test_ids WHERE label='sales'),true);
UPDATE public.events SET repertoire='PRUEBA repertorio' WHERE id=(SELECT id FROM fe_test_ids WHERE label='event_a');
DO $$ BEGIN
 IF (SELECT count(*) FROM public.accepted_quote_terms WHERE id IN(SELECT id FROM fe_test_ids WHERE label IN('terms_a','terms_b')))<>2 THEN RAISE EXCEPTION 'Sales cannot read terms'; END IF;
 BEGIN PERFORM public.prepare_event_from_quote((SELECT id FROM fe_test_ids WHERE label='terms_a'),'Forbidden');RAISE EXCEPTION 'Sales prepared event';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN UPDATE public.events SET client_id=(SELECT id FROM fe_test_ids WHERE label='sales') WHERE id=(SELECT id FROM fe_test_ids WHERE label='event_a');RAISE EXCEPTION 'Sales changed owner';EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL;END;
 BEGIN UPDATE public.profiles SET role='admin' WHERE id=auth.uid();RAISE EXCEPTION 'Sales escalated role';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub',(SELECT id::text FROM fe_test_ids WHERE label='client_a'),true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.events)<>1 OR (SELECT count(*) FROM public.accepted_quote_terms)<>1 OR (SELECT count(*) FROM public.event_documents)<>1 THEN RAISE EXCEPTION 'Client A isolation failed'; END IF;
 IF EXISTS(SELECT 1 FROM public.enquiries) OR EXISTS(SELECT 1 FROM public.quote_bridge_previews) THEN RAISE EXCEPTION 'Client saw commercial data'; END IF;
 BEGIN INSERT INTO public.quote_bridge_previews(enquiry_id,requested_by,payload,payload_hash) VALUES((SELECT id FROM fe_test_ids WHERE label='enquiry_a'),auth.uid(),'{}',repeat('a',64));RAISE EXCEPTION 'Client wrote preview';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.submit_public_test_enquiry(gen_random_uuid(),repeat('a',64),repeat('b',64),'{}');RAISE EXCEPTION 'Client called service RPC';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub',(SELECT id::text FROM fe_test_ids WHERE label='client_b'),true);
DO $$ BEGIN IF (SELECT count(*) FROM public.events)<>1 OR NOT EXISTS(SELECT 1 FROM public.events WHERE id=(SELECT id FROM fe_test_ids WHERE label='event_b')) THEN RAISE EXCEPTION 'Client B isolation failed'; END IF; END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: intake consent/quota/idempotency, commercial sequence, event preparation, cash invoice, sales limits, client isolation. All fixtures rolled back.' AS result;
