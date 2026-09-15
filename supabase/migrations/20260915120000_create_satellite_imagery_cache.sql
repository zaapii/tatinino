create table if not exists public.satellite_scenes (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('copernicus')),
  collection text not null check (collection in ('sentinel-2-l2a')),
  product_id text not null unique,
  captured_at timestamptz not null,
  cloud_cover numeric check (cloud_cover between 0 and 100),
  storage_path text not null unique,
  west double precision not null,
  south double precision not null,
  east double precision not null,
  north double precision not null,
  status text not null default 'published' check (status in ('published', 'archived')),
  created_at timestamptz not null default now(),
  constraint satellite_scene_valid_bounds check (west < east and south < north)
);

comment on table public.satellite_scenes is
  'Metadatos de imágenes Sentinel procesadas y cacheadas para el mapa público.';

create index if not exists satellite_scenes_latest_published_idx
  on public.satellite_scenes (captured_at desc)
  where status = 'published';

alter table public.satellite_scenes enable row level security;

drop policy if exists "Public can read published satellite scenes" on public.satellite_scenes;
create policy "Public can read published satellite scenes"
  on public.satellite_scenes
  for select
  to anon, authenticated
  using (status = 'published');

grant select on public.satellite_scenes to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('satellite-imagery', 'satellite-imagery', true, 15728640, array['image/jpeg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'satellite_cron_secret') then
    perform vault.create_secret(
      gen_random_uuid()::text || gen_random_uuid()::text,
      'satellite_cron_secret',
      'Secreto generado para invocar la actualización diaria de Sentinel-2'
    );
  end if;
end
$$;

create or replace function public.verify_satellite_cron_secret(candidate text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from vault.decrypted_secrets
    where name = 'satellite_cron_secret'
      and decrypted_secret = candidate
  );
$$;

revoke all on function public.verify_satellite_cron_secret(text) from public, anon, authenticated;
grant execute on function public.verify_satellite_cron_secret(text) to service_role;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id from cron.job where jobname = 'refresh-sentinel-2-imagery';
  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'refresh-sentinel-2-imagery',
    '0 22 * * *',
    $cron$
      select net.http_post(
        url := 'https://spjrxnkompyyjbztzzlo.supabase.co/functions/v1/update-satellite-imagery',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', coalesce(
            (select decrypted_secret from vault.decrypted_secrets where name = 'satellite_cron_secret' limit 1),
            'not-configured'
          )
        ),
        body := jsonb_build_object('scheduled_at', now())
      );
    $cron$
  );
end
$$;
