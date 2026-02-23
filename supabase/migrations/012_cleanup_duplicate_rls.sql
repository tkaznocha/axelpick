-- Remove overly permissive RLS policies from migration 002.
-- The stricter policies from 007 (requiring authentication) remain active.

DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
