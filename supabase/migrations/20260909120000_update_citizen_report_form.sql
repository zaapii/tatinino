begin;

alter table public.citizen_reports
  drop constraint citizen_reports_topic_check,
  drop constraint citizen_reports_description_check,
  alter column description set default '',
  add column address text check (address is null or char_length(address) <= 500);

update public.citizen_reports set topic = case topic
  when 'Basura o residuos' then 'Acumulación de basura'
  when 'Calle anegada' then 'Calle inundada'
  when 'Canal o desagüe' then 'Canales o zanjones obstruidos'
  when 'Defensa o terraplén' then 'Defensa o terraplén en mal estado'
  else topic end;

alter table public.citizen_reports add constraint citizen_reports_topic_check check (topic in (
  'Boca de tormenta obstruida', 'Acumulación de basura', 'Calle inundada',
  'Canales o zanjones obstruidos', 'Población en zona de riesgo hídrico',
  'Defensa o terraplén en mal estado', 'Obra paralizada', 'Otro'
));

-- Validate new submissions without truncating historical descriptions or
-- preventing moderation of historical reports without photos.
create function public.validate_citizen_report_submission() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.topic := case new.topic
    when 'Basura o residuos' then 'Acumulación de basura'
    when 'Calle anegada' then 'Calle inundada'
    when 'Canal o desagüe' then 'Canales o zanjones obstruidos'
    when 'Defensa o terraplén' then 'Defensa o terraplén en mal estado'
    else new.topic end;
  new.description := coalesce(new.description, '');
  if char_length(new.description) > 200 then
    raise exception 'La descripción no puede superar los 200 caracteres.';
  end if;
  if new.photo_path is null then
    raise exception 'Adjuntá una foto del reclamo.';
  end if;
  return new;
end;
$$;
create trigger validate_citizen_report_submission
before insert or update of description, photo_path, topic on public.citizen_reports
for each row execute function public.validate_citizen_report_submission();

create table public.citizen_report_contacts (
  report_id uuid primary key references public.citizen_reports(id) on delete cascade,
  full_name text check (full_name is null or char_length(full_name) between 1 and 120),
  phone text check (phone is null or char_length(phone) between 1 and 40),
  email text check (email is null or (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'))
);
comment on table public.citizen_report_contacts is 'Contacto opcional privado. Solo disponible para administradores; fuera de la publicación Realtime.';
alter table public.citizen_report_contacts enable row level security;
revoke all on public.citizen_report_contacts from anon, authenticated;
grant select on public.citizen_report_contacts to authenticated;
create policy "Administrators can read report contacts" on public.citizen_report_contacts
for select to authenticated using (exists (
  select 1 from public.admin_users where user_id = (select auth.uid())
));

-- A single transaction saves the report and its optional private contact.
create function public.submit_citizen_report(
  p_topic text, p_description text, p_latitude double precision,
  p_longitude double precision, p_photo_path text, p_photo_name text,
  p_neighborhood text default null, p_address text default null,
  p_contact_name text default null, p_contact_phone text default null,
  p_contact_email text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  report_id uuid;
begin
  if not exists (select 1 from storage.objects where bucket_id = 'citizen-report-photos' and name = p_photo_path) then
    raise exception 'Adjuntá una foto válida del reclamo.';
  end if;
  insert into public.citizen_reports(topic, description, latitude, longitude, photo_path, photo_name, neighborhood, address)
  values (p_topic, coalesce(p_description, ''), p_latitude, p_longitude, p_photo_path, p_photo_name, nullif(trim(p_neighborhood), ''), nullif(trim(p_address), ''))
  returning id into report_id;
  if nullif(trim(p_contact_name), '') is not null or nullif(trim(p_contact_phone), '') is not null or nullif(trim(p_contact_email), '') is not null then
    insert into public.citizen_report_contacts(report_id, full_name, phone, email)
    values (report_id, nullif(trim(p_contact_name), ''), nullif(trim(p_contact_phone), ''), nullif(trim(p_contact_email), ''));
  end if;
  return report_id;
end;
$$;
revoke all on function public.submit_citizen_report(text,text,double precision,double precision,text,text,text,text,text,text,text) from public;
grant execute on function public.submit_citizen_report(text,text,double precision,double precision,text,text,text,text,text,text,text) to anon, authenticated;

commit;
