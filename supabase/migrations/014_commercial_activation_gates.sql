-- Extend manual commercial recording without initiating outbound email.
CREATE OR REPLACE FUNCTION public.guard_enquiry_progress()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $body$
BEGIN
 IF NOT public.is_staff() THEN
   RAISE EXCEPTION 'Commercial staff access required' USING ERRCODE='42501';
 END IF;
 IF NOT public.is_admin() THEN
   IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.contact_name IS DISTINCT FROM OLD.contact_name
    OR NEW.contact_email IS DISTINCT FROM OLD.contact_email
    OR NEW.contact_phone IS DISTINCT FROM OLD.contact_phone
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
   THEN RAISE EXCEPTION 'Protected enquiry fields' USING ERRCODE='42501'; END IF;

   IF OLD.stage='new' AND NEW.stage='called' THEN
     IF NEW.call_completed_at IS NULL OR NEW.approved_at IS NOT NULL OR NEW.quote_sent_at IS NOT NULL THEN
       RAISE EXCEPTION 'A completed call must be recorded first' USING ERRCODE='23514'; END IF;
   ELSIF OLD.stage='called' AND NEW.stage='approved' THEN
     IF OLD.call_completed_at IS NULL OR NEW.approved_at IS NULL OR NEW.quote_sent_at IS NOT NULL THEN
       RAISE EXCEPTION 'A call must precede approval' USING ERRCODE='23514'; END IF;
   ELSIF OLD.stage='approved' AND NEW.stage='sent' THEN
     IF OLD.approved_at IS NULL OR NEW.quote_sent_at IS NULL THEN
       RAISE EXCEPTION 'Record actual quote delivery' USING ERRCODE='23514'; END IF;
   ELSIF OLD.stage='sent' AND NEW.stage='accepted' THEN
     IF OLD.quote_sent_at IS NULL THEN
       RAISE EXCEPTION 'Quotation must have been sent' USING ERRCODE='23514'; END IF;
   ELSIF NEW.stage IS DISTINCT FROM OLD.stage THEN
     RAISE EXCEPTION 'Invalid commercial transition' USING ERRCODE='42501';
   END IF;
   IF OLD.stage <> 'approved' OR NEW.stage <> 'sent' THEN
     IF NEW.quote_sent_at IS DISTINCT FROM OLD.quote_sent_at THEN
       RAISE EXCEPTION 'Only actual quote delivery may set sent timestamp' USING ERRCODE='42501';
     END IF;
   END IF;
 END IF;
 RETURN NEW;
END
$body$;

-- An event cannot become visible to a client unless an accepted enquiry exists.
CREATE OR REPLACE FUNCTION public.guard_event_enquiry_accepted()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $body$
DECLARE accepted boolean;
BEGIN
 SELECT (e.stage='accepted' AND e.call_completed_at IS NOT NULL
   AND e.approved_at IS NOT NULL AND e.quote_sent_at IS NOT NULL)
 INTO accepted
 FROM public.enquiries e WHERE e.id=NEW.enquiry_id;
 IF accepted IS DISTINCT FROM true THEN
  RAISE EXCEPTION 'Event requires an accepted and previously approved quotation'
    USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END
$body$;
CREATE TRIGGER guard_event_enquiry_accepted
BEFORE INSERT OR UPDATE OF enquiry_id ON public.events
FOR EACH ROW EXECUTE FUNCTION public.guard_event_enquiry_accepted();
