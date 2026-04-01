-- =============================================
-- MIGRATION: Events (Eventos de Luta)
-- =============================================

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description_short TEXT NOT NULL,
  description_full TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  payment_link TEXT,
  external_link TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Event images table
CREATE TABLE IF NOT EXISTS event_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON events(is_published);
CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON event_images(event_id);
CREATE INDEX IF NOT EXISTS idx_event_images_order ON event_images(event_id, display_order);

-- Updated_at trigger
CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;

-- Public can read published events
CREATE POLICY "Public can view published events"
  ON events FOR SELECT
  USING (is_published = true);

-- Public can read images of published events
CREATE POLICY "Public can view event images"
  ON event_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = event_images.event_id AND events.is_published = true
    )
  );

-- Service role has full access (used by admin API routes)
-- Note: service_role key bypasses RLS by default in Supabase

-- Create storage bucket for event images (run in Supabase dashboard if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true);
