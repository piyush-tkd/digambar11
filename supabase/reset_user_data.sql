-- ============================================================
-- Digambar11 — RESET ALL USER DATA FOR FRESH START
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- This clears ALL user-generated data while keeping:
--   ✅ Matches (synced from Sportmonks)
--   ✅ Players (synced from Sportmonks)
--   ✅ Provider config
--   ✅ Schema, functions, triggers, RLS policies
--   ✅ Auth users (they can still log in, but start fresh)
--
-- This deletes:
--   ❌ Contest entries
--   ❌ Contests
--   ❌ User team players
--   ❌ User teams
--   ❌ Transactions
--   ❌ Live scores
--   ❌ Match players
--   ❌ Sync log (if exists)
--   ❌ Profiles (will auto-recreate on next login via trigger)
-- ============================================================

-- Step 1: Delete in correct order (respecting foreign keys)
DELETE FROM contest_entries;
DELETE FROM contests;
DELETE FROM user_team_players;
DELETE FROM user_teams;
DELETE FROM transactions;
DELETE FROM live_scores;
DELETE FROM match_players;

-- Step 2: Clear sync log if it exists (from auto-sync migration)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sync_log') THEN
    EXECUTE 'DELETE FROM sync_log';
  END IF;
END $$;

-- Step 3: Reset profiles — clear squad names and reset wallets
-- (keeps auth accounts intact, they just get a fresh start)
UPDATE profiles SET
  squad_name = NULL,
  wallet_balance = 1000.00,
  updated_at = NOW();

-- Step 4: Reset match statuses to upcoming (optional — remove if you want to keep match history)
-- UPDATE matches SET status = 'upcoming', score_a = '', score_b = '', result = NULL, innings = 0;

-- Verify cleanup
SELECT 'contest_entries' AS table_name, COUNT(*) AS rows FROM contest_entries
UNION ALL SELECT 'contests', COUNT(*) FROM contests
UNION ALL SELECT 'user_team_players', COUNT(*) FROM user_team_players
UNION ALL SELECT 'user_teams', COUNT(*) FROM user_teams
UNION ALL SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL SELECT 'live_scores', COUNT(*) FROM live_scores
UNION ALL SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL SELECT 'matches', COUNT(*) FROM matches
UNION ALL SELECT 'players', COUNT(*) FROM players;

-- Done! All users will see:
-- • Login screen (existing Google accounts still work)
-- • Squad name setup (since squad_name is now NULL)
-- • ₹1000 starting balance
-- • All synced matches visible
-- • No teams, no contests, no transactions
