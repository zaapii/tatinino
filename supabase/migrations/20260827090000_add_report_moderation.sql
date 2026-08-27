alter table public.citizen_reports
  drop constraint citizen_reports_status_check;

update public.citizen_reports
set status = case
  when status = 'reported' then 'pending'
  when status = 'dismissed' then 'rejected'
  else 'approved'
end;

alter table public.citizen_reports
  alter column status set default 'pending',
  add constraint citizen_reports_status_check check (
    status in ('pending', 'approved', 'rejected')
  );

comment on column public.citizen_reports.status is
  'Moderación de publicación: pending, approved o rejected. Solo approved es público.';

drop policy "Public can read citizen reports"
  on public.citizen_reports;

create policy "Approved citizen reports are public"
  on public.citizen_reports
  for select
  to anon, authenticated
  using (status = 'approved');

create policy "Administrators can read all citizen reports"
  on public.citizen_reports
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

drop policy "Public can submit unverified citizen reports"
  on public.citizen_reports;

create policy "Public can submit pending citizen reports"
  on public.citizen_reports
  for insert
  to anon, authenticated
  with check (status = 'pending');

grant update (status)
  on table public.citizen_reports to authenticated;

create policy "Administrators can moderate citizen reports"
  on public.citizen_reports
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
    status in ('pending', 'approved', 'rejected')
    and exists (
      select 1
      from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );
