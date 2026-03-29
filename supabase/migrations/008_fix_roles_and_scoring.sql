-- ============================================================
-- 008: Fix player role misclassifications & Impact Player scoring
-- ============================================================

-- Fix 14 misclassified player roles
UPDATE players SET role = 'AR' WHERE name = 'Jason Holder' AND team = 'GT';
UPDATE players SET role = 'BWL' WHERE name = 'Luke Wood' AND team = 'GT';
UPDATE players SET role = 'AR' WHERE name = 'Washington Sundar' AND team = 'GT';
UPDATE players SET role = 'WK' WHERE name = 'Tom Banton' AND team = 'GT';
UPDATE players SET role = 'AR' WHERE name = 'Jamie Overton' AND team = 'CSK';
UPDATE players SET role = 'BAT' WHERE name = 'Ayush Mhatre' AND team = 'CSK';
UPDATE players SET role = 'BWL' WHERE name = 'Zak Foulkes' AND team = 'CSK';
UPDATE players SET role = 'AR' WHERE name = 'Atharva Ankolekar' AND team = 'MI';
UPDATE players SET role = 'AR' WHERE name = 'Will Jacks' AND team = 'MI';
UPDATE players SET role = 'BAT' WHERE name = 'Ben Duckett' AND team = 'DC';
UPDATE players SET role = 'AR' WHERE name = 'Romario Shepherd' AND team = 'RCB';
UPDATE players SET role = 'BWL' WHERE name = 'Mangesh Yadav' AND team = 'RCB';
UPDATE players SET role = 'AR' WHERE name = 'Nitish Kumar Reddy' AND team = 'SRH';
UPDATE players SET role = 'AR' WHERE name = 'Rachin Ravindra' AND team = 'KKR';

-- Fix Impact Player scoring: IP is a normal 12th man, earns regular 1x points (no +4 bonus)
CREATE OR REPLACE FUNCTION calculate_user_team_points(p_match_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_teams ut SET
    total_points = (
      SELECT COALESCE(SUM(
        ls.fantasy_pts * CASE
          WHEN utp.player_id = ut.captain_id THEN 2.0
          WHEN utp.player_id = ut.vice_captain_id THEN 1.5
          ELSE 1.0
        END
      ), 0)
      FROM user_team_players utp
      JOIN live_scores ls ON ls.player_id = utp.player_id AND ls.match_id = ut.match_id
      WHERE utp.user_team_id = ut.id
    ),
    updated_at = NOW()
  WHERE ut.match_id = p_match_id;

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
