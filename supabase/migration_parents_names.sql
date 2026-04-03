-- =============================================
-- MIGRATION: Add father_name and mother_name to profiles
-- =============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mother_name TEXT;
