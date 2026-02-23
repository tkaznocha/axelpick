-- Fix self-referencing RLS policy on league_members.
-- The policy from 013 contained a subquery on the same table, creating a
-- circular dependency that made all rows invisible via SELECT.
-- Use a SECURITY DEFINER function to break the cycle.

CREATE OR REPLACE FUNCTION public.get_my_league_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT league_id FROM league_members WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "Users can view members of their own leagues" ON league_members;

CREATE POLICY "Users can view members of their own leagues" ON league_members
  FOR SELECT USING (
    league_id IN (SELECT get_my_league_ids())
  );
