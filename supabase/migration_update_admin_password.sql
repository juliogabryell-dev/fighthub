-- ============================================================
-- Função RPC: update_admin_password
-- Atualiza a senha de um admin existente
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

CREATE OR REPLACE FUNCTION update_admin_password(p_admin_id UUID, p_new_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  UPDATE admin_users
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE id = p_admin_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin não encontrado';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION update_admin_password(UUID, TEXT) TO service_role;
