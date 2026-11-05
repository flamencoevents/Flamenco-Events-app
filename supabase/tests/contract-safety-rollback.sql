BEGIN;
CREATE TEMP TABLE safety_ids(k text PRIMARY KEY,v uuid);
INSERT INTO safety_ids VALUES('contract',gen_random_uuid()),('doc',gen_random_uuid());
GRANT SELECT ON safety_ids TO authenticated;
INSERT INTO public.event_documents(id,event_id,kind,version,storage_path)
SELECT v,'b27248d1-e4c4-489f-9f05-d448a373253c','contract',1,'b27248d1-e4c4-489f-9f05-d448a373253c/PRUEBA-METADATOS-NO-PDF.pdf' FROM safety_ids WHERE k='doc';
SELECT set_config('request.jwt.claim.sub','6b550638-b44e-49da-8c0d-1a9c04fffe09',true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN INSERT INTO public.event_contracts(event_id,template_kind) VALUES('e4a35ff8-2fca-4e23-83ed-ffb4ab3c45de','individual_reservation');RAISE EXCEPTION 'Unapproved full individual invoice accepted'; EXCEPTION WHEN check_violation THEN NULL;END;
 BEGIN INSERT INTO public.event_contracts(event_id,template_kind) VALUES('b27248d1-e4c4-489f-9f05-d448a373253c','business_tax_detail');RAISE EXCEPTION 'Wrong template accepted'; EXCEPTION WHEN check_violation THEN NULL;END;
END $$;
INSERT INTO public.event_contracts(id,event_id,template_kind,document_id)
SELECT (SELECT v FROM safety_ids WHERE k='contract'),'b27248d1-e4c4-489f-9f05-d448a373253c','individual_reservation',v FROM safety_ids WHERE k='doc';
UPDATE public.event_contracts SET state='ready' WHERE id=(SELECT v FROM safety_ids WHERE k='contract');
UPDATE public.event_contracts SET state='sent' WHERE id=(SELECT v FROM safety_ids WHERE k='contract');
DO $$ DECLARE before_count int; after_count int; BEGIN
 SELECT count(*) INTO before_count FROM public.notifications WHERE event_id='b27248d1-e4c4-489f-9f05-d448a373253c';
 UPDATE public.event_contracts SET state='sent' WHERE id=(SELECT v FROM safety_ids WHERE k='contract');
 SELECT count(*) INTO after_count FROM public.notifications WHERE event_id='b27248d1-e4c4-489f-9f05-d448a373253c';
 IF before_count<>after_count THEN RAISE EXCEPTION 'Duplicate internal notification';END IF;
 BEGIN UPDATE public.event_contracts SET state='signed',signed_at=now(),signature_provider='PROVEEDOR INVENTADO',signature_reference='PRUEBA-NO-EVIDENCIA' WHERE id=(SELECT v FROM safety_ids WHERE k='contract');RAISE EXCEPTION 'Unverified signature accepted';EXCEPTION WHEN check_violation THEN NULL;END;
 IF EXISTS(SELECT 1 FROM public.list_assignable_clients() c JOIN public.profiles p ON p.id=c.id WHERE p.display_name LIKE '%DESACTIVADA%') THEN RAISE EXCEPTION 'Retired client offered';END IF;
END $$;
RESET ROLE;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.notifications WHERE event_id='b27248d1-e4c4-489f-9f05-d448a373253c' AND category='contract' AND created_at>=transaction_timestamp())<>6 THEN RAISE EXCEPTION 'Expected 3 states times 2 staff notices';END IF;
 IF has_table_privilege('authenticated','app_private.signature_receipts','INSERT') THEN RAISE EXCEPTION 'Client can manufacture signature evidence';END IF;
 IF has_function_privilege('anon','public.list_assignable_clients()','EXECUTE') THEN RAISE EXCEPTION 'Anonymous client directory access';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','fbe5d799-31b8-4d02-89a0-365ef36c6975',true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM * FROM public.list_assignable_clients();RAISE EXCEPTION 'Sales obtained administrative directory';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: supported template, unsupported billing blocked, signature evidence protected, internal notifications once per transition, retired identities excluded; SQL role simulation rolled back.' AS result;
