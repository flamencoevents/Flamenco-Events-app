-- Immutable agreed commercial terms; never calculate taxes from assumptions.
CREATE TABLE public.accepted_quote_terms(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 enquiry_id uuid NOT NULL REFERENCES public.enquiries(id),
 quote_number text NOT NULL CHECK(char_length(btrim(quote_number)) BETWEEN 2 AND 50),
 version integer NOT NULL DEFAULT 1 CHECK(version BETWEEN 1 AND 99),
 total_payable_eur numeric(12,2) NOT NULL CHECK(total_payable_eur>=0),
 deposit_payable_eur numeric(12,2) CHECK(
    deposit_payable_eur IS NULL OR
    (deposit_payable_eur>=0 AND deposit_payable_eur<=total_payable_eur)
 ),
 billing_mode text NOT NULL CHECK(billing_mode IN(
   'no_vat_quote','individual_reservation','business_full_invoice')),
 source_system text NOT NULL DEFAULT 'manual' CHECK(source_system IN('manual','appscript')),
 external_reference text,
 recorded_at timestamptz NOT NULL DEFAULT now(),
 recorded_by uuid REFERENCES auth.users(id),
 UNIQUE(enquiry_id,version),
 UNIQUE(quote_number,version)
);
ALTER TABLE public.accepted_quote_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY quote_terms_read ON public.accepted_quote_terms FOR SELECT TO authenticated
 USING(
   (SELECT app_private.is_staff()) OR EXISTS(
     SELECT 1 FROM public.events e
     WHERE e.enquiry_id=accepted_quote_terms.enquiry_id
       AND e.client_id=(SELECT auth.uid())
   )
 );
CREATE POLICY quote_terms_admin_create ON public.accepted_quote_terms FOR INSERT TO authenticated
 WITH CHECK((SELECT app_private.is_admin()) AND recorded_by=(SELECT auth.uid())
   AND EXISTS(
      SELECT 1 FROM public.enquiries e
      WHERE e.id=enquiry_id AND e.stage='accepted'
        AND e.call_completed_at IS NOT NULL AND e.approved_at IS NOT NULL
        AND e.quote_sent_at IS NOT NULL
   ));
REVOKE ALL PRIVILEGES ON public.accepted_quote_terms FROM anon;
REVOKE UPDATE,DELETE,TRUNCATE,TRIGGER,REFERENCES ON public.accepted_quote_terms FROM authenticated;
CREATE INDEX accepted_quote_terms_enquiry_idx ON public.accepted_quote_terms(enquiry_id);

-- Prevent accidental staff-facing reuse of a number for a different budget.
CREATE OR REPLACE FUNCTION public.guard_quote_terms_event_ownership()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $body$
BEGIN
 IF TG_OP='INSERT' AND EXISTS(
    SELECT 1 FROM public.events e
    WHERE e.enquiry_id=NEW.enquiry_id AND e.status='cancelled'
 ) THEN RAISE EXCEPTION 'Cancelled events require explicit reconciliation' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $body$;
CREATE TRIGGER guard_quote_terms_event_ownership BEFORE INSERT ON public.accepted_quote_terms
FOR EACH ROW EXECUTE FUNCTION public.guard_quote_terms_event_ownership();

