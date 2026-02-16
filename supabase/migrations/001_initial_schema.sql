-- Axel Pick — Initial Database Schema

-- Skaters
CREATE TABLE skaters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isu_id TEXT UNIQUE,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  discipline TEXT NOT NULL, -- 'men', 'women', 'pairs', 'ice_dance'
  photo_url TEXT,
  current_price INTEGER DEFAULT 5000000,
  world_ranking INTEGER,
  season_best_score DECIMAL,
  personal_best_score DECIMAL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isu_id TEXT UNIQUE,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'gp', 'championship', 'worlds'
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  picks_limit INTEGER NOT NULL,
  budget INTEGER NOT NULL,
  points_multiplier DECIMAL NOT NULL,
  picks_lock_at TIMESTAMPTZ,
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'locked', 'in_progress', 'completed'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Event entries (which skaters are in which events, with price at that event)
CREATE TABLE event_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  skater_id UUID REFERENCES skaters(id),
  price_at_event INTEGER NOT NULL,
  UNIQUE(event_id, skater_id)
);

-- Results
CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  skater_id UUID REFERENCES skaters(id),
  final_placement INTEGER,
  sp_placement INTEGER,
  total_score DECIMAL,
  sp_score DECIMAL,
  fs_score DECIMAL,
  falls INTEGER DEFAULT 0,
  is_personal_best BOOLEAN DEFAULT false,
  is_withdrawal BOOLEAN DEFAULT false,
  fantasy_points_raw INTEGER,
  fantasy_points_final INTEGER,
  UNIQUE(event_id, skater_id)
);

-- Users (linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  total_season_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User picks
CREATE TABLE user_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  skater_id UUID REFERENCES skaters(id),
  picked_at TIMESTAMPTZ DEFAULT now(),
  points_earned INTEGER,
  UNIQUE(user_id, event_id, skater_id)
);

-- Leagues
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- League members
CREATE TABLE league_members (
  league_id UUID REFERENCES leagues(id),
  user_id UUID REFERENCES users(id),
  PRIMARY KEY (league_id, user_id)
);

-- Price history
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skater_id UUID REFERENCES skaters(id),
  event_id UUID REFERENCES events(id),
  price_before INTEGER,
  price_after INTEGER,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_event_entries_event ON event_entries(event_id);
CREATE INDEX idx_results_event ON results(event_id);
CREATE INDEX idx_user_picks_user_event ON user_picks(user_id, event_id);
CREATE INDEX idx_league_members_user ON league_members(user_id);
CREATE INDEX idx_skaters_discipline ON skaters(discipline);
CREATE INDEX idx_events_status ON events(status);

-- Row Level Security
ALTER TABLE user_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own picks" ON user_picks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Picks only before lock" ON user_picks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_id
      AND (picks_lock_at IS NULL OR picks_lock_at > now())
    )
  );
