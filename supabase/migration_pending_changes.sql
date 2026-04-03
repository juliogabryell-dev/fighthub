-- =============================================
-- MIGRATION: Pending changes for verified profiles
-- =============================================

CREATE TABLE IF NOT EXISTS pending_profile_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('profile', 'martial_art', 'fight_record', 'video', 'experience')),
  action TEXT NOT NULL DEFAULT 'update' CHECK (action IN ('create', 'update', 'delete')),
  target_id UUID,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_changes_user ON pending_profile_changes(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_changes_status ON pending_profile_changes(status, created_at DESC);

ALTER TABLE pending_profile_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pending changes"
  ON pending_profile_changes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pending changes"
  ON pending_profile_changes FOR INSERT WITH CHECK (auth.uid() = user_id);
