-- Add unique constraint on (match_id, player_id) for upsert support
ALTER TABLE live_scores ADD CONSTRAINT live_scores_match_player_unique UNIQUE (match_id, player_id);

-- Allow admin to INSERT and UPDATE live_scores
CREATE POLICY "Admin can insert live scores" ON live_scores
FOR INSERT
WITH CHECK (
  auth.jwt() ->> 'email' = 'bahetipiyush@gmail.com'
);

CREATE POLICY "Admin can update live scores" ON live_scores
FOR UPDATE
USING (
  auth.jwt() ->> 'email' = 'bahetipiyush@gmail.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'bahetipiyush@gmail.com'
);
