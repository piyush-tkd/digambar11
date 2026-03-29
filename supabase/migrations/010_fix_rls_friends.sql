-- ============================================================
-- 010: Fix RLS policies for friends league visibility
-- The self-referential "view other teams in shared matches" policy
-- from 009 causes empty results. Simplify: authenticated users
-- can see all teams for matches (this is a friends league app).
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Drop the problematic self-referential policies
DROP POLICY IF EXISTS "Users can view own teams" ON user_teams;
DROP POLICY IF EXISTS "Users can view other teams in shared matches" ON user_teams;

-- Simple SELECT policy: authenticated users can see all teams
-- (write operations are still restricted to own teams via other policies)
CREATE POLICY "Authenticated users can view teams" ON user_teams
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Fix user_team_players SELECT policy too
DROP POLICY IF EXISTS "Users can view team players for visible teams" ON user_team_players;

-- Authenticated users can view all team players (read only)
CREATE POLICY "Authenticated users can view team players" ON user_team_players
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
