-- =============================================
-- MIGRATION: Binding requests (request -> accept/reject by the other side)
--
-- Every binding is created as 'pending' with requested_by = the user who asked.
-- Only the OTHER side can accept (status 'active') or reject ('rejected').
-- All writes go through /api/bindings (service role), so client-side
-- insert/update policies are removed to prevent self-approval.
-- =============================================

-- ---------------------------------------------
-- 1. requested_by on existing binding tables
-- ---------------------------------------------
ALTER TABLE fighter_coaches   ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE fighter_academies ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE team_fighters     ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Legacy rows: fighters requested coaches/academies; teams added fighters
UPDATE fighter_coaches   SET requested_by = fighter_id WHERE requested_by IS NULL;
UPDATE fighter_academies SET requested_by = fighter_id WHERE requested_by IS NULL;
UPDATE team_fighters tf  SET requested_by = t.owner_id FROM teams t WHERE t.id = tf.team_id AND tf.requested_by IS NULL;

-- ---------------------------------------------
-- 2. New binding tables
-- ---------------------------------------------

-- Coach <-> Academy (academy is a profile with role 'academy')
CREATE TABLE IF NOT EXISTS coach_academies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coach_id, academy_id)
);

-- Coach <-> Federation
CREATE TABLE IF NOT EXISTS coach_federations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  federation_id UUID NOT NULL REFERENCES federations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coach_id, federation_id)
);

-- Team <-> Coach
CREATE TABLE IF NOT EXISTS team_coaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, coach_id)
);

-- Coach <-> Match Maker
CREATE TABLE IF NOT EXISTS coach_match_makers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_maker_id UUID NOT NULL REFERENCES match_makers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coach_id, match_maker_id)
);

ALTER TABLE coach_academies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_federations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_coaches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_match_makers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view coach_academies" ON coach_academies;
CREATE POLICY "Public can view coach_academies" ON coach_academies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can view coach_federations" ON coach_federations;
CREATE POLICY "Public can view coach_federations" ON coach_federations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can view team_coaches" ON team_coaches;
CREATE POLICY "Public can view team_coaches" ON team_coaches FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can view coach_match_makers" ON coach_match_makers;
CREATE POLICY "Public can view coach_match_makers" ON coach_match_makers FOR SELECT USING (true);

-- ---------------------------------------------
-- 3. Remove client write policies (writes only via /api/bindings)
-- ---------------------------------------------
DROP POLICY IF EXISTS "Lutador ou treinador pode criar relacionamento" ON fighter_coaches;
DROP POLICY IF EXISTS "Treinador pode atualizar vinculo" ON fighter_coaches;
DROP POLICY IF EXISTS "Lutador ou treinador pode remover relacionamento" ON fighter_coaches;
DROP POLICY IF EXISTS "Lutador ou academia pode criar vinculo" ON fighter_academies;
DROP POLICY IF EXISTS "Academia pode atualizar vinculo" ON fighter_academies;
DROP POLICY IF EXISTS "Lutador ou academia pode remover vinculo" ON fighter_academies;
