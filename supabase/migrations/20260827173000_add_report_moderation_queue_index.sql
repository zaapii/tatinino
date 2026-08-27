create index if not exists citizen_reports_moderation_queue_idx
  on public.citizen_reports (status, created_at desc, id desc);
