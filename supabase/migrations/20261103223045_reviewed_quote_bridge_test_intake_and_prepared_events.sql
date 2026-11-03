+-- Explicit commercial review, test-only intake and events prepared before client invitation.
ALTER TABLE public.accepted_quote_terms DROP CONSTRAINT accepted_quote_terms_billing_mode_check;
ALTER TABLE public.accepted_quote_terms ADD CONSTRAINT accepted_quote_terms_billing_mode_check
 CHECK(billing_mode IN ('no_vat_quote','individual_reservation','individual_full_invoice','business_full_invoice'));
ALTER TABLE public.accepted_quote_terms ADD COLUMN tax_details jsonb
 CHECK(tax_details IS NULL OR jsonb_typeof(tax_details)='object');
ALTER TABLE public.enquiries ADD COLUMN is_test boolean NOT NULL DEFAULT false;
ALTER TABLE public.enquiries ADD COLUMN public_submission_id uuid UNIQUE;
ALTER TABLE public.enquiries ADD COLUMN public_payload_hash text;
ALTER TABLE public.enquiries ADD COLUMN consent_version text;
ALTER TABLE public.enquiries ADD COLUMN consented_at timestamptz;
DO $$ DECLARE previous_sub text; owner_id uuid; BEGIN
 previous_sub:=current_setting('request.jwt.claim.sub',true);
 SELECT p.id INTO STRICT owner_id FROM public.profiles p JOIN auth.users u ON u.id=p.id
  WHERE p.role='admin' AND u.email='nachomarroco@gmail.com';
 PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);
 UPDATE public.enquiries SET is_test=true WHERE source='admin_test';
 PERFORM set_config('request.jwt.claim.sub',coalesce(previous_sub,''),true);
END $$;

CREATE FUNCTION app_private.guard_enquiry_origin() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  NEW.is_test:=NEW.source IN ('admin_test','public_test');
  IF COALESCE((SELECT test_mode FROM public.app_runtime WHERE singleton),true) AND NOT NEW.is_test THEN
   RAISE EXCEPTION 'MODO PRUEBA: solo solicitudes ficticias identificadas' USING ERRCODE='23514';
  END IF;
 ELSIF NEW.source IS DISTINCT FROM OLD.source OR NEW.is_test IS DISTINCT FROM OLD.is_test
  OR NEW.public_submission_id IS DISTINCT FROM OLD.public_submission_id
  OR NEW.public_payload_hash IS DISTINCT FROM OLD.public_payload_hash
  OR NEW.consent_version IS DISTINCT FROM OLD.consent_version OR NEW.consented_at IS DISTINCT FROM OLD.consented_at THEN
  RAISE EXCEPTION 'El origen y el consentimiento son inmutables' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION app_private.guard_enquiry_origin() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_enquiry_origin BEFORE INSERT OR UPDATE ON public.enquiries
 FOR EACH ROW EXECUTE FUNCTION app_private.guard_enquiry_origin();

CREATE TABLE public.quote_bridge_previews(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 enquiry_id uuid NOT NULL REFERENCES public.enquiries(id),
 requested_by uuid NOT NULL REFERENCES auth.users(id),
 payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
 payload_hash text NOT NULL CHECK(length(payload_hash)=64),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '10 minutes',
 state text NOT NULL DEFAULT 'preview' CHECK(state IN('preview','processing','imported','failed')),
 approved_at timestamptz, approved_by uuid REFERENCES auth.users(id),
 terms_id uuid REFERENCES public.accepted_quote_terms(id), error_code text
);
ALTER TABLE public.quote_bridge_previews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.quote_bridge_previews FROM anon,authenticated;
GRANT SELECT ON public.quote_bridge_previews TO authenticated;
GRANT ALL ON public.quote_bridge_previews TO service_role;
CREATE POLICY quote_previews_team_read ON public.quote_bridge_previews FOR SELECT TO authenticated
 USING((SELECT app_private.is_staff()));
CREATE INDEX quote_previews_enquiry_idx ON public.quote_bridge_previews(enquiry_id,created_at DESC);
CREATE INDEX quote_previews_requested_idx ON public.quote_bridge_previews(requested_by);
CREATE INDEX quote_previews_approved_idx ON public.quote_bridge_previews(approved_by);
CREATE INDEX quote_previews_terms_idx ON public.quote_bridge_previews(terms_id);

ALTER TABLE public.events ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE public.events ADD COLUMN quote_terms_id uuid REFERENCES public.accepted_quote_terms(id);
ALTER TABLE public.events ADD COLUMN is_test boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX events_one_per_enquiry ON public.events(enquiry_id) WHERE enquiry_id IS NOT NULL;
CREATE INDEX events_terms_idx ON public.events(quote_terms_id);
CREATE UNIQUE INDEX event_documents_unique_path ON public.event_documents(storage_path);

CREATE FUNCTION app_private.guard_event_quote_link() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE q public.accepted_quote_terms; e public.enquiries;
BEGIN
 SELECT * INTO q FROM public.accepted_quote_terms WHERE id=NEW.quote_terms_id;
 SELECT * INTO e FROM public.enquiries WHERE id=NEW.enquiry_id;
 IF q.id IS NULL OR q.enquiry_id IS DISTINCT FROM NEW.enquiry_id OR e.stage IS DISTINCT FROM 'accepted' THEN
  RAISE EXCEPTION 'El evento requiere una versión concreta de presupuesto aceptado' USING ERRCODE='23514';
 END IF;
 IF TG_OP='UPDATE' AND (NEW.quote_terms_id IS DISTINCT FROM OLD.quote_terms_id OR NEW.enquiry_id IS DISTINCT FROM OLD.enquiry_id) THEN
  RAISE EXCEPTION 'La versión comercial del evento es inmutable; requiere conciliación administrativa' USING ERRCODE='23514';
 END IF;
 NEW.is_test:=e.is_test;
 IF NEW.client_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM auth.users u JOIN public.profiles p ON p.id=u.id
   WHERE u.id=NEW.client_id AND p.role='client' AND u.email_confirmed_at IS NOT NULL
    AND (NOT e.is_test OR (u.raw_app_meta_data->>'fe_test')='true')
 ) THEN RAISE EXCEPTION 'Asigna únicamente una identidad cliente verificada y compatible con modo prueba' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION app_private.guard_event_quote_link() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_event_quote_link BEFORE INSERT OR UPDATE ON public.events
 FOR EACH ROW EXECUTE FUNCTION app_private.guard_event_quote_link();

CREATE OR REPLACE FUNCTION public.notify_event_planning_changes() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.client_id IS NOT NULL AND (NEW.repertoire IS DISTINCT FROM OLD.repertoire OR NEW.wardrobe IS DISTINCT FROM OLD.wardrobe
 OR NEW.schedule_notes IS DISTINCT FROM OLD.schedule_notes OR NEW.onsite_contact IS DISTINCT FROM OLD.onsite_contact
 OR NEW.venue IS DISTINCT FROM OLD.venue) THEN
  INSERT INTO public.notifications(recipient_id,event_id,category,body)
   VALUES(NEW.client_id,NEW.id,'schedule','El equipo ha actualizado los detalles de coordinación de tu evento');
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.notify_event_planning_changes() FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.prepare_event_from_quote(p_terms_id uuid,p_title text) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE q public.accepted_quote_terms; e public.enquiries; target uuid; old_terms uuid;
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administración requerida' USING ERRCODE='42501'; END IF;
 IF length(btrim(coalesce(p_title,''))) NOT BETWEEN 3 AND 150 THEN RAISE EXCEPTION 'Nombre de evento no válido' USING ERRCODE='22023'; END IF;
 SELECT * INTO q FROM public.accepted_quote_terms WHERE id=p_terms_id;
 SELECT * INTO e FROM public.enquiries WHERE id=q.enquiry_id FOR UPDATE;
 IF q.id IS NULL OR e.stage IS DISTINCT FROM 'accepted' THEN RAISE EXCEPTION 'Presupuesto aceptado requerido' USING ERRCODE='23514'; END IF;
 SELECT id,quote_terms_id INTO target,old_terms FROM public.events WHERE enquiry_id=e.id;
 IF target IS NOT NULL THEN
  IF old_terms IS DISTINCT FROM q.id THEN RAISE EXCEPTION 'El evento ya está vinculado a otra versión' USING ERRCODE='23514'; END IF;
  RETURN target;
 END IF;
 INSERT INTO public.events(enquiry_id,quote_terms_id,title,event_date,venue,performance,status)
  VALUES(e.id,q.id,btrim(p_title),e.event_date,e.venue,e.service,'contract_pending') RETURNING id INTO target;
 RETURN target;
END $$;
REVOKE ALL ON FUNCTION public.prepare_event_from_quote(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.prepare_event_from_quote(uuid,text) TO authenticated;

CREATE TABLE app_private.intake_limits(bucket text PRIMARY KEY,window_start timestamptz NOT NULL,uses integer NOT NULL);
ALTER TABLE app_private.intake_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.intake_limits FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA app_private TO service_role;
GRANT ALL ON app_private.intake_limits TO service_role;
CREATE FUNCTION public.submit_public_test_enquiry(p_submission uuid,p_fingerprint text,p_hash text,p_data jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE target uuid; old_hash text; b text; max_uses integer; duration interval; counter app_private.intake_limits;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.app_runtime WHERE singleton AND test_mode) THEN
  RAISE EXCEPTION 'La captación real todavía no está habilitada' USING ERRCODE='23514'; END IF;
 IF p_submission IS NULL OR p_fingerprint IS NULL OR p_hash IS NULL OR p_data IS NULL
 OR NOT (p_data ?& ARRAY['consent_version','consent','is_test','name','email','service'])
 OR length(p_fingerprint)<>64 OR length(p_hash)<>64 OR jsonb_typeof(p_data)<>'object'
 OR octet_length(p_data::text)>4096 OR p_data->>'consent_version'<>'test-2026-11-v1' OR p_data->>'consent'<>'true'
 OR p_data->>'is_test'<>'true' OR left(p_data->>'name',6)<>'PRUEBA'
 OR length(p_data->>'name') NOT BETWEEN 6 AND 100 OR (p_data->>'email') !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.invalid$'
 OR length(coalesce(p_data->>'venue',''))>180 OR length(coalesce(p_data->>'notes',''))>1000
 OR length(coalesce(p_data->>'service','')) NOT BETWEEN 2 AND 150 THEN
  RAISE EXCEPTION 'Solicitud ficticia o consentimiento no válidos' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('public-intake',917));
 SELECT id,public_payload_hash INTO target,old_hash FROM public.enquiries WHERE public_submission_id=p_submission;
 IF target IS NOT NULL THEN
  IF old_hash IS DISTINCT FROM p_hash THEN RAISE EXCEPTION 'Referencia de solicitud en conflicto' USING ERRCODE='23505'; END IF;
  RETURN target;
 END IF;
 FOR b,max_uses,duration IN SELECT 'global',40,interval '1 hour' UNION ALL SELECT p_fingerprint,3,interval '15 minutes' LOOP
  SELECT * INTO counter FROM app_private.intake_limits WHERE bucket=b;
  IF NOT FOUND OR counter.window_start<clock_timestamp()-duration THEN
   INSERT INTO app_private.intake_limits(bucket,window_start,uses) VALUES(b,clock_timestamp(),1)
    ON CONFLICT(bucket) DO UPDATE SET window_start=excluded.window_start,uses=1;
  ELSE
   IF counter.uses>=max_uses THEN RAISE EXCEPTION 'Límite de solicitudes alcanzado' USING ERRCODE='P0001'; END IF;
   UPDATE app_private.intake_limits SET uses=uses+1 WHERE bucket=b;
  END IF;
 END LOOP;
 INSERT INTO public.enquiries(source,contact_name,contact_email,event_date,venue,service,notes,public_submission_id,public_payload_hash,consent_version,consented_at)
 VALUES('public_test',p_data->>'name',lower(p_data->>'email'),nullif(p_data->>'event_date','')::date,p_data->>'venue',p_data->>'service',
 'DATOS FICTICIOS · formulario de prueba. '||coalesce(p_data->>'notes',''),p_submission,p_hash,p_data->>'consent_version',clock_timestamp()) RETURNING id INTO target;
 RETURN target;
END $$;
REVOKE ALL ON FUNCTION public.submit_public_test_enquiry(uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_test_enquiry(uuid,text,text,jsonb) TO service_role;
