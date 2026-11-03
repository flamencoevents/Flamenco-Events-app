-- A contract is not visible as sent unless a private PDF is attached.
CREATE OR REPLACE FUNCTION public.guard_contract_lifecycle()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $body$
BEGIN
 IF NEW.state IN ('sent','signed') AND NEW.document_id IS NULL THEN
  RAISE EXCEPTION 'A contract PDF is required before publishing'
   USING ERRCODE='23514';
 END IF;
 IF NEW.state='signed' AND (NEW.signed_at IS NULL OR
   NULLIF(BTRIM(COALESCE(NEW.signature_reference,'')),'') IS NULL) THEN
  RAISE EXCEPTION 'Signed contract requires external signature evidence'
   USING ERRCODE='23514';
 END IF;
 IF TG_OP='UPDATE' AND NEW.state IS DISTINCT FROM OLD.state THEN
  IF NOT (
   (OLD.state='draft' AND NEW.state IN ('ready','sent')) OR
   (OLD.state='ready' AND NEW.state='sent') OR
   (OLD.state='sent' AND NEW.state='signed')
  ) THEN
   RAISE EXCEPTION 'Invalid contract state transition' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $body$;
CREATE TRIGGER guard_contract_lifecycle
 BEFORE INSERT OR UPDATE ON public.event_contracts
 FOR EACH ROW EXECUTE FUNCTION public.guard_contract_lifecycle();

