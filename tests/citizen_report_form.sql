-- Run only against a fresh disposable PostgreSQL database.
\set ON_ERROR_STOP on
create role anon;
create role authenticated;
create schema auth;
create schema storage;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to authenticated;
create table public.admin_users(user_id uuid primary key);
grant select on public.admin_users to authenticated;
create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects(bucket_id text, name text);
create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1, '/') $$;
create function storage.extension(text) returns text language sql as $$ select split_part($1, '.', 2) $$;
create publication supabase_realtime;
\ir ../supabase/migrations/20260826094159_create_citizen_reports.sql
\ir ../supabase/migrations/20260826100348_add_neighborhood_to_citizen_reports.sql
\ir ../supabase/migrations/20260827090000_add_report_moderation.sql
insert into public.citizen_reports(topic,description,latitude,longitude) values ('Calle anegada',repeat('x',300),-31.6,-60.7);
\ir ../supabase/migrations/20260909120000_update_citizen_report_form.sql
begin;
insert into storage.objects values ('citizen-report-photos','public/00000000-0000-0000-0000-000000000001.jpg');
set role anon;
select public.submit_citizen_report('Otro','',-31.6,-60.7,'public/00000000-0000-0000-0000-000000000001.jpg','foto.jpg');
select public.submit_citizen_report('Obra paralizada',repeat('a',200),-31.6,-60.7,'public/00000000-0000-0000-0000-000000000001.jpg','foto.jpg',null,null,'Prueba',null,'prueba@example.com');
do $$
begin
  begin
    perform public.submit_citizen_report('Otro',repeat('a',201),-31.6,-60.7,'public/00000000-0000-0000-0000-000000000001.jpg','foto.jpg');
    raise exception 'FAILED: description accepted';
  exception when raise_exception then
    if sqlerrm like 'FAILED:%' then raise; end if;
  end;
  begin
    perform public.submit_citizen_report('Otro','',-31.6,-60.7,null,null);
    raise exception 'FAILED: missing photo accepted';
  exception when raise_exception then
    if sqlerrm like 'FAILED:%' then raise; end if;
  end;
  begin
    perform public.submit_citizen_report('Invalid','',-31.6,-60.7,'public/00000000-0000-0000-0000-000000000001.jpg','foto.jpg');
    raise exception 'FAILED: invalid category accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.submit_citizen_report('Otro','',0,0,'public/00000000-0000-0000-0000-000000000001.jpg','foto.jpg');
    raise exception 'FAILED: invalid coordinates accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.submit_citizen_report('Otro','',-31.6,-60.7,'public/00000000-0000-0000-0000-000000000001.jpg','foto.jpg',null,null,null,null,'invalid');
    raise exception 'FAILED: invalid email accepted';
  exception when check_violation then null;
  end;
  begin
    perform * from public.citizen_report_contacts;
    raise exception 'FAILED: anonymous contact access';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
do $$ begin
  if (select count(*) from public.citizen_reports) <> 3 then raise exception 'FAILED: atomic save'; end if;
  if (select count(*) from public.citizen_report_contacts) <> 1 then raise exception 'FAILED: optional contact'; end if;
end $$;
update public.citizen_reports set status='approved' where char_length(description)=300;
set role authenticated;
do $$ begin
  if exists (select 1 from public.citizen_report_contacts) then raise exception 'FAILED: non-admin access'; end if;
end $$;
reset role;
insert into public.admin_users values ('00000000-0000-0000-0000-000000000002');
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set role authenticated;
do $$ begin
  if (select count(*) from public.citizen_report_contacts) <> 1 then raise exception 'FAILED: admin contact access'; end if;
end $$;
reset role;
rollback;
\echo Report validation, atomic save, historical moderation and contact privacy: OK
