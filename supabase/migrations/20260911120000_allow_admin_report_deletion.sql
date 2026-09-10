grant delete on table public.citizen_reports to authenticated;

create policy "Administrators can delete citizen reports"
  on public.citizen_reports for delete to authenticated
  using (exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  ));

-- Private contact records are removed by their existing ON DELETE CASCADE.

create policy "Administrators can delete citizen report photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'citizen-report-photos' and exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  ));

create policy "Administrators can read citizen report photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'citizen-report-photos' and exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  ));
