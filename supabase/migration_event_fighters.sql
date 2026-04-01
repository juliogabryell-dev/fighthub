-- =============================================
-- MIGRATION: Event Fighters (vincular lutadores a eventos)
-- =============================================

CREATE TABLE IF NOT EXISTS event_fighters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  fighter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, fighter_id)
);

CREATE INDEX IF NOT EXISTS idx_event_fighters_event_id ON event_fighters(event_id);
CREATE INDEX IF NOT EXISTS idx_event_fighters_fighter_id ON event_fighters(fighter_id);

ALTER TABLE event_fighters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view event fighters"
  ON event_fighters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = event_fighters.event_id AND events.is_published = true
    )
  );
