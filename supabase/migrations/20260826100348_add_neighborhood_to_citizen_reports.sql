alter table public.citizen_reports
  add column neighborhood text
  constraint citizen_reports_neighborhood_check check (
    neighborhood is null or char_length(neighborhood) between 2 and 120
  );

comment on column public.citizen_reports.neighborhood is
  'Barrio estimado mediante geocodificación inversa y editable por quien carga el reclamo.';

grant insert (neighborhood)
  on table public.citizen_reports to anon, authenticated;
