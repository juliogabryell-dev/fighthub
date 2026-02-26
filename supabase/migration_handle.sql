-- Migration: Adicionar campo handle (identificador único @username) aos perfis
-- Execute este script no SQL Editor do Supabase Dashboard

ALTER TABLE profiles ADD COLUMN handle TEXT;
ALTER TABLE profiles ADD CONSTRAINT profiles_handle_unique UNIQUE (handle);
ALTER TABLE profiles ADD CONSTRAINT profiles_handle_format CHECK (handle ~ '^[a-z0-9_]{3,30}$');
CREATE INDEX idx_profiles_handle ON profiles (handle) WHERE handle IS NOT NULL;
