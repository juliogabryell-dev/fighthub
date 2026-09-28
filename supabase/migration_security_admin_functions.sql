-- =============================================
-- MIGRATION: Lock down SECURITY DEFINER functions
--
-- PostgreSQL grants EXECUTE to PUBLIC by default, so these functions were
-- callable by anyone with the public anon key (via /rest/v1/rpc/...):
--   create_admin_user      -> anyone could create an admin
--   update_admin_password  -> anyone could change an admin's password
--   verify_admin_login     -> unlimited password guessing
--   apply_fight_experience_to_record -> anyone could change any cartel
-- They are now callable only by the service role (server-side API routes).
-- =============================================

REVOKE EXECUTE ON FUNCTION create_admin_user(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION update_admin_password(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION verify_admin_login(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION apply_fight_experience_to_record(UUID, TEXT, TEXT, TEXT, INT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION create_admin_user(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_admin_password(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION verify_admin_login(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION apply_fight_experience_to_record(UUID, TEXT, TEXT, TEXT, INT) TO service_role;
