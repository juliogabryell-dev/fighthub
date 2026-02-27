-- ============================================================
-- FIGHTLOG - SCHEMA COMPLETO DO BANCO DE DADOS
-- ============================================================
-- Este arquivo contém TUDO necessário para recriar o banco
-- do zero em qualquer instância PostgreSQL/Supabase.
--
-- Inclui: extensões, tabelas, triggers, RLS, funções RPC,
-- permissões (GRANT), e índices.
--
-- Última atualização: 2026-02-27
-- ============================================================

-- ============================================================
-- EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- FUNÇÃO DE TRIGGER: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. Perfis de usuário (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  handle TEXT CONSTRAINT profiles_handle_unique UNIQUE CONSTRAINT profiles_handle_format CHECK (handle ~ '^[a-z0-9_]{3,30}$'),
  birth_date DATE,
  cpf TEXT,
  rg TEXT,
  cpf_cnpj TEXT,
  role TEXT NOT NULL CHECK (role IN ('fighter', 'coach', 'admin', 'academy')),
  is_fighter BOOLEAN NOT NULL DEFAULT FALSE,
  is_coach BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url TEXT,
  phone TEXT,
  city TEXT,
  state TEXT,
  bio TEXT,
  instagram TEXT,
  facebook TEXT,
  youtube TEXT,
  tiktok TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
  force_password_change BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_handle ON profiles (handle) WHERE handle IS NOT NULL;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. Modalidades do lutador
-- ============================================================
CREATE TABLE fighter_martial_arts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  art_name TEXT NOT NULL,
  level TEXT NOT NULL,
  started_at DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. Experiências do treinador
-- ============================================================
CREATE TABLE coach_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  organization TEXT,
  period_start TEXT NOT NULL,
  period_end TEXT DEFAULT 'Presente',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. Relacionamento lutador-treinador (por modalidade)
-- ============================================================
CREATE TABLE fighter_coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  martial_art_id UUID NOT NULL REFERENCES fighter_martial_arts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fighter_id, coach_id, martial_art_id)
);

-- ============================================================
-- 5. Relacionamento lutador-academia (por modalidade)
-- ============================================================
CREATE TABLE fighter_academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  martial_art_id UUID NOT NULL REFERENCES fighter_martial_arts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fighter_id, academy_id, martial_art_id)
);

-- ============================================================
-- 6. Vídeos do lutador
-- ============================================================
CREATE TABLE fighter_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  youtube_url TEXT NOT NULL,
  title TEXT,
  modality TEXT,
  fight_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. Cartel de lutas
-- ============================================================
CREATE TABLE fight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  modality TEXT NOT NULL,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  draws INT DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_fight_records_updated_at
  BEFORE UPDATE ON fight_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. Desafios entre lutadores
-- ============================================================
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenged_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  modality TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'result_pending', 'completed')),
  winner_id UUID REFERENCES profiles(id),
  result_reported_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_challenges_updated_at
  BEFORE UPDATE ON challenges FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. Notícias
-- ============================================================
CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT,
  category TEXT,
  image_url TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. Administradores (sistema independente do Supabase Auth)
-- ============================================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fighter_martial_arts ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE fighter_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE fighter_academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE fighter_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICAS: profiles
-- ============================================================

CREATE POLICY "Perfis ativos são visíveis publicamente"
  ON profiles FOR SELECT
  USING (status = 'active');

CREATE POLICY "Usuário pode ver próprio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuário pode editar próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuário pode inserir próprio perfil"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin pode ver todos os perfis"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin pode atualizar todos os perfis"
  ON profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin pode deletar perfis"
  ON profiles FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- POLÍTICAS: fighter_martial_arts
-- ============================================================

CREATE POLICY "Modalidades são visíveis publicamente"
  ON fighter_martial_arts FOR SELECT USING (true);

CREATE POLICY "Lutador pode adicionar suas modalidades"
  ON fighter_martial_arts FOR INSERT
  WITH CHECK (auth.uid() = fighter_id);

CREATE POLICY "Lutador pode atualizar suas modalidades"
  ON fighter_martial_arts FOR UPDATE
  USING (auth.uid() = fighter_id) WITH CHECK (auth.uid() = fighter_id);

CREATE POLICY "Lutador pode deletar suas modalidades"
  ON fighter_martial_arts FOR DELETE
  USING (auth.uid() = fighter_id);

-- ============================================================
-- POLÍTICAS: coach_experiences
-- ============================================================

CREATE POLICY "Experiências do treinador são visíveis publicamente"
  ON coach_experiences FOR SELECT USING (true);

CREATE POLICY "Treinador pode adicionar suas experiências"
  ON coach_experiences FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Treinador pode atualizar suas experiências"
  ON coach_experiences FOR UPDATE
  USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Treinador pode deletar suas experiências"
  ON coach_experiences FOR DELETE
  USING (auth.uid() = coach_id);

-- ============================================================
-- POLÍTICAS: fighter_coaches
-- ============================================================

CREATE POLICY "Relacionamentos lutador-treinador são visíveis publicamente"
  ON fighter_coaches FOR SELECT USING (true);

CREATE POLICY "Lutador ou treinador pode criar relacionamento"
  ON fighter_coaches FOR INSERT
  WITH CHECK (auth.uid() = fighter_id OR auth.uid() = coach_id);

CREATE POLICY "Lutador ou treinador pode remover relacionamento"
  ON fighter_coaches FOR DELETE
  USING (auth.uid() = fighter_id OR auth.uid() = coach_id);

CREATE POLICY "Treinador pode atualizar vinculo"
  ON fighter_coaches FOR UPDATE
  USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

-- ============================================================
-- POLÍTICAS: fighter_academies
-- ============================================================

CREATE POLICY "Vinculos academias visiveis publicamente"
  ON fighter_academies FOR SELECT USING (true);

CREATE POLICY "Lutador ou academia pode criar vinculo"
  ON fighter_academies FOR INSERT
  WITH CHECK (auth.uid() = fighter_id OR auth.uid() = academy_id);

CREATE POLICY "Lutador ou academia pode remover vinculo"
  ON fighter_academies FOR DELETE
  USING (auth.uid() = fighter_id OR auth.uid() = academy_id);

CREATE POLICY "Academia pode atualizar vinculo"
  ON fighter_academies FOR UPDATE
  USING (auth.uid() = academy_id) WITH CHECK (auth.uid() = academy_id);

-- ============================================================
-- POLÍTICAS: fighter_videos
-- ============================================================

CREATE POLICY "Vídeos são visíveis publicamente"
  ON fighter_videos FOR SELECT USING (true);

CREATE POLICY "Lutador pode adicionar seus vídeos"
  ON fighter_videos FOR INSERT
  WITH CHECK (auth.uid() = fighter_id);

CREATE POLICY "Lutador pode atualizar seus vídeos"
  ON fighter_videos FOR UPDATE
  USING (auth.uid() = fighter_id) WITH CHECK (auth.uid() = fighter_id);

CREATE POLICY "Lutador pode deletar seus vídeos"
  ON fighter_videos FOR DELETE
  USING (auth.uid() = fighter_id);

-- ============================================================
-- POLÍTICAS: fight_records
-- ============================================================

CREATE POLICY "Cartel é visível publicamente"
  ON fight_records FOR SELECT USING (true);

CREATE POLICY "Lutador pode inserir seu cartel"
  ON fight_records FOR INSERT
  WITH CHECK (auth.uid() = fighter_id);

CREATE POLICY "Lutador pode atualizar seu cartel"
  ON fight_records FOR UPDATE
  USING (auth.uid() = fighter_id) WITH CHECK (auth.uid() = fighter_id);

CREATE POLICY "Admin pode verificar cartel"
  ON fight_records FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin pode deletar cartel"
  ON fight_records FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- POLÍTICAS: challenges
-- ============================================================

CREATE POLICY "Ver proprios desafios"
  ON challenges FOR SELECT
  USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE POLICY "Criar desafio"
  ON challenges FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Responder desafio"
  ON challenges FOR UPDATE
  USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- ============================================================
-- POLÍTICAS: news
-- ============================================================

CREATE POLICY "Notícias são visíveis publicamente"
  ON news FOR SELECT USING (true);

CREATE POLICY "Admin pode criar notícias"
  ON news FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin pode atualizar notícias"
  ON news FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin pode deletar notícias"
  ON news FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- FUNÇÕES RPC: Sistema de administradores
-- ============================================================

-- Verificar login de admin (email + senha com bcrypt)
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

-- Criar novo admin (com hash bcrypt da senha)
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

-- Atualizar senha de admin existente
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

-- ============================================================
-- PERMISSÕES (GRANT)
-- ============================================================

-- Funções de admin acessíveis via anon (login) e service_role (API)
GRANT EXECUTE ON FUNCTION verify_admin_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_admin_login(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION create_admin_user(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION create_admin_user(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_admin_password(UUID, TEXT) TO service_role;

-- ============================================================
-- SEED: Criar primeiro admin (descomentar e executar uma vez)
-- ============================================================
-- SELECT create_admin_user('admin@fighthub.com', 'suaSenhaSegura123', 'Administrador');

-- ============================================================
-- VARIÁVEIS DE AMBIENTE NECESSÁRIAS (Vercel/Next.js)
-- ============================================================
-- NEXT_PUBLIC_SUPABASE_URL       = URL do projeto Supabase
-- NEXT_PUBLIC_SUPABASE_ANON_KEY  = Chave anônima (pública)
-- SUPABASE_SERVICE_ROLE_KEY      = Chave service_role (privada, só no servidor)
-- ADMIN_SESSION_SECRET           = Chave HMAC para cookies admin (gerar: openssl rand -hex 32)
--
-- CONFIGURAÇÕES DO SUPABASE DASHBOARD:
-- Authentication > URL Configuration > Site URL: https://seu-dominio.com
-- Authentication > URL Configuration > Redirect URLs: https://seu-dominio.com/auth/callback
-- Authentication > Email Templates > Reset Password:
--   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password
-- Authentication > Settings > Confirm email: DESABILITADO (para cadastro imediato)
