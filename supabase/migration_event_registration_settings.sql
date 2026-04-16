-- =============================================
-- MIGRATION: Event Registration Settings
-- Adds registration_open flag and registration_terms to events
-- =============================================

-- Whether the event accepts registrations on the portal
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_open BOOLEAN DEFAULT true;

-- Terms and conditions text for event registration (optional)
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_terms TEXT;
