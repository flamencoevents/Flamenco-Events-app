-- Anonymous catalogue reads must not evaluate the staff-only helper.
DROP POLICY IF EXISTS services_public_read ON public.services;
CREATE POLICY services_anon_read ON public.services FOR SELECT TO anon
 USING(active);
CREATE POLICY services_authenticated_read ON public.services FOR SELECT TO authenticated
 USING(active OR public.is_admin());
