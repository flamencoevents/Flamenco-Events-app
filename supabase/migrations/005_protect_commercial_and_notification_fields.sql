-- Complete admin permissions while enforcing a server-side restriction on sales.
GRANT UPDATE ON public.events TO authenticated;
CREATE OR REPLACE FUNCTION public.protect_event_commercial_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF NOT public.is_admin() AND (
   NEW.id IS DISTINCT FROM OLD.id OR
   NEW.client_id IS DISTINCT FROM OLD.client_id OR
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
END $$;
DROP TRIGGER IF EXISTS protect_event_commercial_fields ON public.events;
CREATE TRIGGER protect_event_commercial_fields BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.protect_event_commercial_fields();

-- Reading and acknowledging notifications must not allow alteration of recipient/content.
CREATE OR REPLACE FUNCTION public.protect_notification_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF NEW.id IS DISTINCT FROM OLD.id OR
    NEW.recipient_id IS DISTINCT FROM OLD.recipient_id OR
    NEW.event_id IS DISTINCT FROM OLD.event_id OR
    NEW.category IS DISTINCT FROM OLD.category OR
    NEW.body IS DISTINCT FROM OLD.body OR
    NEW.created_at IS DISTINCT FROM OLD.created_at
 THEN
  RAISE EXCEPTION 'Notification content is immutable' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS protect_notification_fields ON public.notifications;
CREATE TRIGGER protect_notification_fields BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.protect_notification_fields();
