-- Table pour stocker les webhooks de formulaires
-- Cette table doit être créée si elle n'existe pas déjà

CREATE TABLE IF NOT EXISTS voice_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Informations webhook
  source VARCHAR NOT NULL, -- 'form_test', 'calendly', 'typeform', etc.
  webhook_url VARCHAR,

  -- Données prospect
  prospect_data JSONB NOT NULL,
  phone_number VARCHAR NOT NULL,
  email VARCHAR,
  name VARCHAR,

  -- Traitement
  processing_status VARCHAR DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  processing_notes TEXT,
  processed_at TIMESTAMPTZ,
  error_message TEXT,

  -- IDs créés lors du traitement
  prospect_created_id UUID,
  call_created_id UUID,

  -- Métadonnées tracking
  ip_address VARCHAR,
  user_agent TEXT,
  referer VARCHAR,
  utm_source VARCHAR,
  utm_medium VARCHAR,
  utm_campaign VARCHAR,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_voice_webhooks_org ON voice_webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_voice_webhooks_phone ON voice_webhooks(phone_number);
CREATE INDEX IF NOT EXISTS idx_voice_webhooks_status ON voice_webhooks(processing_status);
CREATE INDEX IF NOT EXISTS idx_voice_webhooks_created ON voice_webhooks(created_at);

-- RLS
ALTER TABLE voice_webhooks ENABLE ROW LEVEL SECURITY;

-- Policies RLS
DROP POLICY IF EXISTS "voice_webhooks_organization_access" ON voice_webhooks;
CREATE POLICY "voice_webhooks_organization_access" ON voice_webhooks
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Table pour stocker les appels téléphoniques (si elle n'existe pas)
-- ATTENTION : Cette table peut déjà exister sous le nom 'voice_calls'
CREATE TABLE IF NOT EXISTS phone_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES crm_prospects(id) ON DELETE SET NULL,

  -- Informations appel
  to_number VARCHAR NOT NULL,
  from_number VARCHAR,

  -- Intégrations
  vapi_call_id VARCHAR UNIQUE,
  vapi_assistant_id VARCHAR,
  twilio_call_sid VARCHAR UNIQUE,

  -- Statut et timing
  status VARCHAR DEFAULT 'queued' CHECK (status IN ('queued', 'ringing', 'in-progress', 'completed', 'failed', 'no_answer')),
  outcome VARCHAR, -- 'appointment_booked', 'not_interested', 'callback_requested', etc.

  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Programmation
  scheduled_call_at TIMESTAMPTZ,

  -- Transcription et analyse
  transcript TEXT,
  transcript_confidence NUMERIC,
  ai_analysis JSONB,

  -- Métadonnées
  source VARCHAR DEFAULT 'manual', -- 'manual', 'webhook', 'scheduled'
  processing_notes TEXT,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_phone_calls_org ON phone_calls(organization_id);
CREATE INDEX IF NOT EXISTS idx_phone_calls_prospect ON phone_calls(prospect_id);
CREATE INDEX IF NOT EXISTS idx_phone_calls_status ON phone_calls(status);
CREATE INDEX IF NOT EXISTS idx_phone_calls_outcome ON phone_calls(outcome);
CREATE INDEX IF NOT EXISTS idx_phone_calls_to_number ON phone_calls(to_number);
CREATE INDEX IF NOT EXISTS idx_phone_calls_created ON phone_calls(created_at);

-- RLS
ALTER TABLE phone_calls ENABLE ROW LEVEL SECURITY;

-- Policies RLS
DROP POLICY IF EXISTS "phone_calls_organization_access" ON phone_calls;
CREATE POLICY "phone_calls_organization_access" ON phone_calls
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Trigger pour mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_voice_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS voice_webhooks_updated_at_trigger ON voice_webhooks;
CREATE TRIGGER voice_webhooks_updated_at_trigger
  BEFORE UPDATE ON voice_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_webhooks_updated_at();

DROP TRIGGER IF EXISTS phone_calls_updated_at_trigger ON phone_calls;
CREATE TRIGGER phone_calls_updated_at_trigger
  BEFORE UPDATE ON phone_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_webhooks_updated_at();