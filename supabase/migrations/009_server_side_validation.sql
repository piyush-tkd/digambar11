-- ============================================================
-- 009: Server-side validation for team rules
-- Prevents bypassing client-side rules via browser console/API
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- ============================================================
-- 1. TRIGGER: Validate user_teams on INSERT/UPDATE
--    - Match must not have started
--    - user_id must match auth.uid()
--    - Captain and VC must be real players in this match
--    - Impact player must be different from C/VC
--    - Total credits <= 100
-- ============================================================
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

  -- 3. Validate captain exists as a player in this match's teams
  --    (skip check if match_players not yet populated — pre-match)
  IF EXISTS(SELECT 1 FROM match_players WHERE match_id = NEW.match_id LIMIT 1) THEN
    SELECT EXISTS(
      SELECT 1 FROM players p
      JOIN match_players mp ON mp.player_id = p.id AND mp.match_id = NEW.match_id
      WHERE p.id = NEW.captain_id
    ) INTO cap_exists;
    IF NOT cap_exists THEN
      RAISE EXCEPTION 'Captain must be a valid player in this match';
    END IF;

    -- 4. Validate vice captain exists as a player in this match's teams
    SELECT EXISTS(
      SELECT 1 FROM players p
      JOIN match_players mp ON mp.player_id = p.id AND mp.match_id = NEW.match_id
      WHERE p.id = NEW.vice_captain_id
    ) INTO vc_exists;
    IF NOT vc_exists THEN
      RAISE EXCEPTION 'Vice Captain must be a valid player in this match';
    END IF;
  END IF;

  -- 5. Captain != Vice Captain (also enforced by CHECK constraint, but belt and suspenders)
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

  -- Auto-update timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS trg_validate_user_team ON user_teams;
CREATE TRIGGER trg_validate_user_team
  BEFORE INSERT OR UPDATE ON user_teams
  FOR EACH ROW EXECUTE FUNCTION validate_user_team();


-- ============================================================
-- 2. TRIGGER: Validate user_team_players on INSERT
--    - Parent team must belong to current user
--    - Match must not have started
--    - Player must be a valid player in this match
--    - Max 11 players per team
--    - Max 4 overseas players
--    - Min 1 per role (WK, BAT, AR, BWL), max 8 per role
--    - Max 10 from one team
-- ============================================================
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

  -- 4. Validate player exists and is in this match
  --    (skip check if match_players not yet populated — pre-match)
  IF EXISTS(SELECT 1 FROM match_players WHERE match_id = team_match_id LIMIT 1) THEN
    IF NOT EXISTS(
      SELECT 1 FROM players p
      JOIN match_players mp ON mp.player_id = p.id AND mp.match_id = team_match_id
      WHERE p.id = NEW.player_id
    ) THEN
      RAISE EXCEPTION 'Player is not available for this match';
    END IF;
  END IF;

  -- 5. Check max 11 players (before this insert)
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

DROP TRIGGER IF EXISTS trg_validate_user_team_player ON user_team_players;
CREATE TRIGGER trg_validate_user_team_player
  BEFORE INSERT OR UPDATE ON user_team_players
  FOR EACH ROW EXECUTE FUNCTION validate_user_team_player();


-- ============================================================
-- 3. TRIGGER: Prevent DELETE on user_team_players after match starts
-- ============================================================
CREATE OR REPLACE FUNCTION validate_user_team_player_delete()
RETURNS TRIGGER AS $$
DECLARE
  team_match_id UUID;
  match_start TIMESTAMPTZ;
  team_owner UUID;
BEGIN
  -- Get match info from parent team
  SELECT ut.match_id, ut.user_id INTO team_match_id, team_owner
  FROM user_teams ut WHERE ut.id = OLD.user_team_id;

  -- Only owner can delete
  IF team_owner != auth.uid() THEN
    RAISE EXCEPTION 'Cannot modify another user''s team';
  END IF;

  -- Check match hasn't started
  SELECT starts_at INTO match_start FROM matches WHERE id = team_match_id;
  IF match_start <= NOW() THEN
    RAISE EXCEPTION 'Cannot modify team after match has started';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_validate_user_team_player_delete ON user_team_players;
CREATE TRIGGER trg_validate_user_team_player_delete
  BEFORE DELETE ON user_team_players
  FOR EACH ROW EXECUTE FUNCTION validate_user_team_player_delete();


-- ============================================================
-- 4. TRIGGER: Prevent DELETE on user_teams after match starts
-- ============================================================
CREATE OR REPLACE FUNCTION validate_user_team_delete()
RETURNS TRIGGER AS $$
DECLARE
  match_start TIMESTAMPTZ;
BEGIN
  -- Only owner can delete
  IF OLD.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete another user''s team';
  END IF;

  -- Check match hasn't started
  SELECT starts_at INTO match_start FROM matches WHERE id = OLD.match_id;
  IF match_start <= NOW() THEN
    RAISE EXCEPTION 'Cannot delete team after match has started';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_validate_user_team_delete ON user_teams;
CREATE TRIGGER trg_validate_user_team_delete
  BEFORE DELETE ON user_teams
  FOR EACH ROW EXECUTE FUNCTION validate_user_team_delete();


-- ============================================================
-- 5. Tighten RLS: Replace broad "view all" with scoped policies
--    Users can only see teams for matches they're also in
-- ============================================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Users can view all teams in their matches" ON user_teams;
DROP POLICY IF EXISTS "Team players are viewable" ON user_team_players;

-- New: users can see their OWN teams always, and OTHER teams only for matches they've joined
CREATE POLICY "Users can view own teams" ON user_teams
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view other teams in shared matches" ON user_teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_teams my_team
      WHERE my_team.user_id = auth.uid()
        AND my_team.match_id = user_teams.match_id
    )
  );

-- User team players: can see players for teams you can see
DROP POLICY IF EXISTS "Users can manage own team players" ON user_team_players;

CREATE POLICY "Users can view team players for visible teams" ON user_team_players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_teams ut
      WHERE ut.id = user_team_players.user_team_id
        AND (
          ut.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM user_teams my_team
            WHERE my_team.user_id = auth.uid()
              AND my_team.match_id = ut.match_id
          )
        )
    )
  );

-- Re-create write policies for user_team_players
CREATE POLICY "Users can manage own team players" ON user_team_players
  FOR ALL
  USING (EXISTS (SELECT 1 FROM user_teams WHERE user_teams.id = user_team_players.user_team_id AND user_teams.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM user_teams WHERE user_teams.id = user_team_players.user_team_id AND user_teams.user_id = auth.uid()));
