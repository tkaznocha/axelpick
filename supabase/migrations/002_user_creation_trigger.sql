-- Trigger to auto-create a user record in public.users when a new auth user signs up.
-- Pulls display_name from auth metadata (set during signup or from OAuth profile).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'picture'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS for users table: anyone can read, users can update own row
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Read-only public access to events and skaters
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON events
  FOR SELECT USING (true);

ALTER TABLE skaters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view skaters" ON skaters
  FOR SELECT USING (true);

ALTER TABLE event_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view event entries" ON event_entries
  FOR SELECT USING (true);

ALTER TABLE results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view results" ON results
  FOR SELECT USING (true);
