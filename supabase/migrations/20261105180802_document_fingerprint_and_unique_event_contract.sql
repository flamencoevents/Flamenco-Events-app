ALTER TABLE public.event_documents ADD COLUMN sha256 text CHECK(sha256 IS NULL OR sha256 ~ '^[a-f0-9]{64}$');
ALTER TABLE public.event_documents ADD COLUMN source_reference text CHECK(source_reference IS NULL OR length(source_reference)<=500);
CREATE UNIQUE INDEX event_contracts_one_per_event ON public.event_contracts(event_id);
