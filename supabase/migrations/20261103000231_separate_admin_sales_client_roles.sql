alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('client','sales','admin'));
create or replace function public.is_staff() returns boolean language sql security definer stable set search_path=public as $$select exists(select 1 from public.profiles where id=auth.uid() and role in ('sales','admin'))$$;
create or replace function public.is_admin() returns boolean language sql security definer stable set search_path=public as $$select exists(select 1 from public.profiles where id=auth.uid() and role='admin')$$;
revoke all on function public.is_staff() from public, anon;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;
drop policy if exists events_staff_insert on public.events;
create policy events_admin_insert on public.events for insert to authenticated with check(public.is_admin());
drop policy if exists events_staff_update on public.events;
create policy events_admin_update on public.events for update to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists tasks_staff_write on public.event_tasks;
create policy tasks_admin_write on public.event_tasks for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists enquiries_staff on public.enquiries;
create policy enquiries_team_read on public.enquiries for select to authenticated using(public.is_staff());
create policy enquiries_admin_insert on public.enquiries for insert to authenticated with check(public.is_admin());
create policy enquiries_team_update on public.enquiries for update to authenticated using(public.is_staff()) with check(public.is_staff());
create policy enquiries_admin_delete on public.enquiries for delete to authenticated using(public.is_admin());
-- sales has read on all events/tasks and can reply to clients, but cannot alter event ownership or role configuration.
-- create specific audited server-side workflows for operational field edits in a later release.

