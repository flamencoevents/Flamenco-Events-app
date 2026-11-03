-- Keep historic documents and signed contract evidence immutable.
REVOKE UPDATE,DELETE ON public.event_documents FROM authenticated;
DROP POLICY IF EXISTS document_metadata_admin_update ON public.event_documents;

CREATE OR REPLACE FUNCTION public.guard_signed_contract_record()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $body$
BEGIN
 IF OLD.state='signed' AND NEW IS DISTINCT FROM OLD THEN
  RAISE EXCEPTION 'Signed contracts are immutable; record a new legal agreement if needed'
    USING ERRCODE='42501';
 END IF;
 IF NEW.state='signed' AND (
    NEW.signed_at IS NULL
    OR char_length(btrim(coalesce(NEW.signature_provider,'')))<3
    OR char_length(btrim(coalesce(NEW.signature_reference,'')))<8
    OR NEW.document_id IS NULL
 ) THEN
  RAISE EXCEPTION 'Signed contracts require identifiable signature evidence and PDF'
    USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $body$;
CREATE TRIGGER guard_signed_contract_record
 BEFORE UPDATE ON public.event_contracts
 FOR EACH ROW EXECUTE FUNCTION public.guard_signed_contract_record();
