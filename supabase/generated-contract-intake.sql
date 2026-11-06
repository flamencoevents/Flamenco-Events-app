-- Generated PDFs are an inbox, never evidence of phone calls, acceptance, signature or payment.
CREATE TABLE public.generated_contract_intake (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 source_key text NOT NULL UNIQUE CHECK (source_key ~ '^X[0-9]{2}-P[0-9]{6}-v[0-9]{1,2}$'),
 quote_number text NOT NULL CHECK (quote_number ~ '^X[0-9]{2}-P[0-9]{6}$'),
 revision integer NOT NULL CHECK(revision BETWEEN 1 AND 99),
 event_date date NOT NULL,
 is_test boolean NOT NULL DEFAULT true CHECK(is_test=true),
 payload jsonb NOT NULL,
 source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),
 state text NOT NULL DEFAULT 'pending_review' CHECK(state='pending_review'),
 received_at timestamptz NOT NULL DEFAULT now(),
 CHECK(source_key=quote_number||'-v'||revision),
 CHECK(payload->>'source_key'=source_key AND payload->>'quote_number'=quote_number AND (payload->>'revision')::integer=revision AND payload->>'event_date'=event_date::text AND payload->>'is_test'='true')
);
ALTER TABLE public.generated_contract_intake ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.generated_contract_intake FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.generated_contract_intake TO authenticated;
GRANT ALL ON public.generated_contract_intake TO service_role;
CREATE POLICY generated_contract_admin_read ON public.generated_contract_intake FOR SELECT TO authenticated USING ((SELECT app_private.is_admin()));
CREATE INDEX generated_contract_event_date_idx ON public.generated_contract_intake(event_date);
