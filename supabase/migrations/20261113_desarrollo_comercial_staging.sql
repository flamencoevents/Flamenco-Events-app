-- STAGING ONLY: review and apply through the normal Supabase migration workflow.
-- Marketing = administrator; Comercial = profiles.role = 'sales'; clients have no access.
create table if not exists public.fe_prospects (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(trim(name)) between 2 and 180),
 category text not null check (category in ('finca','hacienda','hotel','restaurante','wedding_planner','agencia','otro')),
 province text not null,
 town text,
 website text,
 phone text,
 email text,
 source text,
 source_url text,
 source_checked_at timestamptz,
 bodas_rating numeric(2,1) check (bodas_rating between 0 and 5),
 bodas_reviews integer check (bodas_reviews >= 0),
 google_rating numeric(2,1) check (google_rating between 0 and 5),
 google_reviews integer check (google_reviews >= 0),
 editorial_prestige boolean not null default false,
 fit_score integer check (fit_score between 0 and 100),
 marketing_status text not null default 'investigacion'
  check(marketing_status in ('investigacion','verificar','cualificado','descartado')),
 marketing_notes text,
 created_by uuid references auth.users(id) default auth.uid(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(name,province)
);
create table if not exists public.fe_commercial_opportunities (
 id uuid primary key default gen_random_uuid(),
 prospect_id uuid not null unique references public.fe_prospects(id) on delete restrict,
 owner_id uuid references auth.users(id),
 stage text not null default 'pendiente_contacto' check (stage in
  ('pendiente_contacto','contactado','reunion','propuesta','negociacion','colaborador','ganado','perdido')),
 priority text not null default 'media' check (priority in ('alta','media','baja')),
 next_action text,
 next_action_at timestamptz,
 last_contact_at timestamptz,
 expected_value numeric(12,2) check (expected_value >= 0),
 won_value numeric(12,2) check (won_value >= 0),
 notes text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.fe_commercial_activities (
 id uuid primary key default gen_random_uuid(),
 opportunity_id uuid not null references public.fe_commercial_opportunities(id) on delete cascade,
 actor_id uuid not null references auth.users(id) default auth.uid(),
 kind text not null check (kind in ('llamada','correo_borrador','correo_enviado','reunion','whatsapp','nota','propuesta','seguimiento')),
 detail text not null check (length(trim(detail)) between 3 and 3000),
 occurred_at timestamptz not null default now()
);
create index if not exists fe_prospects_province_idx on public.fe_prospects(province,category);
create index if not exists fe_opps_followup_idx on public.fe_commercial_opportunities(next_action_at) where next_action_at is not null;
create index if not exists fe_activities_opportunity_idx on public.fe_commercial_activities(opportunity_id,occurred_at desc);
alter table public.fe_prospects enable row level security;
alter table public.fe_commercial_opportunities enable row level security;
alter table public.fe_commercial_activities enable row level security;
-- The role is read from protected profiles, never editable user_metadata.
create policy "fe_prospects_staff_read" on public.fe_prospects for select to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','sales')));
create policy "fe_prospects_admin_insert" on public.fe_prospects for insert to authenticated
with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin') and created_by=(select auth.uid()));
create policy "fe_prospects_admin_update" on public.fe_prospects for update to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'))
with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
create policy "fe_opps_staff_read" on public.fe_commercial_opportunities for select to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','sales')));
create policy "fe_opps_staff_insert" on public.fe_commercial_opportunities for insert to authenticated
with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','sales'))
 and exists(select 1 from public.fe_prospects p where p.id=prospect_id and p.marketing_status='cualificado'));
create policy "fe_opps_staff_update" on public.fe_commercial_opportunities for update to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','sales')))
with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','sales')));
create policy "fe_activities_staff_read" on public.fe_commercial_activities for select to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','sales')));
create policy "fe_activities_staff_insert" on public.fe_commercial_activities for insert to authenticated
with check (actor_id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','sales')));
-- No deletion policies. Changes must be audited and reviewed.
grant select on public.fe_prospects,public.fe_commercial_opportunities,public.fe_commercial_activities to authenticated;
grant insert,update on public.fe_prospects to authenticated;
grant insert,update on public.fe_commercial_opportunities to authenticated;
grant insert on public.fe_commercial_activities to authenticated;
