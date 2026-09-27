-- =============================================
-- MIGRATION: Fight experiences (individual fights with photo proof)
-- Each fight requires a face-off photo and a hand-raised result photo;
-- the video link is optional. Inserting/updating/deleting a fight keeps
-- the aggregated fight_records (cartel) in sync via trigger.
-- =============================================

CREATE TABLE IF NOT EXISTS fight_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  modality TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'amador' CHECK (category IN ('profissional', 'semi_profissional', 'amador')),
  result TEXT NOT NULL CHECK (result IN ('win', 'loss', 'draw', 'no_contest')),
  opponent_name TEXT NOT NULL,
  event_name TEXT,
  fight_date DATE,
  faceoff_photo_url TEXT NOT NULL,
  hand_raised_photo_url TEXT NOT NULL,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fight_experiences_fighter ON fight_experiences(fighter_id, fight_date DESC);

DROP TRIGGER IF EXISTS set_fight_experiences_updated_at ON fight_experiences;
CREATE TRIGGER set_fight_experiences_updated_at
  BEFORE UPDATE ON fight_experiences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE fight_experiences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Fight experiences are public" ON fight_experiences;
CREATE POLICY "Fight experiences are public"
  ON fight_experiences FOR SELECT USING (true);

DROP POLICY IF EXISTS "Fighters insert own fight experiences" ON fight_experiences;
CREATE POLICY "Fighters insert own fight experiences"
  ON fight_experiences FOR INSERT WITH CHECK (auth.uid() = fighter_id);

DROP POLICY IF EXISTS "Fighters update own fight experiences" ON fight_experiences;
CREATE POLICY "Fighters update own fight experiences"
  ON fight_experiences FOR UPDATE USING (auth.uid() = fighter_id);

DROP POLICY IF EXISTS "Fighters delete own fight experiences" ON fight_experiences;
CREATE POLICY "Fighters delete own fight experiences"
  ON fight_experiences FOR DELETE USING (auth.uid() = fighter_id);

-- ---------------------------------------------
-- Cartel sync: +1 / -1 on the matching fight_records row
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION apply_fight_experience_to_record(
  p_fighter_id UUID, p_modality TEXT, p_category TEXT, p_result TEXT, p_delta INT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO fight_records (fighter_id, modality, category, wins, losses, draws, no_contest)
  VALUES (p_fighter_id, p_modality, p_category, 0, 0, 0, 0)
  ON CONFLICT (fighter_id, modality, category) DO NOTHING;

  UPDATE fight_records SET
    wins       = GREATEST(0, COALESCE(wins, 0)       + CASE WHEN p_result = 'win'        THEN p_delta ELSE 0 END),
    losses     = GREATEST(0, COALESCE(losses, 0)     + CASE WHEN p_result = 'loss'       THEN p_delta ELSE 0 END),
    draws      = GREATEST(0, COALESCE(draws, 0)      + CASE WHEN p_result = 'draw'       THEN p_delta ELSE 0 END),
    no_contest = GREATEST(0, COALESCE(no_contest, 0) + CASE WHEN p_result = 'no_contest' THEN p_delta ELSE 0 END)
  WHERE fighter_id = p_fighter_id AND modality = p_modality AND category = p_category;
END;
$$;

CREATE OR REPLACE FUNCTION sync_fight_experience_record() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM apply_fight_experience_to_record(OLD.fighter_id, OLD.modality, OLD.category, OLD.result, -1);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM apply_fight_experience_to_record(NEW.fighter_id, NEW.modality, NEW.category, NEW.result, 1);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_fight_experience_record ON fight_experiences;
CREATE TRIGGER trg_fight_experience_record
  AFTER INSERT OR DELETE OR UPDATE OF fighter_id, modality, category, result ON fight_experiences
  FOR EACH ROW
  EXECUTE FUNCTION sync_fight_experience_record();

-- ---------------------------------------------
-- Pending changes: allow the new change type (verified profiles)
-- ---------------------------------------------
ALTER TABLE pending_profile_changes DROP CONSTRAINT IF EXISTS pending_profile_changes_change_type_check;
ALTER TABLE pending_profile_changes ADD CONSTRAINT pending_profile_changes_change_type_check
  CHECK (change_type IN ('profile', 'martial_art', 'fight_record', 'video', 'experience', 'fight_experience'));

-- ---------------------------------------------
-- Storage bucket for fight photos (public read, owner writes in own folder)
-- Files are stored as <user_id>/<file>
-- ---------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('fight-photos', 'fight-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Fight photos are public" ON storage.objects;
CREATE POLICY "Fight photos are public"
  ON storage.objects FOR SELECT USING (bucket_id = 'fight-photos');

DROP POLICY IF EXISTS "Users upload own fight photos" ON storage.objects;
CREATE POLICY "Users upload own fight photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'fight-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users delete own fight photos" ON storage.objects;
CREATE POLICY "Users delete own fight photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'fight-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
