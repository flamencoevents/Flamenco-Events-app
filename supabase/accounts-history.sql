-- Private read-only historical import, explicitly requested by Nacho.
-- Does not create operational events, bookings, payments or balance totals.
alter table public.accounts_year_catalog
 drop constraint accounts_year_catalog_year_check;
alter table public.accounts_year_catalog
 add constraint accounts_year_catalog_year_check check(year between 2025 and 2100);

create table public.accounts_source_sheet_catalog (
 source_key text not null,
 sheet_id bigint not null,
 sheet_title text not null,
 sheet_index integer not null check(sheet_index>=0),
 source_url text not null check(source_url ~ '^https://docs\.google\.com/spreadsheets/d/[A-Za-z0-9_-]+/'),
 source_modified_at timestamptz not null,
 source_sha256 text not null check(source_sha256 ~ '^[a-f0-9]{64}$'),
 imported_at timestamptz not null default now(),
 cells jsonb not null check(jsonb_typeof(cells)='array'),
 primary key(source_key,sheet_id)
);
alter table public.accounts_source_sheet_catalog enable row level security;
revoke all on public.accounts_source_sheet_catalog from public,anon,authenticated;
grant select on public.accounts_source_sheet_catalog to authenticated;
grant all on public.accounts_source_sheet_catalog to service_role;
create policy accounts_source_sheet_staff_read
 on public.accounts_source_sheet_catalog for select to authenticated
 using ((select public.is_staff()));
