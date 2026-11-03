-- Keep privileged role lookup out of the exposed public API schema.
-- Moving existing functions preserves policy dependencies by PostgreSQL OID.
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA app_private TO authenticated;

ALTER FUNCTION public.is_admin() SET SCHEMA app_private;
ALTER FUNCTION public.is_staff() SET SCHEMA app_private;

REVOKE ALL ON FUNCTION app_private.is_admin() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION app_private.is_staff() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION app_private.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_staff() TO authenticated;

-- Compatibility wrappers for existing PL/pgSQL source code and the frontend.
-- They are INVOKER functions, not privileged functions.
CREATE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER
SET search_path=''
AS $body$ SELECT app_private.is_admin() $body$;
CREATE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER
SET search_path=''
AS $body$ SELECT app_private.is_staff() $body$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

