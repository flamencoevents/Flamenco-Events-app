-- STAGING ONLY. Luxury brand partnerships: flamenco fashion, jewelry, accessories.
-- Remains separate from wedding venue pipeline. No automatic external communication.
create table if not exists public.fe_brand_partners (
 id uuid primary key default gen_random_uuid(),
 brand_name text not null check(length(trim(brand_name)) between 2 and 180),
 sector text not null check(sector in ('moda_flamenca','joyeria','complementos','alta_costura','otro')),
 website text, instagram text, contact_name text, contact_email text, contact_phone text,
 location text, prestige_notes text, style_fit_notes text,
 source_name text, source_url text, checked_at timestamptz,
 status text not null default 'investigacion' check(status in ('investigacion','verificar','cualificada','descartada')),
 fit_score integer check(fit_score between 0 and 100),
 created_by uuid default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 unique(brand_name,sector)
);
create table if not exists public.fe_brand_collaborations (
 id uuid primary key default gen_random_uuid(),
 brand_id uuid not null references public.fe_brand_partners(id) on delete restrict,
 owner_id uuid references auth.users(id),
 collaboration_type text not null check(collaboration_type in ('desfile_con_musica_en_directo','presentacion_coleccion','editorial_fotografico','evento_vip','activacion_marca','otro')),
 stage text not null default 'pendiente_contacto' check(stage in ('pendiente_contacto','contactado','reunion','propuesta','negociacion','acuerdo','realizado','perdido')),
 compensation_type text not null default 'por_definir' check(compensation_type in ('por_definir','honorarios','intercambio','mixto')),
 fee_eur numeric(12,2) check(fee_eur >= 0),
 deliverables text, brand_usage_rights text, image_rights_approved boolean not null default false,
 exclusivity_terms text, next_action text, next_action_at timestamptz,
 marketing_notes text, commercial_notes text,
 created_at timestamptz not null default now()
);
create index if not exists fe_brand_sector_idx on public.fe_brand_partners(sector,status);
create index if not exists fe_brand_collab_next_idx on public.fe_brand_collaborations(next_action_at);
alter table public.fe_brand_partners enable row level security;
alter table public.fe_brand_collaborations enable row level security;
create policy "brand_partners_staff_select" on public.fe_brand_partners for select to authenticated
 using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','sales')));
create policy "brand_partners_admin_insert" on public.fe_brand_partners for insert to authenticated
 with check (created_by=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
create policy "brand_partners_admin_update" on public.fe_brand_partners for update to authenticated
 using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'))
 with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
create policy "brand_collabs_staff_select" on public.fe_brand_collaborations for select to authenticated
 using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','sales')));
create policy "brand_collabs_staff_insert" on public.fe_brand_collaborations for insert to authenticated
 with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','sales'))
 and exists(select 1 from public.fe_brand_partners b where b.id=brand_id and b.status='cualificada'));
create policy "brand_collabs_staff_update" on public.fe_brand_collaborations for update to authenticated
 using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','sales')))
 with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','sales')));
grant select on public.fe_brand_partners,public.fe_brand_collaborations to authenticated;
grant insert,update on public.fe_brand_partners,public.fe_brand_collaborations to authenticated;
