-- AI-generated event facts
CREATE TABLE event_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  fact_text TEXT NOT NULL,
  category TEXT,  -- 'surprise','popular','underdog','value','scoring','drama','strategy'
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ
);

CREATE INDEX idx_event_facts_event ON event_facts(event_id);

ALTER TABLE event_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published facts" ON event_facts
  FOR SELECT USING (is_published = true);
