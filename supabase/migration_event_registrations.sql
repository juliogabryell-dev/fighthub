-- =============================================
-- MIGRATION: Event Registrations (inscrição de lutadores em eventos)
-- =============================================

CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  fighter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, fighter_id)
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_fighter ON event_registrations(fighter_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved registrations"
  ON event_registrations FOR SELECT USING (true);

CREATE POLICY "Fighters can insert own registrations"
  ON event_registrations FOR INSERT WITH CHECK (fighter_id = auth.uid());
