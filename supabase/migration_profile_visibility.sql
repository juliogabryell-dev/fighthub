-- =============================================
-- MIGRATION: Add public visibility settings to profiles
-- =============================================

-- JSON column storing which fields are publicly visible
-- Default: everything public except sensitive fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_fields JSONB DEFAULT '{
  "bio": true,
  "birth_date": true,
  "phone": false,
  "whatsapp": false,
  "city": true,
  "state": true,
  "height_cm": true,
  "weight_kg": true,
  "blood_type": true,
  "instagram": true,
  "facebook": true,
  "youtube": true,
  "tiktok": true
}'::jsonb;
