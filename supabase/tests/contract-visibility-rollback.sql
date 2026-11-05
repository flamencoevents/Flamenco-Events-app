-- Metadata-only regression; real HTTP PDF isolation evidence is documented separately.
BEGIN;
CREATE TEMP TABLE contract_ids(k text PRIMARY KEY,v uuid DEFAULT gen_random_uuid());
INSERT INTO contract_ids(k) VALUES('a'),('b'),('document'),('contract');
GRANT SELECT ON contract_ids TO authenticated;
INSERT INTO auth.users(id,email,email_confirmed_at,raw_app_meta_data)
SELECT v,'prueba-contract-visibility-'||v||'@example.invalid',now(),'{"fe_test":true}' FROM contract_ids WHERE k IN('a','b');
INSERT INTO public.profiles(id,role) SELECT v,'client' FROM contract_ids WHERE k IN('a','b') ON CONFLICT(id) DO UPDATE SET role='client';
SELECT set_config('request.jwt.claim.sub','6b550638-b44e-49da-8c0d-1a9c04fffe09',true);
SET LOCAL ROLE authenticated;
UPDATE public.events SET client_id=(SELECT v FROM contract_ids WHERE k='a') WHERE id='b27248d1-e4c4-489f-9f05-d448a373253c';
INSERT INTO public.event_documents(id,event_id,kind,version,storage_path) SELECT v,'b27248d1-e4c4-489f-9f05-d448a373253c','contract',1,'b27248d1-e4c4-489f-9f05-d448a373253c/PRUEBA_METADATA_'||v||'.pdf' FROM contract_ids WHERE k='document';
INSERT INTO public.event_contracts(id,event_id,template_kind,document_id) SELECT (SELECT v FROM contract_ids WHERE k='contract'),'b27248d1-e4c4-489f-9f05-d448a373253c','individual_reservation',v FROM contract_ids WHERE k='document';
RESET ROLE;
CREATE FUNCTION pg_temp.expect_visible(expected boolean) RETURNS void LANGUAGE plpgsql AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.event_contracts WHERE id=(SELECT v FROM contract_ids WHERE k='contract')) IS DISTINCT FROM expected OR EXISTS(SELECT 1 FROM public.event_documents WHERE id=(SELECT v FROM contract_ids WHERE k='document')) IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Contract/document visibility mismatch'; END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',(SELECT v::text FROM contract_ids WHERE k='a'),true);
SELECT pg_temp.expect_visible(false);
SELECT set_config('request.jwt.claim.sub','6b550638-b44e-49da-8c0d-1a9c04fffe09',true);
UPDATE public.event_contracts SET state='ready' WHERE id=(SELECT v FROM contract_ids WHERE k='contract');
SELECT set_config('request.jwt.claim.sub',(SELECT v::text FROM contract_ids WHERE k='a'),true);
SELECT pg_temp.expect_visible(false);
SELECT set_config('request.jwt.claim.sub','fbe5d799-31b8-4d02-89a0-365ef36c6975',true);
SELECT pg_temp.expect_visible(true);
DO $$ DECLARE n int; BEGIN UPDATE public.event_contracts SET state='sent' WHERE id=(SELECT v FROM contract_ids WHERE k='contract');GET DIAGNOSTICS n=ROW_COUNT;IF n<>0 THEN RAISE EXCEPTION 'Sales published contract';END IF;END $$;
SELECT set_config('request.jwt.claim.sub','6b550638-b44e-49da-8c0d-1a9c04fffe09',true);
UPDATE public.event_contracts SET state='sent' WHERE id=(SELECT v FROM contract_ids WHERE k='contract');
SELECT set_config('request.jwt.claim.sub',(SELECT v::text FROM contract_ids WHERE k='a'),true);
SELECT pg_temp.expect_visible(true);
DO $$ DECLARE n int; BEGIN UPDATE public.event_contracts SET state='signed',signed_at=now(),signature_provider='PRUEBA SQL',signature_reference='NO-FIRMA-REAL' WHERE id=(SELECT v FROM contract_ids WHERE k='contract');GET DIAGNOSTICS n=ROW_COUNT;IF n<>0 THEN RAISE EXCEPTION 'Client self-certified signature';END IF;END $$;
SELECT set_config('request.jwt.claim.sub',(SELECT v::text FROM contract_ids WHERE k='b'),true);
SELECT pg_temp.expect_visible(false);
RESET ROLE;
ROLLBACK;
SELECT 'PASS: draft/ready hidden; sent visible to owner only; sales read-only; client cannot self-certify. SQL roles and metadata-only fixtures rolled back.' AS result;
