create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    constraint articles_slug_check check (
      slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      and char_length(slug) between 3 and 120
    ),
  title text not null
    constraint articles_title_check check (char_length(title) between 5 and 180),
  excerpt text not null
    constraint articles_excerpt_check check (char_length(excerpt) between 20 and 320),
  category text not null
    constraint articles_category_check check (category in ('Proyecto', 'Guías', 'Datos abiertos')),
  published_at date not null,
  reading_minutes smallint not null
    constraint articles_reading_minutes_check check (reading_minutes between 1 and 60),
  visual text not null
    constraint articles_visual_check check (visual in ('topography', 'reading', 'sources')),
  kicker text not null
    constraint articles_kicker_check check (char_length(kicker) between 3 and 100),
  summary text[] not null
    constraint articles_summary_check check (cardinality(summary) between 1 and 6),
  blocks jsonb not null
    constraint articles_blocks_check check (
      jsonb_typeof(blocks) = 'array'
      and jsonb_array_length(blocks) > 0
    ),
  status text not null default 'draft'
    constraint articles_status_check check (status in ('draft', 'published')),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.articles is
  'Publicaciones editoriales creadas desde la administración del sitio.';
comment on column public.articles.blocks is
  'Cuerpo ordenado de bloques: paragraph, heading, list, callout o quote.';

create index articles_publication_idx
  on public.articles (status, published_at desc, created_at desc);

create function public.set_article_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_articles_updated_at
before update on public.articles
for each row execute function public.set_article_updated_at();

alter table public.articles enable row level security;

revoke all on table public.articles from anon, authenticated;
grant select on table public.articles to anon, authenticated;
grant insert, update, delete on table public.articles to authenticated;

create policy "Published articles are public"
  on public.articles
  for select
  to anon, authenticated
  using (status = 'published');

create policy "Administrators can read all articles"
  on public.articles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

create policy "Administrators can create articles"
  on public.articles
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1
      from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

create policy "Administrators can update articles"
  on public.articles
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

create policy "Administrators can delete articles"
  on public.articles
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

insert into public.articles (
  slug,
  title,
  excerpt,
  category,
  published_at,
  reading_minutes,
  visual,
  kicker,
  summary,
  blocks,
  status,
  created_by
)
values (
  'como-se-construira-el-mapa-de-cotas',
  'Cómo se construirá el mapa interactivo de riesgo hídrico',
  'Territorio, información actualizada y participación comunitaria reunidos en una infraestructura pública de prevención.',
  'Proyecto',
  '2026-08-24',
  4,
  'topography',
  'El proyecto por dentro',
  array[
    'La información oficial deberá tener procedencia, fecha y metodología.',
    'El mapa reunirá capas territoriales y datos que cambian con cada escenario.',
    'Los reportes comunitarios se distinguirán de la información verificada.'
  ],
  $$[
    {"type":"paragraph","text":"El mapa está pensado como una puerta de entrada al conocimiento público del territorio. Su objetivo es reunir información que hoy suele encontrarse dispersa y presentarla de una forma que ayude a comprender riesgos, anticipar escenarios y tomar mejores decisiones."},
    {"type":"heading","text":"Una base territorial común"},
    {"type":"paragraph","text":"Cotas, recorridos de escurrimiento, defensas, reservorios, canales, estaciones de bombeo y otros componentes del sistema deberán integrarse con su institución responsable, fecha y documentación metodológica."},
    {"type":"callout","tone":"information","title":"Una regla editorial del proyecto","text":"Cuando un dato todavía no esté disponible o no haya sido validado, la interfaz lo dirá de forma explícita. Un espacio vacío es preferible a un valor que pueda confundirse con información oficial."},
    {"type":"heading","text":"Información que cambia con cada escenario"},
    {"type":"paragraph","text":"A la estructura física de la ciudad se sumarán niveles y tendencias de los ríos Paraná y Salado, precipitaciones, pronósticos y alertas. Cada publicación diferenciará datos observados, pronósticos y escenarios probables."},
    {"type":"quote","text":"Informar durante la incertidumbre también es una política de prevención."},
    {"type":"heading","text":"Participar sin confundir las fuentes"},
    {"type":"paragraph","text":"La comunidad podrá reportar bocas de tormenta obstruidas, desagües tapados, calles anegadas y otros puntos críticos. Esos aportes deberán contar con validación y seguimiento."},
    {"type":"list","items":["Identificación clara de los reportes ciudadanos.","Estados visibles de revisión y validación.","Diferenciación respecto de los datos oficiales.","Registro público de problemas, intervenciones y respuestas."]}
  ]$$::jsonb,
  'published',
  null
)
on conflict (slug) do nothing;
