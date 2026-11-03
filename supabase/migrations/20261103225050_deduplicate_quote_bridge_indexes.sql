DROP INDEX IF EXISTS public.events_one_per_enquiry;
DROP INDEX IF EXISTS public.event_documents_unique_path;
CREATE INDEX IF NOT EXISTS accepted_quote_terms_recorded_by_idx ON public.accepted_quote_terms(recorded_by);
