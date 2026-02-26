-- ============================================================
-- MIGRAÇÃO: Coluna force_password_change em profiles
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN NOT NULL DEFAULT FALSE;
