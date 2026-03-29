-- FIX: Skip match_players validation when table is not yet populated for the match
-- Run this in Supabase SQL Editor to fix "error while saving team" for future matches

-- 1. Fix validate_user_team trigger (captain/VC check)
CREATE OR REPLACE FUNCTION validate_user_team()
RETURNS TRIGGER AS $$
DECLARE
  match_start TIMESTAMPTZ;
  cap_exists BOOLEAN;
  vc_exists BOOLEAN;
  ip_exists BOOLEAN;
BEGIN
  -- 1. Ensure user can only save their own team
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create or modify another user''s team';
  END IF;

  -- 2. Check match hasn't started yet
  SELECT starts_at INTO match_start FROM matches WHERE id = NEW.match_id;
  IF match_start IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;
  IF match_start <= NOW() THEN
    RAISE EXCEPTION 'Cannot modify team after match has started';
  END IF;

  -- 3/4. Validate captain/VC only if match_players populated
  IF EXISTS(SELECT 1 FROM match_players WHERE match_id = NEW.match_id LIMIT 1) THEN
    SELECT EXISTS(
      SELECT 1 FROM players p
      JOIN match_players mp ON mp.player_id = p.id AND mp.match_id = NEW.match_id
      WHERE p.id = NEW.captain_id
    ) INTO cap_exists;
    IF NOT cap_exists THEN
      RAISE EXCEPTION 'Captain must be a valid player in this match';
    END IF;

    SELECT EXISTS(
      SELECT 1 FROM players p
      JOIN match_players mp ON mp.player_id = p.id AND mp.match_id = NEW.match_id
      WHERE p.id = NEW.vice_captain_id
    ) INTO vc_exists;
    IF NOT vc_exists THEN
      RAISE EXCEPTION 'Vice Captain must be a valid player in this match';
    END IF;
  END IF;

  -- 5. Captain != Vice Captain
  IF NEW.captain_id = NEW.vice_captain_id THEN
    RAISE EXCEPTION 'Captain and Vice Captain must be different players';
  END IF;

  -- 6. Validate impact player if set
  IF NEW.impact_player_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM players p WHERE p.id = NEW.impact_player_id
    ) INTO ip_exists;
    IF NOT ip_exists THEN
      RAISE EXCEPTION 'Impact Player must be a valid player';
    END IF;
    IF NEW.impact_player_id = NEW.captain_id THEN
      RAISE EXCEPTION 'Impact Player cannot be the Captain';
    END IF;
    IF NEW.impact_player_id = NEW.vice_captain_id THEN
      RAISE EXCEPTION 'Impact Player cannot be the Vice Captain';
    END IF;
  END IF;

  -- 7. Validate total credits <= 100
  IF NEW.total_credits > 100 THEN
    RAISE EXCEPTION 'Total credits cannot exceed 100 (got %)', NEW.total_credits;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Fix validate_user_team_player trigger (player availability check)
CREATE OR REPLACE FUNCTION validate_user_team_player()
RETURNS TRIGGER AS $$
DECLARE
  team_owner UUID;
  team_match_id UUID;
  match_start TIMESTAMPTZ;
  player_count INTEGER;
  overseas_count INTEGER;
  player_team TEXT;
  player_overseas BOOLEAN;
  same_team_count INTEGER;
BEGIN
  -- 1. Get parent team info
  SELECT ut.user_id, ut.match_id INTO team_owner, team_match_id
  FROM user_teams ut WHERE ut.id = NEW.user_team_id;

  IF team_owner IS NULL THEN
    RAISE EXCEPTION 'Team not found';
  END IF;

  -- 2. Ensure user owns this team
  IF team_owner != auth.uid() THEN
    RAISE EXCEPTION 'Cannot modify another user''s team';
  END IF;

  -- 3. Check match hasn't started
  SELECT starts_at INTO match_start FROM matches WHERE id = team_match_id;
  IF match_start <= NOW() THEN
    RAISE EXCEPTION 'Cannot modify team after match has started';
  END IF;

  -- 4. Validate player is in this match (only if match_players populated)
  IF EXISTS(SELECT 1 FROM match_players WHERE match_id = team_match_id LIMIT 1) THEN
    IF NOT EXISTS(
      SELECT 1 FROM players p
      JOIN match_players mp ON mp.player_id = p.id AND mp.match_id = team_match_id
      WHERE p.id = NEW.player_id
    ) THEN
      RAISE EXCEPTION 'Player is not available for this match';
    END IF;
  END IF;

  -- 5. Check max 11 players
  SELECT COUNT(*) INTO player_count
  FROM user_team_players WHERE user_team_id = NEW.user_team_id AND player_id != NEW.player_id;
  IF player_count >= 11 THEN
    RAISE EXCEPTION 'Maximum 11 players per team (already have %)', player_count;
  END IF;

  -- 6. Check max 4 overseas
  SELECT p.team, p.overseas INTO player_team, player_overseas
  FROM players p WHERE p.id = NEW.player_id;

  IF player_overseas THEN
    SELECT COUNT(*) INTO overseas_count
    FROM user_team_players utp
    JOIN players p ON p.id = utp.player_id
    WHERE utp.user_team_id = NEW.user_team_id
      AND utp.player_id != NEW.player_id
      AND p.overseas = TRUE;
    IF overseas_count >= 4 THEN
      RAISE EXCEPTION 'Maximum 4 overseas players (already have %)', overseas_count;
    END IF;
  END IF;

  -- 7. Check max 10 from same team
  SELECT COUNT(*) INTO same_team_count
  FROM user_team_players utp
  JOIN players p ON p.id = utp.player_id
  WHERE utp.user_team_id = NEW.user_team_id
    AND utp.player_id != NEW.player_id
    AND p.team = player_team;
  IF same_team_count >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 players from one team (% already has %)', player_team, same_team_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
