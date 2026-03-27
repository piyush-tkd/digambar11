-- ============================================================
-- Digambar11 Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Player',
  squad_name TEXT UNIQUE,
  avatar_url TEXT,
  wallet_balance NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Player'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. MATCHES
-- ============================================================
CREATE TYPE match_status AS ENUM ('upcoming', 'live', 'completed', 'abandoned');

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE, -- ID from cricket data API
  team_a TEXT NOT NULL,    -- e.g. 'CSK'
  team_b TEXT NOT NULL,    -- e.g. 'MI'
  team_a_name TEXT NOT NULL,
  team_b_name TEXT NOT NULL,
  venue TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  status match_status NOT NULL DEFAULT 'upcoming',
  innings SMALLINT DEFAULT 0,
  score_a TEXT DEFAULT '',  -- e.g. '182/4 (20.0)'
  score_b TEXT DEFAULT '',
  result TEXT,              -- e.g. 'CSK won by 5 wickets'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. PLAYERS (IPL rosters)
-- ============================================================
CREATE TYPE player_role AS ENUM ('WK', 'BAT', 'AR', 'BWL');

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE,
  name TEXT NOT NULL,
  team TEXT NOT NULL,       -- team code: CSK, MI, etc.
  role player_role NOT NULL,
  credit NUMERIC(4,1) NOT NULL DEFAULT 7.0,
  overseas BOOLEAN NOT NULL DEFAULT FALSE,
  photo_url TEXT,
  season_pts NUMERIC(8,1) NOT NULL DEFAULT 0,
  sel_pct NUMERIC(5,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by team
CREATE INDEX idx_players_team ON players(team);

-- ============================================================
-- 4. MATCH_PLAYERS (playing XI for a match)
-- ============================================================
CREATE TABLE match_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  playing BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(match_id, player_id)
);

CREATE INDEX idx_match_players_match ON match_players(match_id);

-- ============================================================
-- 5. USER_TEAMS
-- ============================================================
CREATE TABLE user_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  captain_id UUID NOT NULL REFERENCES players(id),
  vice_captain_id UUID NOT NULL REFERENCES players(id),
  total_credits NUMERIC(5,1) NOT NULL,
  total_points NUMERIC(8,1) NOT NULL DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT captain_not_vc CHECK (captain_id != vice_captain_id),
  UNIQUE(user_id, match_id)  -- one team per user per match
);

CREATE INDEX idx_user_teams_match ON user_teams(match_id);
CREATE INDEX idx_user_teams_user ON user_teams(user_id);

-- ============================================================
-- 6. USER_TEAM_PLAYERS (junction table)
-- ============================================================
CREATE TABLE user_team_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_team_id UUID NOT NULL REFERENCES user_teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE(user_team_id, player_id)
);

CREATE INDEX idx_utp_team ON user_team_players(user_team_id);

-- ============================================================
-- 7. CONTESTS (friend leagues)
-- ============================================================
CREATE TYPE contest_status AS ENUM ('open', 'locked', 'live', 'completed');

CREATE TABLE contests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Friends League',
  created_by UUID NOT NULL REFERENCES profiles(id),
  entry_fee NUMERIC(8,2) NOT NULL DEFAULT 25.00,
  max_entries INTEGER NOT NULL DEFAULT 10,
  prize_pool NUMERIC(10,2) NOT NULL DEFAULT 0,
  status contest_status NOT NULL DEFAULT 'open',
  invite_code TEXT UNIQUE DEFAULT SUBSTR(MD5(RANDOM()::TEXT), 1, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contests_match ON contests(match_id);

-- ============================================================
-- 8. CONTEST_ENTRIES
-- ============================================================
CREATE TABLE contest_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_team_id UUID NOT NULL REFERENCES user_teams(id) ON DELETE CASCADE,
  rank INTEGER,
  winnings NUMERIC(8,2) NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contest_id, user_id)  -- one entry per user per contest
);

CREATE INDEX idx_entries_contest ON contest_entries(contest_id);

-- ============================================================
-- 9. LIVE_SCORES (real-time player fantasy points)
-- ============================================================
CREATE TABLE live_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  -- Batting
  runs INTEGER NOT NULL DEFAULT 0,
  balls_faced INTEGER NOT NULL DEFAULT 0,
  fours INTEGER NOT NULL DEFAULT 0,
  sixes INTEGER NOT NULL DEFAULT 0,
  strike_rate NUMERIC(6,2) NOT NULL DEFAULT 0,
  -- Bowling
  overs_bowled NUMERIC(4,1) NOT NULL DEFAULT 0,
  maidens INTEGER NOT NULL DEFAULT 0,
  runs_conceded INTEGER NOT NULL DEFAULT 0,
  wickets INTEGER NOT NULL DEFAULT 0,
  economy NUMERIC(5,2) NOT NULL DEFAULT 0,
  -- Fielding
  catches INTEGER NOT NULL DEFAULT 0,
  run_outs INTEGER NOT NULL DEFAULT 0,
  stumpings INTEGER NOT NULL DEFAULT 0,
  -- Calculated
  fantasy_pts NUMERIC(8,1) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting', -- batting, bowling, out, waiting
  -- Meta
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

CREATE INDEX idx_live_scores_match ON live_scores(match_id);

-- ============================================================
-- 10. TRANSACTIONS (wallet)
-- ============================================================
CREATE TYPE txn_type AS ENUM ('deposit', 'withdrawal', 'entry_fee', 'winnings', 'refund', 'bonus');

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type txn_type NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  contest_id UUID REFERENCES contests(id),
  balance_after NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_txn_user ON transactions(user_id);
CREATE INDEX idx_txn_created ON transactions(created_at DESC);

-- ============================================================
-- 11. PROVIDER CONFIG (for dual-API strategy)
-- ============================================================
CREATE TABLE provider_config (
  id TEXT PRIMARY KEY, -- 'cricketdata' or 'sportmonks'
  api_key TEXT NOT NULL,
  base_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  rate_limit_per_day INTEGER,
  calls_today INTEGER NOT NULL DEFAULT 0,
  last_reset_at DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Pre-populate provider config
INSERT INTO provider_config (id, api_key, base_url, is_primary, rate_limit_per_day) VALUES
  ('cricketdata', 'YOUR_CRICKETDATA_API_KEY', 'https://api.cricapi.com/v1', TRUE, 100),
  ('sportmonks', 'YOUR_SPORTMONKS_API_KEY', 'https://cricket.sportmonks.com/api/v2.0', FALSE, 500);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_config ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Matches: everyone can read
CREATE POLICY "Matches are viewable by everyone" ON matches FOR SELECT USING (TRUE);

-- Players: everyone can read
CREATE POLICY "Players are viewable by everyone" ON players FOR SELECT USING (TRUE);

-- Match Players: everyone can read
CREATE POLICY "Match players are viewable by everyone" ON match_players FOR SELECT USING (TRUE);

-- User Teams: own teams read/write, others' teams read-only
CREATE POLICY "Users can view all teams in their matches" ON user_teams FOR SELECT USING (TRUE);
CREATE POLICY "Users can create own teams" ON user_teams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own teams" ON user_teams FOR UPDATE USING (auth.uid() = user_id);

-- User Team Players: follows parent team access
CREATE POLICY "Team players are viewable" ON user_team_players FOR SELECT USING (TRUE);
CREATE POLICY "Users can add players to own teams" ON user_team_players FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_teams WHERE id = user_team_id AND user_id = auth.uid()));

-- Contests: everyone can read, creator can manage
CREATE POLICY "Contests are viewable by everyone" ON contests FOR SELECT USING (TRUE);
CREATE POLICY "Users can create contests" ON contests FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Contest Entries: viewable by contest participants
CREATE POLICY "Entries are viewable" ON contest_entries FOR SELECT USING (TRUE);
CREATE POLICY "Users can join contests" ON contest_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Live Scores: everyone can read (written by Edge Functions via service role)
CREATE POLICY "Live scores are viewable by everyone" ON live_scores FOR SELECT USING (TRUE);

-- Transactions: users can only see own
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);

-- Provider Config: no public access (Edge Functions use service role key)
-- No SELECT policy = blocked for anon/authenticated users

-- ============================================================
-- FUNCTIONS: Leaderboard calculation
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_user_team_points(p_match_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update total_points for each user_team based on live_scores
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

-- ============================================================
-- FUNCTIONS: Prize distribution
-- ============================================================
CREATE OR REPLACE FUNCTION distribute_prizes(p_contest_id UUID)
RETURNS VOID AS $$
DECLARE
  v_pool NUMERIC(10,2);
  v_entry RECORD;
  v_prize NUMERIC(10,2);
  v_pct NUMERIC(5,2);
  v_count INTEGER;
BEGIN
  SELECT prize_pool, (SELECT COUNT(*) FROM contest_entries WHERE contest_id = p_contest_id)
  INTO v_pool, v_count
  FROM contests WHERE id = p_contest_id;

  IF v_count = 0 OR v_pool = 0 THEN RETURN; END IF;

  -- Pro-rata distribution: top min(5, count) get prizes
  -- 30% / 25% / 20% / 15% / 10%
  FOR v_entry IN
    SELECT ce.id, ce.user_id, ce.rank
    FROM contest_entries ce
    WHERE ce.contest_id = p_contest_id
    ORDER BY ce.rank ASC
    LIMIT LEAST(5, v_count)
  LOOP
    v_pct := CASE v_entry.rank
      WHEN 1 THEN 0.30
      WHEN 2 THEN 0.25
      WHEN 3 THEN 0.20
      WHEN 4 THEN 0.15
      WHEN 5 THEN 0.10
      ELSE 0
    END;
    v_prize := ROUND(v_pool * v_pct, 2);

    -- Update winnings
    UPDATE contest_entries SET winnings = v_prize WHERE id = v_entry.id;

    -- Credit wallet
    UPDATE profiles SET wallet_balance = wallet_balance + v_prize WHERE id = v_entry.user_id;

    -- Record transaction
    INSERT INTO transactions (user_id, type, amount, description, contest_id, balance_after)
    VALUES (
      v_entry.user_id, 'winnings', v_prize,
      'Prize for rank #' || v_entry.rank,
      p_contest_id,
      (SELECT wallet_balance FROM profiles WHERE id = v_entry.user_id)
    );
  END LOOP;

  -- Mark contest complete
  UPDATE contests SET status = 'completed' WHERE id = p_contest_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- REALTIME: Enable realtime on key tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE live_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE user_teams;
ALTER PUBLICATION supabase_realtime ADD TABLE contest_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
