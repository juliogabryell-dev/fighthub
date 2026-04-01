-- =============================================
-- MIGRATION: Add height, weight, blood_type, whatsapp to profiles
-- =============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height_cm INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,1);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blood_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
