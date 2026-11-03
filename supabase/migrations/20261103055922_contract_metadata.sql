-- Contract metadata for the three existing commercial templates.
-- Signing remains external until an approved e-signature provider is connected.
CREATE TABLE public.event_contracts(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 event_id uuid NOT NULL UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
 quotation_number text,
 template_kind text NOT NULL CHECK(template_kind IN
  ('no_vat','individual_reservation','business_tax_detail')),
 state text NOT NULL DEFAULT 'draft' CHECK(state IN
  ('draft','ready','sent','signed')),
 document_id uuid REFERENCES public.event_documents(id),
 signature_provider text,
 signature_reference text,
 signed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (state<>'signed' OR signed_at IS NOT NULL)
);
CREATE UNIQUE INDEX event_contracts_quotation_number_unique
 ON public.event_contracts(quotation_number) WHERE quotation_number IS NOT NULL;
ALTER TABLE public.event_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY contracts_team_or_client_read ON public.event_contracts FOR SELECT TO authenticated
 USING(
  public.is_staff()
  OR (state IN ('sent','signed') AND EXISTS(
   SELECT 1 FROM public.events e WHERE e.id=event_id AND e.client_id=auth.uid()
  ))
 );
CREATE POLICY contracts_admin_insert ON public.event_contracts FOR INSERT TO authenticated
 WITH CHECK(public.is_admin());
CREATE POLICY contracts_admin_update ON public.event_contracts FOR UPDATE TO authenticated
 USING(public.is_admin()) WITH CHECK(public.is_admin());
REVOKE ALL PRIVILEGES ON public.event_contracts FROM anon;
REVOKE DELETE,TRUNCATE,TRIGGER,REFERENCES ON public.event_contracts FROM authenticated;

CREATE OR REPLACE FUNCTION public.guard_contract_document_event()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $body$
BEGIN
 IF NEW.document_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM public.event_documents d
  WHERE d.id=NEW.document_id AND d.event_id=NEW.event_id AND d.kind='contract'
 ) THEN
   RAISE EXCEPTION 'Contract PDF must belong to the same event' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $body$;
CREATE TRIGGER guard_contract_document_event
 BEFORE INSERT OR UPDATE ON public.event_contracts
 FOR EACH ROW EXECUTE FUNCTION public.guard_contract_document_event();

