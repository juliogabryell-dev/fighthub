-- Migration: Vincular Treinadores e Academias por Modalidade
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Adicionar martial_art_id ao fighter_coaches (nullable primeiro para dados existentes)
ALTER TABLE fighter_coaches ADD COLUMN martial_art_id UUID REFERENCES fighter_martial_arts(id) ON DELETE CASCADE;

-- 2. Remover constraint UNIQUE antiga e criar nova
ALTER TABLE fighter_coaches DROP CONSTRAINT fighter_coaches_fighter_id_coach_id_key;
ALTER TABLE fighter_coaches ADD CONSTRAINT fighter_coaches_fighter_coach_art_key UNIQUE(fighter_id, coach_id, martial_art_id);

-- 3. Deletar vínculos antigos sem martial_art_id (dados legados)
DELETE FROM fighter_coaches WHERE martial_art_id IS NULL;

-- 4. Tornar NOT NULL
ALTER TABLE fighter_coaches ALTER COLUMN martial_art_id SET NOT NULL;

-- 5. Criar tabela fighter_academies
CREATE TABLE fighter_academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  martial_art_id UUID NOT NULL REFERENCES fighter_martial_arts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fighter_id, academy_id, martial_art_id)
);

-- 6. RLS para fighter_academies
ALTER TABLE fighter_academies ENABLE ROW LEVEL SECURITY;

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
  USING (auth.uid() = academy_id)
  WITH CHECK (auth.uid() = academy_id);
