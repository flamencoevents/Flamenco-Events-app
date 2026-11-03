CREATE OR REPLACE FUNCTION public.submit_public_test_enquiry(p_submission uuid,p_fingerprint text,p_hash text,p_data jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE target uuid; old_hash text; b text; max_uses integer; duration interval; counter app_private.intake_limits;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.app_runtime WHERE singleton AND test_mode) THEN
  RAISE EXCEPTION 'La captación real todavía no está habilitada' USING ERRCODE='23514'; END IF;
 IF p_submission IS NULL OR p_fingerprint IS NULL OR p_hash IS NULL OR p_data IS NULL
 OR NOT (p_data ?& ARRAY['consent_version','consent','is_test','name','email','service'])
 OR length(p_fingerprint)<>64 OR length(p_hash)<>64 OR jsonb_typeof(p_data)<>'object'
 OR EXISTS (SELECT 1 FROM jsonb_each(p_data) x WHERE x.key IN ('consent_version','name','email','service') AND jsonb_typeof(x.value)<>'string')
 OR p_data->'consent' IS DISTINCT FROM 'true'::jsonb OR p_data->'is_test' IS DISTINCT FROM 'true'::jsonb
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
