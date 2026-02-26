-- ============================================================
-- MIGRAÇÃO: Tabela admin_users (sistema independente de auth)
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================

-- Garante que pgcrypto está habilitada (para crypt/gen_salt)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Tabela admin_users
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: bloquear acesso público direto à tabela
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Nenhuma policy pública — acesso apenas via SECURITY DEFINER functions

-- ============================================================
-- Função RPC: verify_admin_login
-- Verifica email e senha, retorna dados do admin se válido
-- ============================================================
CREATE OR REPLACE FUNCTION verify_admin_login(p_email TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin admin_users%ROWTYPE;
BEGIN
  SELECT * INTO v_admin
  FROM admin_users
  WHERE email = LOWER(TRIM(p_email));

  IF v_admin.id IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_admin.password_hash = crypt(p_password, v_admin.password_hash) THEN
    RETURN json_build_object(
      'id', v_admin.id,
      'email', v_admin.email,
      'name', v_admin.name
    );
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- ============================================================
-- Função RPC: create_admin_user
-- Cria um novo admin (usar apenas via SQL Editor ou de forma controlada)
-- ============================================================
CREATE OR REPLACE FUNCTION create_admin_user(p_email TEXT, p_password TEXT, p_name TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin admin_users%ROWTYPE;
BEGIN
  INSERT INTO admin_users (email, password_hash, name)
  VALUES (
    LOWER(TRIM(p_email)),
    crypt(p_password, gen_salt('bf')),
    p_name
  )
  RETURNING * INTO v_admin;

  RETURN json_build_object(
    'id', v_admin.id,
    'email', v_admin.email,
    'name', v_admin.name
  );
END;
$$;

-- ============================================================
-- SEED: Criar o primeiro admin (descomente e execute uma vez)
-- ============================================================
-- SELECT create_admin_user('admin@fighthub.com', 'suaSenhaSegura123', 'Administrador');
