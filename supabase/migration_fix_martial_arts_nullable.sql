-- =============================================
-- FIX: Make started_at and level nullable in fighter_martial_arts
-- These fields are optional in the form
-- =============================================

ALTER TABLE fighter_martial_arts ALTER COLUMN started_at DROP NOT NULL;
ALTER TABLE fighter_martial_arts ALTER COLUMN level DROP NOT NULL;
