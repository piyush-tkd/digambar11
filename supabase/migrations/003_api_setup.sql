-- ============================================================
-- API Setup: Connect Real-Time Cricket Data
--
-- STEP 1: Get a free API key from https://cricketdata.org
--         (Sign up â Dashboard â Copy API Key)
--         Free tier = 100 API calls/day (enough for ~3 live matches)
--
-- STEP 2: Replace 'YOUR_CRICKETDATA_API_KEY' below with your real key
--
-- STEP 3: (Optional) Get Sportmonks key from https://www.sportmonks.com/cricket-api/
--         for fallback coverage
-- ============================================================

-- Update CricketData.org (primary provider)
UPDATE provider_config
SET api_key = 'YOUR_CRICKETDATA_API_KEY',  -- â REPLACE THIS
    base_url = 'https://api.cricapi.com/v1',
    is_primary = TRUE,
    enabled = TRUE,
    rate_limit_per_day = 100
WHERE id = 'cricketdata';

-- Update Sportmonks (fallback provider) â optional
UPDATE provider_config
SET api_key = 'YOUR_SPORTMONKS_API_KEY',  -- â REPLACE THIS (optional)
    base_url = 'https://cricket.sportmonks.com/api/v2.0',
    is_primary = FALSE,
    enabled = FALSE,  -- Enable when you have a key
    rate_limit_per_day = 500
WHERE id = 'sportmonks';

-- ============================================================
-- Supabase Edge Function Secrets
-- Run these in your terminal (not SQL Editor):
--
-- supabase secrets set CRON_SECRET=your-random-secret-here
--
-- The Edge Functions already use SUPABASE_URL and
-- SUPABASE_SERVICE_ROLE_KEY which are auto-set.
-- ============================================================

-- ============================================================
-- Cron Job: Auto-sync matches daily
-- (Requires pg_cron extension â enabled on Supabase Pro)
-- For free tier, call match-sync manually or via external cron
-- ============================================================
-- SELECT cron.schedule(
--   'sync-ipl-matches',
--   '0 6 * * *',  -- Daily at 6 AM UTC
--   $$
--   SELECT net.http_post(
--     url := current_setting('app.supabase_url') || '/functions/v1/match-sync',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('app.cron_secret')
--     )
--   );
--   $$
-- );

-- ============================================================
-- Cron Job: Ingest live scores every 30 seconds during matches
-- (Requires pg_cron â for free tier, use external scheduler)
-- ============================================================
-- SELECT cron.schedule(
--   'ingest-live-scores',
--   '*/1 * * * *',  -- Every minute (pg_cron min interval)
--   $$
--   SELECT net.http_post(
--     url := current_setting('app.supabase_url') || '/functions/v1/score-ingestion',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('app.cron_secret')
--     )
--   );
--   $$
-- );
