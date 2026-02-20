-- League RLS Policies

-- Enable RLS on both tables
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all leagues (needed for join flow + leaderboards)
CREATE POLICY "Authenticated users can view leagues" ON leagues
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can create leagues (they become the creator)
CREATE POLICY "Users can create leagues" ON leagues
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Authenticated users can read all league memberships
CREATE POLICY "Authenticated users can view league members" ON league_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can join leagues (insert themselves)
CREATE POLICY "Users can join leagues" ON league_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can leave leagues (delete themselves)
CREATE POLICY "Users can leave leagues" ON league_members
  FOR DELETE USING (auth.uid() = user_id);
