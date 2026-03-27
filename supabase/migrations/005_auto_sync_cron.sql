-- ============================================================
-- Auto-Sync: Schedule match sync every 6 hours via pg_cron
-- This calls the match-sync Edge Function automatically.
-- No manual intervention needed — matches stay up to date.
--
-- Schedule: 6 AM, 12 PM, 6 PM, 12 AM IST (UTC+5:30)
-- That's: 0:30, 6:30, 12:30, 18:30 UTC
-- ============================================================

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a sync log table to track auto-sync history
CREATE TABLE IF NOT EXISTS sync_log (
  id BIGSERIAL PRIMARY KEY,
  trigger_type TEXT NOT NULL DEFAULT 'auto',  -- 'auto' or 'manual'
  provider TEXT,
  matches_synced INT DEFAULT 0,
  matches_skipped INT DEFAULT 0,
  api_calls INT DEFAULT 0,
  status TEXT DEFAULT 'pending',  -- 'pending', 'success', 'error'
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Grant access to sync_log for authenticated users (admin can view)
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can view sync logs" ON sync_log
  FOR SELECT USING (auth.jwt() ->> 'email' = 'bahetipiyush@gmail.com');

-- Function to call the match-sync Edge Function via pg_net
CREATE OR REPLACE FUNCTION auto_sync_matches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _edge_url TEXT;
  _service_key TEXT;
  _log_id BIGINT;
BEGIN
  -- Get the Edge Function URL
  _edge_url := current_setting('app.settings.supabase_url', true)
    || '/functions/v1/match-sync';

  -- If app.settings not configured, use hardcoded project URL
  IF _edge_url IS NULL OR _edge_url = '' OR _edge_url LIKE '%/functions/v1/match-sync' AND LENGTH(_edge_url) < 40 THEN
    _edge_url := 'https://dpuglcubuhbzowrzmfxd.supabase.co/functions/v1/match-sync';
  END IF;

  _service_key := current_setting('app.settings.service_role_key', true);
  IF _service_key IS NULL OR _service_key = '' THEN
    _service_key := current_setting('supabase.service_role_key', true);
  END IF;

  -- Log the sync attempt
  INSERT INTO sync_log (trigger_type, status, started_at)
  VALUES ('auto', 'pending', NOW())
  RETURNING id INTO _log_id;

  -- Call the Edge Function via pg_net (async HTTP POST)
  PERFORM net.http_post(
    url := _edge_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(_service_key, '')
    ),
    body := '{}'::jsonb
  );

  -- Mark as triggered (we can't get the response synchronously with pg_net)
  UPDATE sync_log SET status = 'triggered' WHERE id = _log_id;

EXCEPTION WHEN OTHERS THEN
  -- Log the error
  UPDATE sync_log
  SET status = 'error', error_message = SQLERRM, completed_at = NOW()
  WHERE id = _log_id;
END;
$$;

-- Schedule: Run every 6 hours at :30 past the hour (IST alignment)
-- 0:30 UTC = 6:00 AM IST
-- 6:30 UTC = 12:00 PM IST
-- 12:30 UTC = 6:00 PM IST
-- 18:30 UTC = 12:00 AM IST
SELECT cron.schedule(
  'auto-sync-matches',
  '30 0,6,12,18 * * *',  -- Every 6 hours at :30
  $$SELECT auto_sync_matches()$$
);

-- Also run a match sync 25 minutes before common IPL match times
-- IPL matches typically start at 7:30 PM IST (14:00 UTC) and 3:30 PM IST (10:00 UTC)
-- 25 min before: 3:05 PM IST (9:35 UTC) and 7:05 PM IST (13:35 UTC)
SELECT cron.schedule(
  'pre-match-sync',
  '35 9,13 * * *',  -- 3:05 PM IST and 7:05 PM IST (25 min before match)
  $$SELECT auto_sync_matches()$$
);

-- Clean up old sync logs (keep last 30 days)
SELECT cron.schedule(
  'cleanup-sync-logs',
  '0 3 * * 0',  -- Every Sunday at 3 AM UTC
  $$DELETE FROM sync_log WHERE started_at < NOW() - INTERVAL '30 days'$$
);
