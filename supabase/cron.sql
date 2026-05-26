-- ============================================================
-- OKTW EPI Manager — Jobs pg_cron
-- Execute no SQL Editor com extensão pg_cron habilitada
-- ============================================================

-- Habilitar extensão (se não estiver)
create extension if not exists pg_cron;
grant usage on schema cron to postgres;

-- Job diário às 07:00 (Brasília = UTC-3, então 10:00 UTC)
select cron.schedule(
  'alertas-vencimento-diario',
  '0 10 * * *',
  $$
  select
    net.http_post(
      url := current_setting('app.url') || '/api/alertas/cron',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.cron_secret')
      ),
      body := '{}'::jsonb
    )
  $$
);

-- Alternativa sem pg_net: usar Edge Function agendada no dashboard do Supabase
-- Dashboard > Edge Functions > Schedule > "0 10 * * *" → alertas-vencimento
