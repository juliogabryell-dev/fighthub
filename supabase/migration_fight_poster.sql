-- =============================================
-- MIGRATION: Optional event poster on fight experiences
-- =============================================

ALTER TABLE fight_experiences ADD COLUMN IF NOT EXISTS event_poster_url TEXT;
