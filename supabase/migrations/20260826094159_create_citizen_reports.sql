create table public.citizen_reports (
  id uuid primary key default gen_random_uuid(),
  topic text not null constraint citizen_reports_topic_check check (
    topic in (
      'Boca de tormenta obstruida',
      'Basura o residuos',
      'Calle anegada',
      'Canal o desagüe',
      'Defensa o terraplén',
      'Otro'
    )
  ),
  description text not null constraint citizen_reports_description_check check (
    char_length(description) between 10 and 500
  ),
  latitude double precision not null constraint citizen_reports_latitude_check check (
    latitude between -31.82 and -31.45
  ),
  longitude double precision not null constraint citizen_reports_longitude_check check (
    longitude between -60.95 and -60.45
  ),
  photo_path text constraint citizen_reports_photo_path_check check (
    photo_path is null
    or photo_path ~ '^public/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|heic|heif)$'
  ),
  photo_name text constraint citizen_reports_photo_name_check check (
    photo_name is null or char_length(photo_name) between 1 and 180
  ),
  status text not null default 'reported' constraint citizen_reports_status_check check (
    status in ('reported', 'verified', 'in_progress', 'resolved', 'dismissed')
  ),
  created_at timestamptz not null default now()
);

comment on table public.citizen_reports is
  'Reclamos hídricos cargados por la comunidad y visibles en el mapa público.';
comment on column public.citizen_reports.status is
  'Estado editorial. Las cargas públicas siempre ingresan como reported.';

create index citizen_reports_created_at_idx
  on public.citizen_reports (created_at desc);
create index citizen_reports_status_idx
  on public.citizen_reports (status);

alter table public.citizen_reports enable row level security;

revoke all on table public.citizen_reports from anon, authenticated;
grant select on table public.citizen_reports to anon, authenticated;
grant insert (topic, description, latitude, longitude, photo_path, photo_name)
  on table public.citizen_reports to anon, authenticated;

create policy "Public can read citizen reports"
  on public.citizen_reports
  for select
  to anon, authenticated
  using (true);

create policy "Public can submit unverified citizen reports"
  on public.citizen_reports
  for insert
  to anon, authenticated
  with check (status = 'reported');

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'citizen-report-photos',
  'citizen-report-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can upload citizen report photos"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'citizen-report-photos'
    and (storage.foldername(name))[1] = 'public'
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif')
  );

alter publication supabase_realtime add table public.citizen_reports;
