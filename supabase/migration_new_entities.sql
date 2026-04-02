-- =============================================
-- MIGRATION: New Entity Types
-- Referees, Teams, Match Makers, Federations
-- =============================================

-- 1. Expand profiles role constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('fighter', 'coach', 'admin', 'academy', 'referee', 'team', 'match_maker', 'federation'));

-- =============================================
-- 2. FEDERATIONS (Federações)
-- =============================================
CREATE TABLE IF NOT EXISTS federations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  official_name TEXT NOT NULL,
  abbreviation TEXT,
  cnpj TEXT,
  founding_date DATE,
  country TEXT DEFAULT 'Brasil',
  state TEXT,
  city TEXT,
  president TEXT,
  directors JSONB DEFAULT '[]'::jsonb,
  regulated_modalities JSONB DEFAULT '[]'::jsonb,
  rules TEXT,
  ranking_system TEXT,
  email TEXT,
  whatsapp TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  tiktok TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_federations_owner ON federations(owner_id);
CREATE INDEX IF NOT EXISTS idx_federations_status ON federations(status);

ALTER TABLE federations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active federations" ON federations FOR SELECT USING (status = 'active');
CREATE POLICY "Owner can update own federation" ON federations FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Authenticated can insert federation" ON federations FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE TRIGGER set_federations_updated_at BEFORE UPDATE ON federations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 3. TEAMS (Equipes)
-- =============================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  trade_name TEXT,
  logo_url TEXT,
  founding_date DATE,
  country TEXT DEFAULT 'Brasil',
  state TEXT,
  city TEXT,
  address TEXT,
  head_coach_name TEXT,
  head_coach_document TEXT,
  head_coach_contact TEXT,
  modalities JSONB DEFAULT '[]'::jsonb,
  predominant_level TEXT,
  instagram TEXT,
  tiktok TEXT,
  facebook TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active teams" ON teams FOR SELECT USING (status = 'active');
CREATE POLICY "Owner can update own team" ON teams FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Authenticated can insert team" ON teams FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE TRIGGER set_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 4. REFEREES (Árbitros)
-- =============================================
CREATE TABLE IF NOT EXISTS referees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  license_number TEXT,
  federation_id UUID REFERENCES federations(id) ON DELETE SET NULL,
  level TEXT CHECK (level IN ('regional', 'nacional', 'internacional')),
  specialties JSONB DEFAULT '[]'::jsonb,
  nationality TEXT DEFAULT 'Brasileiro(a)',
  city TEXT,
  state TEXT,
  email TEXT,
  phone TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referees_owner ON referees(owner_id);
CREATE INDEX IF NOT EXISTS idx_referees_status ON referees(status);
CREATE INDEX IF NOT EXISTS idx_referees_federation ON referees(federation_id);

ALTER TABLE referees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active referees" ON referees FOR SELECT USING (status = 'active');
CREATE POLICY "Owner can update own referee" ON referees FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Authenticated can insert referee" ON referees FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE TRIGGER set_referees_updated_at BEFORE UPDATE ON referees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. MATCH MAKERS
-- =============================================
CREATE TABLE IF NOT EXISTS match_makers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  cpf TEXT NOT NULL,
  nationality TEXT DEFAULT 'Brasileiro(a)',
  organizations JSONB DEFAULT '[]'::jsonb,
  specialty TEXT CHECK (specialty IN ('amador', 'profissional', 'internacional')),
  events_participated JSONB DEFAULT '[]'::jsonb,
  email TEXT,
  instagram TEXT,
  facebook TEXT,
  tiktok TEXT,
  whatsapp TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_makers_owner ON match_makers(owner_id);
CREATE INDEX IF NOT EXISTS idx_match_makers_status ON match_makers(status);

ALTER TABLE match_makers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active match_makers" ON match_makers FOR SELECT USING (status = 'active');
CREATE POLICY "Owner can update own match_maker" ON match_makers FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Authenticated can insert match_maker" ON match_makers FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE TRIGGER set_match_makers_updated_at BEFORE UPDATE ON match_makers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 6. JUNCTION / RELATIONSHIP TABLES
-- =============================================

-- Federation <-> Referees
CREATE TABLE IF NOT EXISTS federation_referees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  federation_id UUID NOT NULL REFERENCES federations(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES referees(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(federation_id, referee_id)
);
ALTER TABLE federation_referees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active federation_referees" ON federation_referees FOR SELECT USING (true);

-- Federation <-> Teams
CREATE TABLE IF NOT EXISTS federation_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  federation_id UUID NOT NULL REFERENCES federations(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(federation_id, team_id)
);
ALTER TABLE federation_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active federation_teams" ON federation_teams FOR SELECT USING (true);

-- Team <-> Fighters
CREATE TABLE IF NOT EXISTS team_fighters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  fighter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, fighter_id)
);
ALTER TABLE team_fighters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active team_fighters" ON team_fighters FOR SELECT USING (true);

-- Match Maker <-> Athletes
CREATE TABLE IF NOT EXISTS match_maker_athletes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_maker_id UUID NOT NULL REFERENCES match_makers(id) ON DELETE CASCADE,
  fighter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(match_maker_id, fighter_id)
);
ALTER TABLE match_maker_athletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active match_maker_athletes" ON match_maker_athletes FOR SELECT USING (true);

-- Match Maker <-> Teams
CREATE TABLE IF NOT EXISTS match_maker_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_maker_id UUID NOT NULL REFERENCES match_makers(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(match_maker_id, team_id)
);
ALTER TABLE match_maker_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active match_maker_teams" ON match_maker_teams FOR SELECT USING (true);

-- Match Maker <-> Federations
CREATE TABLE IF NOT EXISTS match_maker_federations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_maker_id UUID NOT NULL REFERENCES match_makers(id) ON DELETE CASCADE,
  federation_id UUID NOT NULL REFERENCES federations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(match_maker_id, federation_id)
);
ALTER TABLE match_maker_federations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active match_maker_federations" ON match_maker_federations FOR SELECT USING (true);
