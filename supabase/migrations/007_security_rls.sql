-- Security RLS: Restrict users and price_history tables

-- ========== users ==========
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read users (needed for leaderboards)
CREATE POLICY "Authenticated users can read all users" ON users
  FOR SELECT TO authenticated
  USING (true);

-- Users can only update their own row
CREATE POLICY "Users can update own row" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users row is created via trigger (service role), so no INSERT policy needed
-- for regular users. Block direct INSERT from authenticated users.
CREATE POLICY "Users cannot directly insert" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- No DELETE policy — users cannot delete their own account via direct table access

-- ========== price_history ==========
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Read-only for authenticated users
CREATE POLICY "Authenticated users can read price history" ON price_history
  FOR SELECT TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies — only service role (admin) can write
