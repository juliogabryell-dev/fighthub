-- Execute este script no SQL Editor do Supabase Dashboard

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
  birth_date DATE NOT NULL,
  cpf TEXT,
  rg TEXT,
  role TEXT NOT NULL CHECK (role IN ('fighter', 'coach', 'admin')),
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. Artes marciais do lutador
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
-- 4. Relacionamento lutador-treinador
-- ============================================================
CREATE TABLE fighter_coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fighter_id, coach_id)
);

-- ============================================================
-- 5. Vídeos do lutador
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
-- 6. Cartel de lutas
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
-- 7. Desafios entre lutadores
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
-- 8. Notícias
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
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fighter_martial_arts ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE fighter_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE fighter_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICAS: profiles
-- ============================================================

-- Leitura pública de perfis ativos
CREATE POLICY "Perfis ativos são visíveis publicamente"
  ON profiles FOR SELECT
  USING (status = 'active');

-- Usuário pode ver seu próprio perfil (independente do status)
CREATE POLICY "Usuário pode ver próprio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Usuário pode editar próprio perfil
CREATE POLICY "Usuário pode editar próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Usuário pode inserir próprio perfil
CREATE POLICY "Usuário pode inserir próprio perfil"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admin pode ver todos os perfis
CREATE POLICY "Admin pode ver todos os perfis"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin pode atualizar todos os perfis
CREATE POLICY "Admin pode atualizar todos os perfis"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin pode deletar perfis
CREATE POLICY "Admin pode deletar perfis"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- POLÍTICAS: fighter_martial_arts
-- ============================================================

-- Leitura pública
CREATE POLICY "Artes marciais são visíveis publicamente"
  ON fighter_martial_arts FOR SELECT
  USING (true);

-- Dono pode inserir
CREATE POLICY "Lutador pode adicionar suas artes marciais"
  ON fighter_martial_arts FOR INSERT
  WITH CHECK (auth.uid() = fighter_id);

-- Dono pode atualizar
CREATE POLICY "Lutador pode atualizar suas artes marciais"
  ON fighter_martial_arts FOR UPDATE
  USING (auth.uid() = fighter_id)
  WITH CHECK (auth.uid() = fighter_id);

-- Dono pode deletar
CREATE POLICY "Lutador pode deletar suas artes marciais"
  ON fighter_martial_arts FOR DELETE
  USING (auth.uid() = fighter_id);

-- ============================================================
-- POLÍTICAS: coach_experiences
-- ============================================================

-- Leitura pública
CREATE POLICY "Experiências do treinador são visíveis publicamente"
  ON coach_experiences FOR SELECT
  USING (true);

-- Dono pode inserir
CREATE POLICY "Treinador pode adicionar suas experiências"
  ON coach_experiences FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

-- Dono pode atualizar
CREATE POLICY "Treinador pode atualizar suas experiências"
  ON coach_experiences FOR UPDATE
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Dono pode deletar
CREATE POLICY "Treinador pode deletar suas experiências"
  ON coach_experiences FOR DELETE
  USING (auth.uid() = coach_id);

-- ============================================================
-- POLÍTICAS: fighter_coaches
-- ============================================================

-- Leitura pública
CREATE POLICY "Relacionamentos lutador-treinador são visíveis publicamente"
  ON fighter_coaches FOR SELECT
  USING (true);

-- Lutador ou treinador pode inserir
CREATE POLICY "Lutador ou treinador pode criar relacionamento"
  ON fighter_coaches FOR INSERT
  WITH CHECK (auth.uid() = fighter_id OR auth.uid() = coach_id);

-- Lutador ou treinador pode deletar
CREATE POLICY "Lutador ou treinador pode remover relacionamento"
  ON fighter_coaches FOR DELETE
  USING (auth.uid() = fighter_id OR auth.uid() = coach_id);

-- Treinador pode atualizar vinculo (aprovar/rejeitar)
CREATE POLICY "Treinador pode atualizar vinculo"
  ON fighter_coaches FOR UPDATE
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- ============================================================
-- POLÍTICAS: challenges
-- ============================================================

-- Leitura: quem enviou ou recebeu
CREATE POLICY "Ver proprios desafios"
  ON challenges FOR SELECT
  USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- Inserir: qualquer autenticado (como challenger)
CREATE POLICY "Criar desafio"
  ON challenges FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);

-- Update: quem recebeu (aceitar/recusar) ou quem enviou (cancelar)
CREATE POLICY "Responder desafio"
  ON challenges FOR UPDATE
  USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- ============================================================
-- POLÍTICAS: fighter_videos
-- ============================================================

-- Leitura pública
CREATE POLICY "Vídeos são visíveis publicamente"
  ON fighter_videos FOR SELECT
  USING (true);

-- Dono pode inserir
CREATE POLICY "Lutador pode adicionar seus vídeos"
  ON fighter_videos FOR INSERT
  WITH CHECK (auth.uid() = fighter_id);

-- Dono pode atualizar
CREATE POLICY "Lutador pode atualizar seus vídeos"
  ON fighter_videos FOR UPDATE
  USING (auth.uid() = fighter_id)
  WITH CHECK (auth.uid() = fighter_id);

-- Dono pode deletar
CREATE POLICY "Lutador pode deletar seus vídeos"
  ON fighter_videos FOR DELETE
  USING (auth.uid() = fighter_id);

-- ============================================================
-- POLÍTICAS: fight_records
-- ============================================================

-- Leitura pública
CREATE POLICY "Cartel é visível publicamente"
  ON fight_records FOR SELECT
  USING (true);

-- Dono pode inserir
CREATE POLICY "Lutador pode inserir seu cartel"
  ON fight_records FOR INSERT
  WITH CHECK (auth.uid() = fighter_id);

-- Dono pode atualizar (exceto campos de verificação)
CREATE POLICY "Lutador pode atualizar seu cartel"
  ON fight_records FOR UPDATE
  USING (auth.uid() = fighter_id)
  WITH CHECK (auth.uid() = fighter_id);

-- Admin pode atualizar qualquer cartel (para verificação)
CREATE POLICY "Admin pode verificar cartel"
  ON fight_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin pode deletar cartel
CREATE POLICY "Admin pode deletar cartel"
  ON fight_records FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- POLÍTICAS: news
-- ============================================================

-- Leitura pública
CREATE POLICY "Notícias são visíveis publicamente"
  ON news FOR SELECT
  USING (true);

-- Admin pode inserir notícias
CREATE POLICY "Admin pode criar notícias"
  ON news FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin pode atualizar notícias
CREATE POLICY "Admin pode atualizar notícias"
  ON news FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin pode deletar notícias
CREATE POLICY "Admin pode deletar notícias"
  ON news FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
