-- STAGING ONLY: premium hospitality prospect qualification, separate from wedding venues.
create table if not exists public.fe_hospitality_prospects (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 2 and 180),
 establishment_type text not null check(establishment_type in ('hotel_5_estrellas','hotel_boutique','resort','restaurante_gastronomico','beach_club','club_privado','otro')),
 province text not null,
 town text, website text, phone text, email text, contact_name text, contact_position text,
 chain_or_group text, international_guests boolean, live_music_existing boolean,
 preferred_products text, estimated_event_frequency text, seasonality text, prestige_evidence text,
 source_url text, checked_at timestamptz, fit_score integer check(fit_score between 0 and 100),
 marketing_status text not null default 'investigacion' check(marketing_status in ('investigacion','verificar','cualificado','descartado')),
 owner_id uuid references auth.users(id),
 commercial_stage text not null default 'pendiente_contacto' check(commercial_stage in ('pendiente_contacto','contactado','reunion','propuesta','negociacion','acuerdo','recurrente','perdido')),
 next_action text, next_action_at timestamptz, notes text,
 created_by uuid references auth.users(id) default auth.uid(),
 created_at timestamptz not null default now(),
 unique(name,province)
);
create index if not exists fe_hospitality_prov_idx on public.fe_hospitality_prospects(province,establishment_type);
create index if not exists fe_hospitality_next_idx on public.fe_hospitality_prospects(next_action_at);
alter table public.fe_hospitality_prospects enable row level security;
create policy "fe_hospitality_staff_read" on public.fe_hospitality_prospects for select to authenticated
 using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','sales')));
create policy "fe_hospitality_admin_insert" on public.fe_hospitality_prospects for insert to authenticated
 with check (created_by=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
create policy "fe_hospitality_admin_update" on public.fe_hospitality_prospects for update to authenticated
 using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'))
 with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
-- Commercial team should update pipeline only through approved server-side RPC after role and status checks.
grant select on public.fe_hospitality_prospects to authenticated;
grant insert,update on public.fe_hospitality_prospects to authenticated;
