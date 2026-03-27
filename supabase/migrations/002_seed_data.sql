-- ============================================================
-- Seed Data: IPL 2026 Players + Sample Matches
-- Run AFTER 001_schema.sql
-- ============================================================

-- ============================================================
-- PLAYERS: CSK
-- ============================================================
INSERT INTO players (external_id, name, team, role, credit, overseas, sel_pct) VALUES
  ('csk_dhoni', 'MS Dhoni', 'CSK', 'WK', 9.0, FALSE, 95),
  ('csk_ruturaj', 'Ruturaj Gaikwad', 'CSK', 'BAT', 10.0, FALSE, 88),
  ('csk_conway', 'Devon Conway', 'CSK', 'BAT', 9.0, TRUE, 72),
  ('csk_dube', 'Shivam Dube', 'CSK', 'AR', 8.5, FALSE, 65),
  ('csk_jadeja', 'Ravindra Jadeja', 'CSK', 'AR', 9.5, FALSE, 92),
  ('csk_chahar', 'Deepak Chahar', 'CSK', 'BWL', 8.5, FALSE, 78),
  ('csk_pathirana', 'Matheesha Pathirana', 'CSK', 'BWL', 8.0, TRUE, 68),
  ('csk_tushar', 'Tushar Deshpande', 'CSK', 'BWL', 7.0, FALSE, 45),
  ('csk_rachin', 'Rachin Ravindra', 'CSK', 'AR', 8.5, TRUE, 52),
  ('csk_rasheed', 'Shaik Rasheed', 'CSK', 'BAT', 7.0, FALSE, 38),
  ('csk_noor', 'Noor Ahmad', 'CSK', 'BWL', 7.5, TRUE, 42),
  ('csk_ashwin', 'R Ashwin', 'CSK', 'BWL', 8.0, FALSE, 55);

-- ============================================================
-- PLAYERS: MI
-- ============================================================
INSERT INTO players (external_id, name, team, role, credit, overseas, sel_pct) VALUES
  ('mi_ishan', 'Ishan Kishan', 'MI', 'WK', 8.5, FALSE, 82),
  ('mi_rohit', 'Rohit Sharma', 'MI', 'BAT', 10.5, FALSE, 96),
  ('mi_sky', 'Suryakumar Yadav', 'MI', 'BAT', 10.0, FALSE, 85),
  ('mi_tilak', 'Tilak Varma', 'MI', 'BAT', 8.5, FALSE, 72),
  ('mi_hardik', 'Hardik Pandya', 'MI', 'AR', 9.5, FALSE, 80),
  ('mi_tim', 'Tim David', 'MI', 'BAT', 8.0, TRUE, 52),
  ('mi_bumrah', 'Jasprit Bumrah', 'MI', 'BWL', 11.0, FALSE, 95),
  ('mi_boult', 'Trent Boult', 'MI', 'BWL', 9.0, TRUE, 70),
  ('mi_piyush', 'Piyush Chawla', 'MI', 'BWL', 7.0, FALSE, 28),
  ('mi_naman', 'Naman Dhir', 'MI', 'AR', 7.5, FALSE, 35),
  ('mi_hooda', 'Deepak Hooda', 'MI', 'AR', 7.5, FALSE, 30),
  ('mi_jacks', 'Will Jacks', 'MI', 'AR', 8.5, TRUE, 55);

-- ============================================================
-- PLAYERS: RCB
-- ============================================================
INSERT INTO players (external_id, name, team, role, credit, overseas, sel_pct) VALUES
  ('rcb_kohli', 'Virat Kohli', 'RCB', 'BAT', 10.5, FALSE, 98),
  ('rcb_faf', 'Faf du Plessis', 'RCB', 'BAT', 9.5, TRUE, 82),
  ('rcb_maxwell', 'Glenn Maxwell', 'RCB', 'AR', 9.0, TRUE, 78),
  ('rcb_dk', 'Dinesh Karthik', 'RCB', 'WK', 8.5, FALSE, 70),
  ('rcb_hasaranga', 'Wanindu Hasaranga', 'RCB', 'BWL', 9.0, TRUE, 75),
  ('rcb_siraj', 'Mohammed Siraj', 'RCB', 'BWL', 8.5, FALSE, 72),
  ('rcb_patidar', 'Rajat Patidar', 'RCB', 'BAT', 8.0, FALSE, 60),
  ('rcb_harshal', 'Harshal Patel', 'RCB', 'BWL', 8.0, FALSE, 65),
  ('rcb_shahbaz', 'Shahbaz Ahmed', 'RCB', 'AR', 7.5, FALSE, 45),
  ('rcb_karn', 'Karn Sharma', 'RCB', 'BWL', 7.0, FALSE, 30),
  ('rcb_anuj', 'Anuj Rawat', 'RCB', 'WK', 7.0, FALSE, 35),
  ('rcb_lomror', 'Mahipal Lomror', 'RCB', 'AR', 7.0, FALSE, 32);

-- ============================================================
-- PLAYERS: KKR
-- ============================================================
INSERT INTO players (external_id, name, team, role, credit, overseas, sel_pct) VALUES
  ('kkr_shreyas', 'Shreyas Iyer', 'KKR', 'BAT', 9.5, FALSE, 85),
  ('kkr_narine', 'Sunil Narine', 'KKR', 'AR', 9.0, TRUE, 80),
  ('kkr_russell', 'Andre Russell', 'KKR', 'AR', 9.5, TRUE, 88),
  ('kkr_nitish', 'Nitish Rana', 'KKR', 'BAT', 8.0, FALSE, 62),
  ('kkr_rinku', 'Rinku Singh', 'KKR', 'BAT', 8.5, FALSE, 75),
  ('kkr_varun', 'Varun Chakravarthy', 'KKR', 'BWL', 8.0, FALSE, 72),
  ('kkr_umesh', 'Umesh Yadav', 'KKR', 'BWL', 7.5, FALSE, 50),
  ('kkr_venky', 'Venkatesh Iyer', 'KKR', 'AR', 8.0, FALSE, 55),
  ('kkr_rahmanullah', 'Rahmanullah Gurbaz', 'KKR', 'WK', 8.5, TRUE, 65),
  ('kkr_shardul', 'Shardul Thakur', 'KKR', 'BWL', 7.5, FALSE, 48),
  ('kkr_harshit', 'Harshit Rana', 'KKR', 'BWL', 7.0, FALSE, 40),
  ('kkr_starc', 'Mitchell Starc', 'KKR', 'BWL', 9.5, TRUE, 78);

-- ============================================================
-- SAMPLE MATCHES
-- ============================================================
INSERT INTO matches (external_id, team_a, team_b, team_a_name, team_b_name, venue, starts_at, status) VALUES
  ('ipl-2026-1', 'CSK', 'MI', 'Chennai Super Kings', 'Mumbai Indians', 'MA Chidambaram Stadium, Chennai', '2026-03-28T19:30:00+05:30', 'upcoming'),
  ('ipl-2026-2', 'RCB', 'KKR', 'Royal Challengers Bangalore', 'Kolkata Knight Riders', 'M Chinnaswamy Stadium, Bangalore', '2026-03-29T15:30:00+05:30', 'upcoming'),
  ('ipl-2026-3', 'MI', 'RCB', 'Mumbai Indians', 'Royal Challengers Bangalore', 'Wankhede Stadium, Mumbai', '2026-03-30T19:30:00+05:30', 'upcoming');
