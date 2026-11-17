-- =============================================
-- MIGRATION: users can't change their own account status
--
-- The "Usuário pode editar próprio perfil" policy lets a user update any column
-- of their own row, including status. Without this, a deactivated (inactive),
-- pending or rejected account could set itself back to 'active' through the API.
-- Status changes now only come from the admin (fulladmin API / service role).
-- =============================================

CREATE OR REPLACE FUNCTION profiles_lock_own_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND auth.uid() IS NOT NULL AND auth.uid() = OLD.id THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_lock_own_status ON profiles;
CREATE TRIGGER profiles_lock_own_status
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION profiles_lock_own_status();
