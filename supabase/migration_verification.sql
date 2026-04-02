-- =============================================
-- MIGRATION: Profile Verification System
-- =============================================

-- Verification fields on profiles
-- fighter_verified, coach_verified for dual-role users
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fighter_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_requested BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fighter_verification_requested BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_verification_requested BOOLEAN DEFAULT false;

-- Entity tables verification
ALTER TABLE referees ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE referees ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE referees ADD COLUMN IF NOT EXISTS verification_requested BOOLEAN DEFAULT false;

ALTER TABLE teams ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS verification_requested BOOLEAN DEFAULT false;

ALTER TABLE match_makers ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE match_makers ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE match_makers ADD COLUMN IF NOT EXISTS verification_requested BOOLEAN DEFAULT false;

ALTER TABLE federations ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE federations ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE federations ADD COLUMN IF NOT EXISTS verification_requested BOOLEAN DEFAULT false;
