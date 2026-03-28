-- ============================================================
-- 008: ESPN Live Scores Support
-- Adds espn_id column for ESPNCricinfo match tracking
-- ============================================================

-- Add ESPN match ID column for direct match page lookups
ALTER TABLE matches ADD COLUMN IF NOT EXISTS espn_id TEXT;

-- Create index for ESPN ID lookups
CREATE INDEX IF NOT EXISTS idx_matches_espn_id ON matches(espn_id);

-- Update known ESPN match IDs for IPL 2026
-- RCB vs SRH (Match 1) — ESPN match ID 1527674
UPDATE matches SET espn_id = '1527674'
WHERE team_a = 'RCB' AND team_b = 'SRH' AND external_id = '69518';

-- You can add more ESPN IDs here as matches are identified
-- The Edge Function will also auto-populate espn_id when it finds matches
