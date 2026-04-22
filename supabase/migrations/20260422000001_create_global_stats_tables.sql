-- Migration: create global stats tables for ChatsKitchen
-- Created: 2026-04-22

-- ============================================================
-- TABLE: seasons
-- Tracks each competitive season and its money goal progress.
-- ============================================================
CREATE TABLE seasons (
  id                  serial PRIMARY KEY,
  number              int NOT NULL,
  status              text NOT NULL DEFAULT 'active',  -- 'active' | 'ended'
  money_goal          int NOT NULL DEFAULT 500000,
  total_money_earned  int NOT NULL DEFAULT 0,
  started_at          timestamptz NOT NULL DEFAULT now(),
  ended_at            timestamptz
);

-- ============================================================
-- TABLE: sessions
-- One row per completed game session submitted by a channel.
-- ============================================================
CREATE TABLE sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id     int NOT NULL REFERENCES seasons(id),
  channel_name  text NOT NULL,
  money_earned  int NOT NULL,
  served        int NOT NULL,
  lost          int NOT NULL,
  played_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: player_contributions
-- Per-player stats for a single session.
-- ============================================================
CREATE TABLE player_contributions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  season_id        int NOT NULL REFERENCES seasons(id),
  twitch_username  text NOT NULL,
  channel_name     text NOT NULL,
  cooked           int NOT NULL DEFAULT 0,
  served           int NOT NULL DEFAULT 0,
  money_earned     int NOT NULL DEFAULT 0,
  extinguished     int NOT NULL DEFAULT 0,
  fires_caused     int NOT NULL DEFAULT 0
);

-- ============================================================
-- TABLE: rate_limits
-- One row per channel; tracks last submission time.
-- Only accessible via the service-role Edge Function (no anon access).
-- ============================================================
CREATE TABLE rate_limits (
  channel_name     text PRIMARY KEY,
  last_submission  timestamptz NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Leaderboard aggregation: sessions by season and channel
CREATE INDEX idx_sessions_season_channel
  ON sessions (season_id, channel_name);

-- Player profile queries: contributions by season and player
CREATE INDEX idx_player_contributions_season_username
  ON player_contributions (season_id, twitch_username);

-- Session join: contributions by session
CREATE INDEX idx_player_contributions_session
  ON player_contributions (session_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE seasons             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits         ENABLE ROW LEVEL SECURITY;

-- seasons: anon may read only
CREATE POLICY "seasons_anon_select"
  ON seasons
  FOR SELECT
  TO anon
  USING (true);

-- sessions: anon may read only
CREATE POLICY "sessions_anon_select"
  ON sessions
  FOR SELECT
  TO anon
  USING (true);

-- player_contributions: anon may read only
CREATE POLICY "player_contributions_anon_select"
  ON player_contributions
  FOR SELECT
  TO anon
  USING (true);

-- rate_limits: no anon access at all (service-role only via Edge Function)
-- No policies created for rate_limits; all anon operations are denied by default.
