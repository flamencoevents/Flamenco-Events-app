-- Contract readiness and internal follow-up. No external messages or cron.
CREATE TABLE app_private.signature_integration (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 provider text,
 verified boolean NOT NULL DEFAULT false,
 CHECK(NOT verified OR length(btrim(provider))>=3)
);
INSERT INTO app_private.signature_integration(singleton) VALUES(true);
ALTER TABLE app_private.signature_integration ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.signature_integration FROM PUBLIC,anon,authenticated;
CREATE TABLE app_private.signature_receipts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 contract_id uuid NOT NULL REFERENCES public.event_contracts(id),
 document_id uuid NOT NULL REFERENCES public.event_documents(id),
 provider text NOT NULL,
 provider_event_id text NOT NULL,
 signature_reference text NOT NULL,
 document_sha256 text NOT NULL CHECK(document_sha256 ~ '^[a-f0-9]{64}$'),
 signed_at timestamptz NOT NULL,
 verified_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(provider,provider_event_id),
 UNIQUE(contract_id,signature_reference)
);
ALTER TABLE app_private.signature_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.signature_receipts FROM PUBLIC,anon,authenticated;
-- Future provider adapter must verify webhook, signer and exact bytes before inserting.
-- There is deliberately no public ingestion function or configured provider yet.
CREATE FUNCTION app_private.guard_verified_signature() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.state='signed' AND (TG_OP='INSERT' OR OLD.state IS DISTINCT FROM 'signed') THEN
  IF NOT EXISTS(SELECT 1 FROM app_private.signature_integration i
   JOIN app_private.signature_receipts r ON r.provider=i.provider
   WHERE i.singleton AND i.verified AND r.contract_id=NEW.id AND r.document_id=NEW.document_id
   AND r.signature_reference=NEW.signature_reference AND r.provider=NEW.signature_provider
   AND r.signed_at=NEW.signed_at) THEN
   RAISE EXCEPTION 'Firma bloqueada: falta proveedor habilitado y evidencia verificada del documento exacto' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION app_private.guard_verified_signature() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_verified_signature BEFORE INSERT OR UPDATE ON public.event_contracts
FOR EACH ROW EXECUTE FUNCTION app_private.guard_verified_signature();

CREATE FUNCTION app_private.guard_contract_billing_mode() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
DECLARE mode text; expected text;
BEGIN
 SELECT q.billing_mode INTO mode FROM public.events e JOIN public.accepted_quote_terms q ON q.id=e.quote_terms_id WHERE e.id=NEW.event_id;
 expected:=CASE mode WHEN 'no_vat_quote' THEN 'no_vat' WHEN 'individual_reservation' THEN 'individual_reservation' WHEN 'business_full_invoice' THEN 'business_tax_detail' END;
 IF expected IS NULL THEN RAISE EXCEPTION 'Modalidad contractual pendiente de aprobación: factura completa del particular' USING ERRCODE='23514'; END IF;
 IF NEW.template_kind IS DISTINCT FROM expected THEN RAISE EXCEPTION 'La plantilla no corresponde a la modalidad del presupuesto aceptado' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION app_private.guard_contract_billing_mode() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_contract_billing_mode BEFORE INSERT OR UPDATE ON public.event_contracts
FOR EACH ROW EXECUTE FUNCTION app_private.guard_contract_billing_mode();

CREATE FUNCTION app_private.assignable_clients() RETURNS TABLE(id uuid,display_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT app_private.is_admin() OR auth.uid() IS NULL THEN RAISE EXCEPTION 'Solo administración' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT p.id,p.display_name FROM public.profiles p JOIN auth.users u ON u.id=p.id
 WHERE p.role='client' AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL
 AND (u.banned_until IS NULL OR u.banned_until<=now())
 AND coalesce((u.raw_app_meta_data->>'fe_test_retired')::boolean,false)=false
 AND (NOT (SELECT test_mode FROM public.app_runtime WHERE singleton) OR u.raw_app_meta_data->>'fe_test'='true');
END $$;
REVOKE ALL ON FUNCTION app_private.assignable_clients() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION app_private.assignable_clients() TO authenticated;
CREATE FUNCTION public.list_assignable_clients() RETURNS TABLE(id uuid,display_name text)
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT * FROM app_private.assignable_clients() $$;
REVOKE ALL ON FUNCTION public.list_assignable_clients() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_assignable_clients() TO authenticated;

CREATE FUNCTION app_private.notify_contract_followup() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE msg text;
BEGIN
 IF TG_OP='UPDATE' AND NEW.state IS NOT DISTINCT FROM OLD.state THEN RETURN NEW; END IF;
 msg:=CASE NEW.state WHEN 'draft' THEN 'Contrato en borrador: revisar datos, plantilla y PDF.' WHEN 'ready' THEN 'Contrato preparado: pendiente de publicación administrativa.' WHEN 'sent' THEN 'Contrato publicado en el portal; firma pendiente. No acredita envío de correo ni reserva.' WHEN 'signed' THEN 'Firma verificada: revisar condiciones de reserva. No confirma automáticamente la reserva.' END;
 IF msg IS NOT NULL THEN
  INSERT INTO public.notifications(recipient_id,event_id,category,body)
  SELECT id,NEW.event_id,'contract',msg FROM public.profiles WHERE role IN ('admin','sales');
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION app_private.notify_contract_followup() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER notify_contract_followup AFTER INSERT OR UPDATE ON public.event_contracts
FOR EACH ROW EXECUTE FUNCTION app_private.notify_contract_followup();
