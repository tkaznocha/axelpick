-- ISU profile data columns on skaters table
ALTER TABLE skaters
  ADD COLUMN IF NOT EXISTS isu_slug TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS height_cm INTEGER,
  ADD COLUMN IF NOT EXISTS hometown TEXT,
  ADD COLUMN IF NOT EXISTS started_skating INTEGER,
  ADD COLUMN IF NOT EXISTS coaches TEXT,
  ADD COLUMN IF NOT EXISTS choreographer TEXT,
  ADD COLUMN IF NOT EXISTS sp_music TEXT,
  ADD COLUMN IF NOT EXISTS fs_music TEXT,
  ADD COLUMN IF NOT EXISTS season_best_sp DECIMAL,
  ADD COLUMN IF NOT EXISTS season_best_fs DECIMAL,
  ADD COLUMN IF NOT EXISTS personal_best_sp DECIMAL,
  ADD COLUMN IF NOT EXISTS personal_best_fs DECIMAL,
  ADD COLUMN IF NOT EXISTS isu_bio_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_skaters_isu_slug ON skaters (isu_slug);
