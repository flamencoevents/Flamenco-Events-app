-- Existing profiles are used only as SQL role simulations. No Auth sessions.
begin;
select set_config('fe.test_admin',(select id::text from public.profiles where role='admin' limit 1),true);
select set_config('fe.test_sales',(select id::text from public.profiles where role='sales' limit 1),true);
select set_config('fe.test_count',(select count(*)::text from public.accounts_event_catalog),true);
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('fe.test_admin'),true);
do $$ begin
 if (select count(*) from public.accounts_event_catalog)::text<>current_setting('fe.test_count') then raise exception 'Admin read failed';end if;
 if not exists(select 1 from public.accounts_year_catalog) then raise exception 'Missing annual link';end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('fe.test_sales'),true);
do $$ begin
 if (select count(*) from public.accounts_event_catalog)::text<>current_setting('fe.test_count') then raise exception 'Sales read failed';end if;
 begin
 update public.accounts_event_catalog set venue='SHOULD NEVER WRITE';
 raise exception 'Browser write allowed';
 exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000009999',true);
do $$ begin
 if exists(select 1 from public.accounts_event_catalog) or exists(select 1 from public.accounts_year_catalog) then raise exception 'Nonstaff exposure';end if;
end $$;
set local role anon;
do $$ begin
 begin perform 1 from public.accounts_event_catalog;raise exception 'Anonymous access';
 exception when insufficient_privilege then null;end;
end $$;
rollback;
