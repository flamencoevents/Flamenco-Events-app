
CREATE TABLE public.app_runtime (
 singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
 test_mode boolean NOT NULL DEFAULT true
);
INSERT INTO public.app_runtime(singleton,test_mode) VALUES(true,true);
ALTER TABLE public.app_runtime ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_runtime FROM anon,authenticated;
GRANT SELECT ON public.app_runtime TO authenticated,service_role;
CREATE POLICY runtime_authenticated_read ON public.app_runtime FOR SELECT TO authenticated USING (true);

CREATE FUNCTION public.guard_test_reservation() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF COALESCE((SELECT test_mode FROM public.app_runtime WHERE singleton),true)
 AND NEW.status IN ('confirmed','completed') THEN
  RAISE EXCEPTION 'MODO PRUEBA: no se puede formalizar una reserva real' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_test_reservation() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_test_reservation BEFORE INSERT OR UPDATE ON public.events
 FOR EACH ROW EXECUTE FUNCTION public.guard_test_reservation();

CREATE FUNCTION public.guard_enquiry_sequence() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.stage<>'new' OR NEW.call_completed_at IS NOT NULL OR NEW.approved_at IS NOT NULL OR NEW.quote_sent_at IS NOT NULL THEN
   RAISE EXCEPTION 'Las solicitudes deben empezar pendientes de llamada' USING ERRCODE='23514';
  END IF;
 ELSE
  IF NEW.stage IS DISTINCT FROM OLD.stage AND NOT (
   (OLD.stage='new' AND NEW.stage='called') OR
   (OLD.stage='called' AND NEW.stage='approved') OR
   (OLD.stage='approved' AND NEW.stage='sent') OR
   (OLD.stage='sent' AND NEW.stage='accepted') OR
   (NEW.stage='closed' AND public.is_admin())
  ) THEN RAISE EXCEPTION 'No se pueden omitir pasos del proceso comercial' USING ERRCODE='23514'; END IF;
  IF (NEW.call_completed_at IS DISTINCT FROM OLD.call_completed_at AND NOT (OLD.stage='new' AND NEW.stage='called'))
   OR (NEW.approved_at IS DISTINCT FROM OLD.approved_at AND NOT (OLD.stage='called' AND NEW.stage='approved'))
   OR (NEW.quote_sent_at IS DISTINCT FROM OLD.quote_sent_at AND NOT (OLD.stage='approved' AND NEW.stage='sent')) THEN
   RAISE EXCEPTION 'Las fechas solo se registran al completar su paso comercial' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_enquiry_sequence() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_enquiry_sequence BEFORE INSERT OR UPDATE ON public.enquiries
 FOR EACH ROW EXECUTE FUNCTION public.guard_enquiry_sequence();

CREATE FUNCTION app_private.notify_new_enquiry() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 INSERT INTO public.notifications(recipient_id,category,body)
 SELECT id,'event','Nueva solicitud pendiente de llamada: '||left(NEW.contact_name,150)
 FROM public.profiles WHERE role IN ('admin','sales');
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION app_private.notify_new_enquiry() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER notify_new_enquiry AFTER INSERT ON public.enquiries
 FOR EACH ROW EXECUTE FUNCTION app_private.notify_new_enquiry();

