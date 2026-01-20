-- Meeting Transcripts Table
-- This table stores meeting transcriptions with AI analysis

CREATE TABLE IF NOT EXISTS meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES crm_prospects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Meeting info
  meeting_date TIMESTAMPTZ DEFAULT NOW(),
  duration_seconds INTEGER,
  google_meet_link VARCHAR(500),

  -- Transcript data
  transcript_text TEXT,
  transcript_json JSONB, -- Array of TranscriptSegment

  -- AI Analysis
  ai_summary TEXT,
  key_points JSONB, -- Array of strings
  objections_detected JSONB, -- Array of ObjectionDetected
  next_actions JSONB, -- Array of strings

  -- PDF
  pdf_url VARCHAR(500),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_prospect
  ON meeting_transcripts(prospect_id);

CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_org
  ON meeting_transcripts(organization_id);

CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_user
  ON meeting_transcripts(user_id);

CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_date
  ON meeting_transcripts(meeting_date DESC);

-- Row Level Security
ALTER TABLE meeting_transcripts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see meetings from their organization
CREATE POLICY "Users can view their organization's meetings"
  ON meeting_transcripts
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Policy: Users can insert meetings for their organization
CREATE POLICY "Users can insert meetings for their organization"
  ON meeting_transcripts
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Policy: Users can update their own meetings
CREATE POLICY "Users can update their own meetings"
  ON meeting_transcripts
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Policy: Users can delete their own meetings
CREATE POLICY "Users can delete their own meetings"
  ON meeting_transcripts
  FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Storage bucket for meeting transcripts (run this in Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('meeting-transcripts', 'meeting-transcripts', true);

-- Storage policy for meeting transcripts
-- CREATE POLICY "Allow authenticated uploads"
--   ON storage.objects
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'meeting-transcripts');

-- CREATE POLICY "Allow public read"
--   ON storage.objects
--   FOR SELECT
--   TO public
--   USING (bucket_id = 'meeting-transcripts');
