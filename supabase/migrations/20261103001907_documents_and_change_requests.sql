-- Document metadata and explicit change requests, isolated per event.
CREATE TABLE public.event_documents (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.events(id) on delete cascade,
 kind text not null check(kind in ('quotation','contract','other')),
 storage_path text not null unique,
 version integer not null default 1 check(version>=1),
 created_at timestamptz not null default now(),
 unique(event_id,kind,version),
 constraint path_matches_event check(split_part(storage_path,'/',1)=event_id::text)
);
ALTER TABLE public.event_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY document_metadata_read ON public.event_documents FOR SELECT TO authenticated
USING(exists(select 1 from public.events e where e.id=event_id and (e.client_id=auth.uid() or public.is_staff())));
CREATE POLICY document_metadata_admin_insert ON public.event_documents FOR INSERT TO authenticated
WITH CHECK(public.is_admin());
CREATE POLICY document_metadata_admin_update ON public.event_documents FOR UPDATE TO authenticated
USING(public.is_admin()) WITH CHECK(public.is_admin());
CREATE TABLE public.event_change_requests(
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.events(id) on delete cascade,
 requester_id uuid not null references auth.users(id),
 topic text not null check(topic in ('repertoire','wardrobe','schedule','other')),
 details text not null check(length(details) between 3 and 3000),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz
);
ALTER TABLE public.event_change_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY request_read ON public.event_change_requests FOR SELECT TO authenticated
USING(exists(select 1 from public.events e where e.id=event_id and (e.client_id=auth.uid() or public.is_staff())));
CREATE POLICY request_client_insert ON public.event_change_requests FOR INSERT TO authenticated
WITH CHECK(requester_id=auth.uid() and status='pending' and reviewed_at is null and exists(select 1 from public.events e where e.id=event_id and e.client_id=auth.uid()));
CREATE POLICY request_team_update ON public.event_change_requests FOR UPDATE TO authenticated
USING(public.is_staff()) WITH CHECK(public.is_staff());
CREATE OR REPLACE FUNCTION public.protect_change_request_fields() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
IF NEW.id IS DISTINCT FROM OLD.id OR NEW.event_id IS DISTINCT FROM OLD.event_id OR NEW.requester_id IS DISTINCT FROM OLD.requester_id OR NEW.topic IS DISTINCT FROM OLD.topic OR NEW.details IS DISTINCT FROM OLD.details OR NEW.created_at IS DISTINCT FROM OLD.created_at
THEN RAISE EXCEPTION 'Change request content is immutable' USING ERRCODE='42501'; END IF;
RETURN NEW;
END $$;
CREATE TRIGGER protect_change_request_fields BEFORE UPDATE ON public.event_change_requests FOR EACH ROW EXECUTE FUNCTION public.protect_change_request_fields();
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.event_documents,public.event_change_requests FROM anon,authenticated;

