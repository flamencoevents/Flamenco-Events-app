-- Flamenco Events App · Supabase data model · 2026-11
-- Run manually in Supabase SQL Editor after reviewing. No live data is connected.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text,
 role text not null default 'client' check(role in ('client','staff')),
 created_at timestamptz not null default now()
);
create table if not exists public.events (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references auth.users(id),
 title text not null,
 venue text,
 event_date date,
 performance text,
 status text not null default 'accepted' check(status in ('accepted','contract_pending','confirmed','completed','cancelled')),
 quotation_url text,
 contract_url text,
 wardrobe text,
 repertoire text,
 schedule_notes text,
 onsite_contact text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.event_messages (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.events(id) on delete cascade,
 author_id uuid not null references auth.users(id),
 message text not null check(char_length(message) between 1 and 3000),
 created_at timestamptz not null default now()
);
create table if not exists public.event_tasks (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.events(id) on delete cascade,
 title text not null,
 completed boolean not null default false,
 sort_order integer not null default 0
);
create table if not exists public.enquiries (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 source text,
 contact_name text not null,
 contact_email text,
 contact_phone text,
 venue text,
 event_date date,
 service text,
 notes text,
 stage text not null default 'new' check(stage in ('new','called','approved','sent','accepted','closed')),
 call_completed_at timestamptz,
 approved_at timestamptz,
 quote_sent_at timestamptz,
 constraint quote_requires_call check(quote_sent_at is null or (call_completed_at is not null and approved_at is not null))
);
-- Staff role is never self-assignable using this schema: the first staff account must be
-- provisioned manually by a database administrator using a trusted SQL editor.
create or replace function public.is_staff() returns boolean
language sql security definer stable set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='staff') $$;
revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_messages enable row level security;
alter table public.event_tasks enable row level security;
alter table public.enquiries enable row level security;
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_staff());
drop policy if exists events_read on public.events;
create policy events_read on public.events for select to authenticated using(client_id=auth.uid() or public.is_staff());
drop policy if exists events_staff_insert on public.events;
create policy events_staff_insert on public.events for insert to authenticated with check(public.is_staff());
drop policy if exists events_staff_update on public.events;
create policy events_staff_update on public.events for update to authenticated using(public.is_staff()) with check(public.is_staff());
drop policy if exists messages_read on public.event_messages;
create policy messages_read on public.event_messages for select to authenticated using(exists(select 1 from public.events e where e.id=event_id and (e.client_id=auth.uid() or public.is_staff())));
drop policy if exists messages_insert on public.event_messages;
create policy messages_insert on public.event_messages for insert to authenticated with check(author_id=auth.uid() and exists(select 1 from public.events e where e.id=event_id and (e.client_id=auth.uid() or public.is_staff())));
drop policy if exists tasks_read on public.event_tasks;
create policy tasks_read on public.event_tasks for select to authenticated using(exists(select 1 from public.events e where e.id=event_id and (e.client_id=auth.uid() or public.is_staff())));
drop policy if exists tasks_staff_write on public.event_tasks;
create policy tasks_staff_write on public.event_tasks for all to authenticated using(public.is_staff()) with check(public.is_staff());
drop policy if exists enquiries_staff on public.enquiries;
create policy enquiries_staff on public.enquiries for all to authenticated using(public.is_staff()) with check(public.is_staff());
-- Intentionally no anonymous INSERT policy on enquiries; forms must be submitted
-- through a rate-limited server endpoint with CAPTCHA, anti-spam and consent logging.
-- Intentionally no client UPDATE policy on events: client changes arrive as messages
-- and require staff review, keeping a reliable shared event record.
-- Storage: private buckets with signed URLs must be configured separately. Never
-- publish confidential quotation/contract documents as public URLs.

