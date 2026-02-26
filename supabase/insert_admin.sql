-- ============================================================
-- Inserir novos administradores
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- Exemplo: criar um novo admin
-- Troque os valores de email, senha e nome conforme necessário
SELECT create_admin_user('email@exemplo.com', 'senhaSegura123', 'Nome do Admin');

-- Mais exemplos:
-- SELECT create_admin_user('admin2@fighthub.com', 'outraSenha456', 'Segundo Admin');
-- SELECT create_admin_user('admin3@fighthub.com', 'maisUmaSenha789', 'Terceiro Admin');

-- ============================================================
-- Consultar admins existentes
-- ============================================================
-- SELECT id, email, name, created_at FROM admin_users;

-- ============================================================
-- Remover um admin
-- ============================================================
-- DELETE FROM admin_users WHERE email = 'email@exemplo.com';
