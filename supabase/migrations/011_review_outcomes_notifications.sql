-- Review is one-way and must carry an actual review timestamp.
CREATE OR REPLACE FUNCTION public.guard_change_request_review()
RETURNS trigger LANGUAGE plpgsql
SET search_path = ''
AS $body$
BEGIN
  IF OLD.status <> 'pending' THEN
    RAISE EXCEPTION 'A reviewed request cannot be changed again' USING ERRCODE='23514';
  END IF;
  IF NEW.status NOT IN ('approved','rejected') OR NEW.reviewed_at IS NULL THEN
    RAISE EXCEPTION 'Review requires an outcome and timestamp' USING ERRCODE='23514';
  END IF;
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Only the event team can review proposals' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END
$body$;
CREATE TRIGGER guard_change_request_review
BEFORE UPDATE ON public.event_change_requests
FOR EACH ROW EXECUTE FUNCTION public.guard_change_request_review();

CREATE OR REPLACE FUNCTION public.notify_review_outcome()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path=''
AS $body$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications(recipient_id,event_id,category,body)
      VALUES (NEW.requester_id,NEW.event_id,'request',
        CASE NEW.status
          WHEN 'approved' THEN 'El equipo ha aprobado tu propuesta de '||NEW.topic
          ELSE 'El equipo ha revisado y rechazado tu propuesta de '||NEW.topic
        END);
  END IF;
  RETURN NEW;
END
$body$;
REVOKE ALL ON FUNCTION public.notify_review_outcome() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER event_change_requests_review_notification
AFTER UPDATE OF status ON public.event_change_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_review_outcome();

CREATE OR REPLACE FUNCTION public.notify_event_planning_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path=''
AS $body$
BEGIN
  IF NEW.repertoire IS DISTINCT FROM OLD.repertoire
    OR NEW.wardrobe IS DISTINCT FROM OLD.wardrobe
    OR NEW.schedule_notes IS DISTINCT FROM OLD.schedule_notes
    OR NEW.onsite_contact IS DISTINCT FROM OLD.onsite_contact
    OR NEW.venue IS DISTINCT FROM OLD.venue THEN
    INSERT INTO public.notifications(recipient_id,event_id,category,body)
      VALUES(NEW.client_id,NEW.id,'schedule',
        'El equipo ha actualizado los detalles de coordinación de tu evento');
  END IF;
  RETURN NEW;
END
$body$;
REVOKE ALL ON FUNCTION public.notify_event_planning_changes() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER events_planning_notification
AFTER UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.notify_event_planning_changes();
