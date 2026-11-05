BEGIN;
CREATE TEMP TABLE fe_doc_ids(label text PRIMARY KEY,id uuid NOT NULL DEFAULT gen_random_uuid());
INSERT INTO fe_doc_ids(label) VALUES('banned_client');
GRANT SELECT ON fe_doc_ids TO authenticated;
INSERT INTO auth.users(id,email,email_confirmed_at,banned_until,raw_app_meta_data)
SELECT id,'prueba-doc-banned-'||id||'@example.invalid',now(),now()+interval '1 year','{"fe_test":true}' FROM fe_doc_ids;
INSERT INTO public.profiles(id,role) SELECT id,'client' FROM fe_doc_ids ON CONFLICT(id) DO UPDATE SET role='client';
SELECT set_config('request.jwt.claim.sub',(SELECT p.id::text FROM public.profiles p JOIN auth.users u ON u.id=p.id WHERE p.role='admin' AND u.email='nachomarroco@gmail.com'),true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE ev uuid; quote text; rev integer; contract_id uuid; doc1 uuid; doc2 uuid; BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.app_runtime WHERE singleton AND test_mode) THEN RAISE EXCEPTION 'Test mode required'; END IF;
 SELECT e.id,q.quote_number,q.version INTO ev,quote,rev FROM public.events e JOIN public.accepted_quote_terms q ON q.id=e.quote_terms_id WHERE e.is_test AND q.quote_number='9999926' AND q.version=1;
 IF ev IS NULL THEN RAISE EXCEPTION 'Expected supported test event'; END IF;
 BEGIN INSERT INTO public.event_contracts(event_id,quotation_number,template_kind) VALUES(ev,'WRONG','individual_reservation');RAISE EXCEPTION 'Wrong quote accepted';EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN INSERT INTO public.event_contracts(event_id,quotation_number,template_kind,state) VALUES(ev,quote,'individual_reservation','ready');RAISE EXCEPTION 'Non-draft insertion accepted';EXCEPTION WHEN check_violation THEN NULL; END;
 INSERT INTO public.event_contracts(event_id,template_kind) VALUES(ev,'individual_reservation') RETURNING id INTO contract_id;
 IF NOT EXISTS(SELECT 1 FROM public.event_contracts WHERE id=contract_id AND quotation_number=quote) THEN RAISE EXCEPTION 'Quote not derived from linked version'; END IF;
 INSERT INTO public.event_documents(event_id,kind,version,storage_path) VALUES(ev,'contract',rev,ev||'/__SQL_METADATA_ONLY_v1_'||gen_random_uuid()||'.pdf') RETURNING id INTO doc1;
 INSERT INTO public.event_documents(event_id,kind,version,storage_path) VALUES(ev,'contract',rev+1,ev||'/__SQL_METADATA_ONLY_v2_'||gen_random_uuid()||'.pdf') RETURNING id INTO doc2;
 BEGIN UPDATE public.event_contracts SET document_id=doc2,state='sent' WHERE id=contract_id;RAISE EXCEPTION 'Wrong PDF revision accepted';EXCEPTION WHEN check_violation THEN NULL; END;
 UPDATE public.event_contracts SET document_id=doc1,state='sent' WHERE id=contract_id;
 BEGIN UPDATE public.event_contracts SET state='signed',signed_at=now(),signature_reference='PRUEBA-SQL-SIN-FIRMA' WHERE id=contract_id;RAISE EXCEPTION 'Missing signature provider accepted';EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.event_contracts SET state='signed',signed_at=now(),signature_provider='PRUEBA SQL',signature_reference='PRUEBA-SQL-SIN-FIRMA' WHERE id=contract_id;RAISE EXCEPTION 'Invented evidence accepted';EXCEPTION WHEN check_violation THEN NULL; END;

 BEGIN UPDATE public.events SET status='confirmed',reservation_reviewed_at=now(),reservation_review_note='PRUEBA SQL: no firma ni reserva reales' WHERE id=ev;RAISE EXCEPTION 'Test booking confirmed';EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.events SET client_id=(SELECT id FROM fe_doc_ids WHERE label='banned_client') WHERE id=ev;RAISE EXCEPTION 'Banned client assigned';EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: exact quote/PDF revision, draft lifecycle, unverified signature rejection, test booking and banned-client guards. Metadata-only fixtures rolled back.' result;
