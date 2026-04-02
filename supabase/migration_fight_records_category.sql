-- =============================================
-- MIGRATION: Add category to fight_records (amador, semi_profissional, profissional)
-- =============================================

ALTER TABLE fight_records ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'amador';
ALTER TABLE fight_records ADD COLUMN IF NOT EXISTS no_contest INT DEFAULT 0;

-- Update existing records
UPDATE fight_records SET category = 'amador' WHERE category IS NULL;
UPDATE fight_records SET no_contest = 0 WHERE no_contest IS NULL;
