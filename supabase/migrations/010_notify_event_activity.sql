-- Transactional notifications for event communication.
-- Trigger functions are not exposed as client-side RPCs.
CREATE OR REPLACE FUNCTION public.notify_event_participants()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $body$
DECLARE
  target_client uuid;
  writer_role text;
  short_text text;
BEGIN
  SELECT e.client_id INTO target_client
    FROM public.events e WHERE e.id=NEW.event_id;
  IF target_client IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT p.role INTO writer_role
    FROM public.profiles p WHERE p.id=NEW.author_id;

  short_text := LEFT(NEW.message, 180);
  IF writer_role IN ('admin','sales') THEN
    IF target_client <> NEW.author_id THEN
      INSERT INTO public.notifications
        (recipient_id,event_id,category,body)
      VALUES
        (target_client,NEW.event_id,'message','Nuevo mensaje del equipo: '||short_text);
    END IF;
  ELSE
    INSERT INTO public.notifications
      (recipient_id,event_id,category,body)
    SELECT p.id, NEW.event_id,'message','Nuevo mensaje de cliente: '||short_text
      FROM public.profiles p
     WHERE p.role IN ('admin','sales') AND p.id <> NEW.author_id;
  END IF;
  RETURN NEW;
END
$body$;

REVOKE ALL ON FUNCTION public.notify_event_participants()
  FROM PUBLIC,anon,authenticated;
CREATE TRIGGER event_messages_notify
AFTER INSERT ON public.event_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_event_participants();

CREATE OR REPLACE FUNCTION public.notify_new_change_request()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $body$
BEGIN
  INSERT INTO public.notifications(recipient_id,event_id,category,body)
  SELECT p.id, NEW.event_id,'request',
         'Nueva propuesta de cliente ('||NEW.topic||')'
    FROM public.profiles p
   WHERE p.role IN ('admin','sales') AND p.id <> NEW.requester_id;
  RETURN NEW;
END
$body$;
REVOKE ALL ON FUNCTION public.notify_new_change_request()
  FROM PUBLIC,anon,authenticated;
CREATE TRIGGER event_change_requests_notify
AFTER INSERT ON public.event_change_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_new_change_request();

CREATE INDEX IF NOT EXISTS event_messages_event_time_idx
 ON public.event_messages(event_id,created_at DESC);
CREATE INDEX IF NOT EXISTS event_change_requests_event_time_idx
 ON public.event_change_requests(event_id,created_at DESC);
