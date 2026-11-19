-- Configure the secret values in Supabase Vault before running this file:
--   tainails_app_url      = the stable production URL of the Vercel project
--   tainails_cron_secret = the same value as CRON_SECRET in Vercel
-- Keep both values out of source control.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'tainails-expirar-sinais',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url := (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'tainails_app_url'
      ) || '/api/cron/expirar-sinais',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'tainails_cron_secret'
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 10000
    );
  $$
);

SELECT cron.schedule(
  'tainails-lembrete',
  '0 18 * * *',
  $$
    SELECT net.http_post(
      url := (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'tainails_app_url'
      ) || '/api/cron/lembrete',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'tainails_cron_secret'
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 10000
    );
  $$
);
