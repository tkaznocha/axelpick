-- Skaters page filters on is_active, orders by world_ranking
CREATE INDEX IF NOT EXISTS idx_skaters_active_ranking
  ON skaters(is_active, world_ranking);

-- Event entries looked up by skater_id (skater detail page)
CREATE INDEX IF NOT EXISTS idx_event_entries_skater
  ON event_entries(skater_id);

-- Results looked up by skater_id (skater detail page)
CREATE INDEX IF NOT EXISTS idx_results_skater
  ON results(skater_id);

-- Events frequently ordered by start_date
CREATE INDEX IF NOT EXISTS idx_events_start_date
  ON events(start_date);
