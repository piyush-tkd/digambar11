-- Migration: Create RPC functions for secure match upserts
-- These allow client-side CricAPI syncing without exposing INSERT permissions

-- Single match upsert
CREATE OR REPLACE FUNCTION upsert_match(
  p_external_id TEXT,
  p_team_a TEXT,
  p_team_b TEXT,
  p_team_a_name TEXT,
  p_team_b_name TEXT,
  p_venue TEXT,
  p_starts_at TIMESTAMPTZ,
  p_status match_status,
  p_score_a TEXT DEFAULT '',
  p_score_b TEXT DEFAULT '',
  p_result TEXT DEFAULT NULL,
  p_innings SMALLINT DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO matches (external_id, team_a, team_b, team_a_name, team_b_name, venue, starts_at, status, score_a, score_b, result, innings, updated_at)
  VALUES (p_external_id, p_team_a, p_team_b, p_team_a_name, p_team_b_name, p_venue, p_starts_at, p_status, p_score_a, p_score_b, p_result, p_innings, NOW())
  ON CONFLICT (external_id) DO UPDATE SET
    status = EXCLUDED.status,
    score_a = EXCLUDED.score_a,
    score_b = EXCLUDED.score_b,
    result = EXCLUDED.result,
    innings = EXCLUDED.innings,
    venue = EXCLUDED.venue,
    updated_at = NOW();
END;
$$;

-- Bulk match upsert (for syncing multiple matches at once)
CREATE OR REPLACE FUNCTION bulk_upsert_matches(matches JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  match_record JSONB;
  synced INT := 0;
  failed INT := 0;
BEGIN
  FOR match_record IN SELECT * FROM jsonb_array_elements(matches)
  LOOP
    BEGIN
      INSERT INTO matches (external_id, team_a, team_b, team_a_name, team_b_name, venue, starts_at, status, score_a, score_b, result, innings, updated_at)
      VALUES (
        match_record->>'external_id',
        match_record->>'team_a',
        match_record->>'team_b',
        match_record->>'team_a_name',
        match_record->>'team_b_name',
        match_record->>'venue',
        (match_record->>'starts_at')::TIMESTAMPTZ,
        (match_record->>'status')::match_status,
        COALESCE(match_record->>'score_a', ''),
        COALESCE(match_record->>'score_b', ''),
        match_record->>'result',
        COALESCE((match_record->>'innings')::SMALLINT, 0),
        NOW()
      )
      ON CONFLICT (external_id) DO UPDATE SET
        status = EXCLUDED.status,
        score_a = EXCLUDED.score_a,
        score_b = EXCLUDED.score_b,
        result = EXCLUDED.result,
        innings = EXCLUDED.innings,
        venue = EXCLUDED.venue,
        updated_at = NOW();
      synced := synced + 1;
    EXCEPTION WHEN OTHERS THEN
      failed := failed + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object('synced', synced, 'failed', failed);
END;
$$;

-- Ensure Realtime is enabled for key tables
-- (matches is already in the publication from the initial schema)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE live_scores;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE user_teams;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;
