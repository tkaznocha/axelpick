-- Withdrawal handling and notification system

-- 1. Add withdrawal tracking to event_entries
ALTER TABLE event_entries
  ADD COLUMN is_withdrawn BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN withdrawn_at TIMESTAMPTZ;

-- 2. Add replacement deadline to events
ALTER TABLE events
  ADD COLUMN replacement_deadline TIMESTAMPTZ;

-- 3. Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  event_id UUID REFERENCES events(id),
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, is_read)
  WHERE is_read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Pick replacements tracking table
CREATE TABLE pick_replacements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  event_id UUID NOT NULL REFERENCES events(id),
  withdrawn_skater_id UUID NOT NULL REFERENCES skaters(id),
  replacement_skater_id UUID REFERENCES skaters(id),
  replaced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id, withdrawn_skater_id)
);

ALTER TABLE pick_replacements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own replacements" ON pick_replacements
  FOR SELECT USING (auth.uid() = user_id);
