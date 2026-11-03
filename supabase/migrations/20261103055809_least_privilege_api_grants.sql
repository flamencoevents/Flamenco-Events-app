-- Least privilege: the anonymous API can only read the public service catalogue.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON public.services TO anon;

-- Signed-in accounts cannot delete protected business objects through REST.
REVOKE DELETE ON public.events,public.event_messages,
 public.notifications,public.event_change_requests,
 public.event_documents,public.services,public.profiles
 FROM authenticated;

-- Consumers may not mutate the catalog as anonymous visitors.
REVOKE INSERT,UPDATE,DELETE ON public.services FROM anon;

