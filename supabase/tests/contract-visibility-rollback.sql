-- Contract visibility on a real existing object, with SQL role simulation only.
-- No PDF bytes changed. The quotation metadata is reclassified inside this
-- transaction solely to exercise contract policies, then restored by ROLLBACK.
BEGIN;
CREATE TEMP TABLE fe_contract_test_ids(label text PRIMARY KEY,id uuid NOT NULL);
INSERT INTO fe_contract_test_ids VALUES
 ('admin','6b550638-b44e-49da-8c0d-1a9c04fffe09'),
 ('sales','fbe5d799-31b8-4d02-89a0-365ef36c6975'),
 ('event','e4a35ff8-2fca-4e23-83ed-ffb4ab3c45de'),
 ('document','4b8612c8-ce42-4a13-b55d-0a80ab15fcab'),
 ('client_a',gen_random_uuid()),('client_b',gen_random_uuid());
GRANT SELECT ON fe_contract_test_ids TO authenticated;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.app_runtime WHERE singleton AND test_mode)
 OR NOT EXISTS(SELECT 1 FROM public.events WHERE id=(SELECT id FROM fe_contract_test_ids WHERE label='event') AND is_test AND client_id IS NULL)
 OR EXISTS(SELECT 1 FROM public.event_contracts WHERE event_id=(SELECT id FROM fe_contract_test_ids WHERE label='event'))
 THEN RAISE EXCEPTION 'Requires unassigned test event without contract'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.event_documents d JOIN storage.objects o ON o.name=d.storage_path AND o.bucket_id='event-documents'
 WHERE d.id=(SELECT id FROM fe_contract_test_ids WHERE label='document') AND d.kind='quotation' AND d.version=1)
 THEN RAISE EXCEPTION 'Requires known existing private quotation object'; END IF;
END $$;
INSERT INTO auth.users(id,email,email_confirmed_at,raw_app_meta_data)
 SELECT id,'prueba-contrato-'||id||'@example.invalid',now(),'{"fe_test":true}'::jsonb FROM fe_contract_test_ids WHERE label IN('client_a','client_b');
INSERT INTO public.profiles(id,role) SELECT id,'client' FROM fe_contract_test_ids WHERE label IN('client_a','client_b') ON CONFLICT(id) DO UPDATE SET role='client';
-- Setup of metadata-only fixture under database owner, never committed.
UPDATE public.event_documents SET kind='contract' WHERE id=(SELECT id FROM fe_contract_test_ids WHERE label='document');
SELECT set_config('request.jwt.claim.sub',(SELECT id::text FROM fe_contract_test_ids WHERE label='admin'),true);
SET LOCAL ROLE authenticated;
UPDATE public.events SET client_id=(SELECT id FROM fe_contract_test_ids WHERE label='client_a') WHERE id=(SELECT id FROM fe_contract_test_ids WHERE label='event');
INSERT INTO public.event_contracts(event_id,template_kind,document_id)
SELECT (SELECT id FROM fe_contract_test_ids WHERE label='event'),'individual_reservation',id FROM fe_contract_test_ids WHERE label='document';
RESET ROLE;
CREATE FUNCTION pg_temp.assert_contract_visibility(expected boolean) RETURNS void LANGUAGE plpgsql AS $$
DECLARE visible boolean; doc uuid; ev uuid; path text;
BEGIN
 SELECT id INTO doc FROM fe_contract_test_ids WHERE label='document';
 SELECT id INTO ev FROM fe_contract_test_ids WHERE label='event';
 path:=ev||'/quotation-v1-db340537fc52c715d3a1c934b55edf74c97dd67665cd2a77f507b9fae074e8f5.pdf';
 SELECT EXISTS(SELECT 1 FROM public.event_contracts WHERE event_id=ev) INTO visible;
 IF visible IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Contract row visibility mismatch'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.event_documents WHERE id=doc) INTO visible;
 IF visible IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Contract document visibility mismatch'; END IF;
 SELECT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='event-documents' AND name=path) INTO visible;
 IF visible IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Storage object policy mismatch'; END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',(SELECT id::text FROM fe_contract_test_ids WHERE label='client_a'),true);
SELECT pg_temp.assert_contract_visibility(false);
SELECT set_config('request.jwt.claim.sub',(SELECT id::text FROM fe_contract_test_ids WHERE label='admin'),true);
UPDATE public.event_contracts SET state='ready' WHERE event_id=(SELECT id FROM fe_contract_test_ids WHERE label='event');
SELECT set_config('request.jwt.claim.sub',(SELECT id::text FROM fe_contract_test_ids WHERE label='client_a'),true);
SELECT pg_temp.assert_contract_visibility(false);
SELECT set_config('request.jwt.claim.sub',(SELECT id::text FROM fe_contract_test_ids WHERE label='sales'),true);
SELECT pg_temp.assert_contract_visibility(true);
DO $$ DECLARE n integer; BEGIN
 UPDATE public.event_contracts SET state='sent' WHERE event_id=(SELECT id FROM fe_contract_test_ids WHERE label='event');
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>0 THEN RAISE EXCEPTION 'Sales published contract'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub',(SELECT id::text FROM fe_contract_test_ids WHERE label='admin'),true);
UPDATE public.event_contracts SET state='sent' WHERE event_id=(SELECT id FROM fe_contract_test_ids WHERE label='event');
SELECT set_config('request.jwt.claim.sub',(SELECT id::text FROM fe_contract_test_ids WHERE label='client_a'),true);
SELECT pg_temp.assert_contract_visibility(true);
DO $$ DECLARE n integer; BEGIN
 UPDATE public.event_contracts SET state='signed',signed_at=now(),signature_provider='PRUEBA SQL',signature_reference='PRUEBA-SQL-NO-FIRMA' WHERE event_id=(SELECT id FROM fe_contract_test_ids WHERE label='event');
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>0 THEN RAISE EXCEPTION 'Client self-certified contract signature'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub',(SELECT id::text FROM fe_contract_test_ids WHERE label='client_b'),true);
SELECT pg_temp.assert_contract_visibility(false);
SELECT set_config('request.jwt.claim.sub',(SELECT id::text FROM fe_contract_test_ids WHERE label='admin'),true);
UPDATE public.event_contracts SET state='signed',signed_at=now(),signature_provider='PRUEBA SQL SIN FIRMA',signature_reference='PRUEBA-SQL-NO-FIRMA' WHERE event_id=(SELECT id FROM fe_contract_test_ids WHERE label='event');
SELECT set_config('request.jwt.claim.sub',(SELECT id::text FROM fe_contract_test_ids WHERE label='client_a'),true);
SELECT pg_temp.assert_contract_visibility(true);
SELECT set_config('request.jwt.claim.sub',(SELECT id::text FROM fe_contract_test_ids WHERE label='client_b'),true);
SELECT pg_temp.assert_contract_visibility(false);
RESET ROLE;
ROLLBACK;
SELECT 'PASS: draft/ready hidden from owner; sent/signed visible only to owner; sales read-only; client cannot self-certify. SQL role simulation, metadata-only contract fixture, existing Storage object, all changes rolled back.' AS result;