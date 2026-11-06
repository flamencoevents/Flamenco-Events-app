-- Read-only staff projection of an explicitly imported accounts workbook.
-- Not operational events, ledger entries, bookings or live synchronization.
create table public.accounts_year_catalog (
 year integer primary key check(year between 2027 and 2100),
 source_url text not null check(source_url ~ '^https://docs\.google\.com/spreadsheets/d/[A-Za-z0-9_-]+/'),
 source_title text not null,
 source_sha256 text not null check(source_sha256 ~ '^[a-f0-9]{64}$'),
 source_modified_at timestamptz not null,
 imported_at timestamptz not null default now()
);
create table public.accounts_event_catalog (
 year integer not null references public.accounts_year_catalog(year),
 source_row integer not null check(source_row>3),
 event_date date not null,
 schedule text,
 venue text,
 client_label text,
 quote_number text,
 budget_eur numeric(14,2),
 budget_text text,
 account_values jsonb not null check(jsonb_typeof(account_values)='object'),
 source_link text,
 quotation_url text,
 document_note text,
 contract_url text,
 primary key(year,source_row),
 check(extract(year from event_date)=year),
 check(source_link is null or source_link ~ '^https://(canva\.link/|www\.canva\.com/design/|drive\.google\.com/file/d/)'),
 check(quotation_url is null or quotation_url ~ '^https://drive\.google\.com/file/d/'),
 check(contract_url is null or contract_url ~ '^https://(www\.canva\.com/(design|d)/|drive\.google\.com/file/d/)')
);
alter table public.accounts_year_catalog enable row level security;
alter table public.accounts_event_catalog enable row level security;
revoke all on public.accounts_year_catalog,public.accounts_event_catalog from public,anon,authenticated;
grant select on public.accounts_year_catalog,public.accounts_event_catalog to authenticated;
grant all on public.accounts_year_catalog,public.accounts_event_catalog to service_role;
create policy accounts_year_staff_read on public.accounts_year_catalog for select to authenticated
 using ((select public.is_staff()));
create policy accounts_event_staff_read on public.accounts_event_catalog for select to authenticated
 using ((select public.is_staff()));
