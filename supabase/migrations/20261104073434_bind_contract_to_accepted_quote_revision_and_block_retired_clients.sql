CREATE OR REPLACE FUNCTION app_private.guard_event_quote_link()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE q public.accepted_quote_terms; e public.enquiries;
BEGIN
 SELECT * INTO q FROM public.accepted_quote_terms WHERE id=NEW.quote_terms_id;
 SELECT * INTO e FROM public.enquiries WHERE id=NEW.enquiry_id;
 IF q.id IS NULL OR q.enquiry_id IS DISTINCT FROM NEW.enquiry_id OR e.stage IS DISTINCT FROM 'accepted' THEN
  RAISE EXCEPTION 'El evento requiere una versión concreta de presupuesto aceptado' USING ERRCODE='23514';
 END IF;
 IF TG_OP='UPDATE' AND (NEW.quote_terms_id IS DISTINCT FROM OLD.quote_terms_id OR NEW.enquiry_id IS DISTINCT FROM OLD.enquiry_id) THEN
  RAISE EXCEPTION 'La versión comercial del evento es inmutable; requiere conciliación administrativa' USING ERRCODE='23514';
 END IF;
 NEW.is_test:=e.is_test;
 IF NEW.client_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM auth.users u JOIN public.profiles p ON p.id=u.id
   WHERE u.id=NEW.client_id AND p.role='client' AND u.email_confirmed_at IS NOT NULL
    AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=now())
    AND (NOT e.is_test OR (u.raw_app_meta_data->>'fe_test')='true')
 ) THEN RAISE EXCEPTION 'Asigna únicamente una identidad cliente verificada y compatible con modo prueba' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION app_private.guard_contract_quote_version() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
DECLARE q public.accepted_quote_terms;
BEGIN
 SELECT t.* INTO q FROM public.events e JOIN public.accepted_quote_terms t ON t.id=e.quote_terms_id WHERE e.id=NEW.event_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'El contrato requiere un evento con versión aceptada vinculada' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND NEW.event_id IS DISTINCT FROM OLD.event_id THEN RAISE EXCEPTION 'El evento de un contrato es inmutable' USING ERRCODE='23514'; END IF;
 IF NEW.quotation_number IS NULL OR btrim(NEW.quotation_number)='' THEN NEW.quotation_number:=q.quote_number; END IF;
 IF NEW.quotation_number IS DISTINCT FROM q.quote_number THEN RAISE EXCEPTION 'El contrato corresponde a otro presupuesto' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' AND NEW.state<>'draft' THEN RAISE EXCEPTION 'Un contrato nuevo debe comenzar en borrador' USING ERRCODE='23514'; END IF;
 IF NEW.document_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.event_documents d WHERE d.id=NEW.document_id AND d.event_id=NEW.event_id AND d.kind='contract' AND d.version=q.version) THEN
  RAISE EXCEPTION 'El PDF contractual debe corresponder a la revisión aceptada del evento' USING ERRCODE='23514'; END IF;
 IF NEW.state='signed' AND (NEW.signed_at IS NULL OR length(btrim(coalesce(NEW.signature_provider,'')))<3 OR length(btrim(coalesce(NEW.signature_reference,'')))<8) THEN
  RAISE EXCEPTION 'La firma requiere proveedor, referencia comprobable y fecha' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION app_private.guard_contract_quote_version() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_contract_quote_version BEFORE INSERT OR UPDATE ON public.event_contracts FOR EACH ROW EXECUTE FUNCTION app_private.guard_contract_quote_version();
