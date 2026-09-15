select net.http_post(
  url := 'https://spjrxnkompyyjbztzzlo.supabase.co/functions/v1/update-satellite-imagery',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'satellite_cron_secret'
      limit 1
    )
  ),
  body := jsonb_build_object('requested_at', now(), 'reason', 'higher-quality-render', 'force', true)
);
