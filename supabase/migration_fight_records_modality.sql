-- =============================================
-- MIGRATION: Ensure fight_records structure for modality-based records
-- =============================================

ALTER TABLE fight_records ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'amador';
ALTER TABLE fight_records ADD COLUMN IF NOT EXISTS no_contest INT DEFAULT 0;

UPDATE fight_records SET category = 'amador' WHERE category IS NULL;
UPDATE fight_records SET no_contest = 0 WHERE no_contest IS NULL;

ALTER TABLE fight_records DROP CONSTRAINT IF EXISTS fight_records_fighter_modality_category_unique;
ALTER TABLE fight_records ADD CONSTRAINT fight_records_fighter_modality_category_unique
  UNIQUE (fighter_id, modality, category);

CREATE INDEX IF NOT EXISTS idx_fight_records_fighter_modality ON fight_records(fighter_id, modality);
