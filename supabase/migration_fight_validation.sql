-- =============================================
-- MIGRATION: Admin validation for fight experiences
--
-- Fights are public right away with a validation seal:
--   pending   -> "Aguardando validação"
--   validated -> "Validado"
--   rejected  -> "Não validado" (+ reason)
-- Only the service role (admin API) can change the status; any insert or
-- edit made by the fighter goes (back) to 'pending'.
-- Rejected fights stay public but no longer count in the cartel.
-- =============================================

ALTER TABLE fight_experiences ADD COLUMN IF NOT EXISTS validation_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE fight_experiences ADD COLUMN IF NOT EXISTS validation_note TEXT;
ALTER TABLE fight_experiences ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;

ALTER TABLE fight_experiences DROP CONSTRAINT IF EXISTS fight_experiences_validation_status_check;
ALTER TABLE fight_experiences ADD CONSTRAINT fight_experiences_validation_status_check
  CHECK (validation_status IN ('pending', 'validated', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_fight_experiences_validation ON fight_experiences(validation_status, created_at DESC);

-- ---------------------------------------------
-- Fighters can't validate their own fights
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION guard_fight_experience_validation() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    NEW.validation_status := 'pending';
    NEW.validation_note := NULL;
    NEW.validated_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fight_experience_validation_guard ON fight_experiences;
CREATE TRIGGER trg_fight_experience_validation_guard
  BEFORE INSERT OR UPDATE ON fight_experiences
  FOR EACH ROW
  EXECUTE FUNCTION guard_fight_experience_validation();

-- ---------------------------------------------
-- Cartel sync: rejected fights don't count
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION sync_fight_experience_record() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.validation_status <> 'rejected' THEN
    PERFORM apply_fight_experience_to_record(OLD.fighter_id, OLD.modality, OLD.category, OLD.result, -1);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.validation_status <> 'rejected' THEN
    PERFORM apply_fight_experience_to_record(NEW.fighter_id, NEW.modality, NEW.category, NEW.result, 1);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_fight_experience_record ON fight_experiences;
CREATE TRIGGER trg_fight_experience_record
  AFTER INSERT OR DELETE OR UPDATE OF fighter_id, modality, category, result, validation_status ON fight_experiences
  FOR EACH ROW
  EXECUTE FUNCTION sync_fight_experience_record();
