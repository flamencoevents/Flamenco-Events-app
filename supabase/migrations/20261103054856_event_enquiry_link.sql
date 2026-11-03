-- Link a contracted event to its original commercially approved enquiry.
ALTER TABLE public.events
 ADD COLUMN IF NOT EXISTS enquiry_id uuid REFERENCES public.enquiries(id);
CREATE UNIQUE INDEX IF NOT EXISTS events_enquiry_id_unique
 ON public.events(enquiry_id) WHERE enquiry_id IS NOT NULL;

-- Do not let sales staff reassign an event to a different enquiry.
CREATE OR REPLACE FUNCTION public.protect_event_commercial_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $body$
BEGIN
 IF NOT public.is_admin() AND (
    NEW.id IS DISTINCT FROM OLD.id OR
    NEW.client_id IS DISTINCT FROM OLD.client_id OR
    NEW.enquiry_id IS DISTINCT FROM OLD.enquiry_id OR
    NEW.title IS DISTINCT FROM OLD.title OR
    NEW.event_date IS DISTINCT FROM OLD.event_date OR
    NEW.performance IS DISTINCT FROM OLD.performance OR
    NEW.status IS DISTINCT FROM OLD.status OR
    NEW.quotation_url IS DISTINCT FROM OLD.quotation_url OR
    NEW.contract_url IS DISTINCT FROM OLD.contract_url OR
    NEW.created_at IS DISTINCT FROM OLD.created_at
 ) THEN
  RAISE EXCEPTION 'Only administrators can change commercial or ownership fields' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END
$body$;

