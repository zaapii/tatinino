create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Lista explícita de usuarios autorizados a ingresar a la administración.';

alter table public.admin_users enable row level security;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

create policy "Administrators can verify their own access"
  on public.admin_users
  for select
  to authenticated
  using (user_id = (select auth.uid()));

insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = 'admin@tati.com.ar'
on conflict (user_id) do nothing;
