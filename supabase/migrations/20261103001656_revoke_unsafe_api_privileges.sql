-- RLS does not govern TRUNCATE. Remove unexpected table privileges from API roles.
DO $$
DECLARE tab record;
BEGIN
 FOR tab IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
   EXECUTE format('REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE public.%I FROM anon, authenticated',tab.tablename);
 END LOOP;
END $$;

