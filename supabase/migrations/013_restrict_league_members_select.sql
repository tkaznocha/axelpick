-- Tighten league_members SELECT policy: only allow members to see
-- other members within their own leagues (defense in depth).
DROP POLICY "Authenticated users can view league members" ON league_members;

CREATE POLICY "Users can view members of their own leagues" ON league_members
  FOR SELECT USING (
    league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid()
    )
  );
