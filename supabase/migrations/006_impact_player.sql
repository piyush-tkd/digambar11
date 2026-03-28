-- ============================================================
-- 006: Add Impact Player support
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. Add impact_player_id column to user_teams (nullable, since it's optional/new)
ALTER TABLE user_teams
  ADD COLUMN IF NOT EXISTS impact_player_id UUID REFERENCES players(id);

-- 2. Add constraint: impact player must be different from captain and VC
ALTER TABLE user_teams
  ADD CONSTRAINT impact_not_captain CHECK (impact_player_id IS NULL OR impact_player_id != captain_id);
ALTER TABLE user_teams
  ADD CONSTRAINT impact_not_vc CHECK (impact_player_id IS NULL OR impact_player_id != vice_captain_id);

-- 3. Update points calculation to include +4 bonus for Impact Player
CREATE OR REPLACE FUNCTION calculate_user_team_points(p_match_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update total_points for each user_team based on live_scores
  -- Captain = 2x, Vice Captain = 1.5x, Impact Player = base pts + 4 bonus
  UPDATE user_teams ut SET
    total_points = (
      SELECT COALESCE(SUM(
        ls.fantasy_pts * CASE
          WHEN utp.player_id = ut.captain_id THEN 2.0
          WHEN utp.player_id = ut.vice_captain_id THEN 1.5
          ELSE 1.0
        END
        + CASE
          WHEN utp.player_id = ut.impact_player_id THEN 4.0
          ELSE 0.0
        END
      ), 0)
      FROM user_team_players utp
      JOIN live_scores ls ON ls.player_id = utp.player_id AND ls.match_id = ut.match_id
      WHERE utp.user_team_id = ut.id
    ),
    updated_at = NOW()
  WHERE ut.match_id = p_match_id;

  -- Update ranks within each contest for this match
  WITH ranked AS (
    SELECT ce.id, RANK() OVER (
      PARTITION BY ce.contest_id
      ORDER BY ut.total_points DESC
    ) AS new_rank
    FROM contest_entries ce
    JOIN user_teams ut ON ut.id = ce.user_team_id
    WHERE ut.match_id = p_match_id
  )
  UPDATE contest_entries SET rank = ranked.new_rank
  FROM ranked WHERE contest_entries.id = ranked.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
