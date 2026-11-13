-- DRAFT / STAGING ONLY. Hospitalidad: el seguimiento comercial no modifica los datos verificados por Marketing.
create table if not exists public.fe_hospitality_opportunities (
 id uuid primary key default gen_random_uuid(),
 prospect_id uuid not null unique references public.fe_hospitality_prospects(id) on delete restrict,
 owner_id uuid references auth.users(id),
 stage text not null default 'pendiente_contacto'
  check(stage in ('pendiente_contacto','contactado','reunion','propuesta','negociacion','acuerdo','recurrente','perdido')),
 priority text not null default 'media' check(priority in ('alta','media','baja')),
 next_action text, next_action_at timestamptz,
 notes text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists fe_hosp_opps_next_idx on public.fe_hospitality_opportunities(next_action_at) where next_action_at is not null;
alter table public.fe_hospitality_opportunities enable row level security;
create policy "hosp_opps_read_staff" on public.fe_hospitality_opportunities for select to authenticated
 using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','sales')));
create policy "hosp_opps_insert_staff_qualified" on public.fe_hospitality_opportunities for insert to authenticated
 with check (
 exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','sales'))
 and exists(select 1 from public.fe_hospitality_prospects h where h.id=prospect_id and h.marketing_status='cualificado')
 );
create policy "hosp_opps_update_staff" on public.fe_hospitality_opportunities for update to authenticated
 using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','sales')))
 with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','sales')));
grant select,insert,update on public.fe_hospitality_opportunities to authenticated;
-- IMPORTANT: do not deploy until RLS and cross-table authorization has been tested with client/sales/admin JWTs.
