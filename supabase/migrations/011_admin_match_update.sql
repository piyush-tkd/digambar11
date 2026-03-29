-- Allow admin user to update match scores/status via the app
-- Checks the JWT email claim directly from auth token

CREATE POLICY "Admin can update matches" ON matches
FOR UPDATE
USING (
  auth.jwt() ->> 'email' = 'bahetipiyush@gmail.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'bahetipiyush@gmail.com'
);
