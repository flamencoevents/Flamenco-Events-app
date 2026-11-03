-- Private documents: object names must begin with the associated event UUID.
-- Example: <event-uuid>/quotation.pdf
-- No public document links and no direct client uploads at this stage.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('event-documents','event-documents',false,10485760,array['application/pdf'])
on conflict (id) do nothing;

create policy "fe_documents_read" on storage.objects
for select to authenticated
using (
 bucket_id='event-documents'
 and exists (
   select 1 from public.events e
   where e.id::text = split_part(name,'/',1)
   and (e.client_id=auth.uid() or public.is_staff())
 )
);

create policy "fe_documents_admin_insert" on storage.objects
for insert to authenticated
with check (
 bucket_id='event-documents'
 and public.is_admin()
 and exists (
   select 1 from public.events e
   where e.id::text = split_part(name,'/',1)
 )
);

create policy "fe_documents_admin_update" on storage.objects
for update to authenticated
using (bucket_id='event-documents' and public.is_admin())
with check (
 bucket_id='event-documents' and public.is_admin()
 and exists (
   select 1 from public.events e
   where e.id::text = split_part(name,'/',1)
 )
);
-- No DELETE policy: prevent accidental deletion through the public API.

