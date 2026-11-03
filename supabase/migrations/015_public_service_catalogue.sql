-- Public non-financial catalogue, managed by administrators only.
CREATE TABLE IF NOT EXISTS public.services(
 code text PRIMARY KEY,
 family text NOT NULL,
 name_es text NOT NULL,
 name_en text,
 active boolean NOT NULL DEFAULT true,
 sort_order integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY services_public_read ON public.services FOR SELECT TO anon,authenticated
 USING (active OR public.is_admin());
CREATE POLICY services_admin_insert ON public.services FOR INSERT TO authenticated
 WITH CHECK(public.is_admin());
CREATE POLICY services_admin_update ON public.services FOR UPDATE TO authenticated
 USING(public.is_admin()) WITH CHECK(public.is_admin());
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.services FROM anon,authenticated;
INSERT INTO public.services(code,family,name_es,name_en,sort_order) VALUES
('1.1','instrumental','Guitarra solista','Solo flamenco guitar',11),
('1.2','instrumental','Dúo de guitarras','Guitar duo',12),
('1.3','instrumental','Guitarra y flauta','Guitar and flute',13),
('1.4','instrumental','Guitarra y violín','Guitar and violin',14),
('1.5','instrumental','Guitarra y percusión','Guitar and percussion',15),
('1.6','instrumental','Trío instrumental','Instrumental trio',16),
('2.1','son_del_alma','Son del Alma Dúo','Son del Alma Duo',21),
('2.2','son_del_alma','Son del Alma Trío','Son del Alma Trio',22),
('2.3','son_del_alma','Son del Alma Grupo','Son del Alma Group',23),
('2.4','son_del_alma','Son del Alma Banda','Son del Alma Band',24),
('3.1','suite_flamenca','Suite Flamenca Trío','Suite Flamenca Trio',31),
('3.2','suite_flamenca','Suite Flamenca Cuarteto','Suite Flamenca Quartet',32),
('3.3','suite_flamenca','Suite Flamenca Especial','Suite Flamenca Special',33),
('4.1','dj','DJ con equipo','DJ with sound system',41),
('4.2','dj','Sonorización','Sound reinforcement',42)
ON CONFLICT(code) DO NOTHING;
