-- Atomic, audited role assignments for backend service-role calls only.
-- SECURITY INVOKER deliberately avoids privileged public functions.
CREATE OR REPLACE FUNCTION public.assign_sales_role_atomic(
  p_actor uuid, p_target uuid, p_new_role text
)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $body$
DECLARE
  v_previous text;
  v_actor_role text;
BEGIN
  IF p_new_role IS NULL OR p_new_role NOT IN ('client','sales') THEN
    RAISE EXCEPTION 'Only client/sales assignments supported' USING ERRCODE='22023';
  END IF;
  IF p_actor IS NULL OR p_target IS NULL OR p_actor=p_target THEN
    RAISE EXCEPTION 'Invalid target or self-assignment' USING ERRCODE='42501';
  END IF;
  SELECT role INTO v_actor_role FROM public.profiles WHERE id=p_actor FOR UPDATE;
  IF v_actor_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Verified administrator required' USING ERRCODE='42501';
  END IF;
  SELECT role INTO v_previous FROM public.profiles WHERE id=p_target FOR UPDATE;
  IF v_previous='admin' THEN
    RAISE EXCEPTION 'Cannot reassign administrator' USING ERRCODE='42501';
  END IF;
  IF v_previous=p_new_role THEN RETURN 'unchanged'; END IF;
  INSERT INTO public.profiles(id,role) VALUES(p_target,p_new_role)
    ON CONFLICT(id) DO UPDATE SET role=excluded.role;
  INSERT INTO public.role_change_audit(actor_id,target_id,old_role,new_role)
    VALUES(p_actor,p_target,v_previous,p_new_role);
  RETURN 'changed';
END
$body$;
REVOKE ALL ON FUNCTION public.assign_sales_role_atomic(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.assign_sales_role_atomic(uuid,uuid,text) TO service_role;

