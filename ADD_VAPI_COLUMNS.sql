-- Ajouter les colonnes VAPI manquantes à la table voice_config
ALTER TABLE voice_config
  ADD COLUMN IF NOT EXISTS vapi_api_key VARCHAR;

ALTER TABLE voice_config
  ADD COLUMN IF NOT EXISTS vapi_phone_number VARCHAR;

ALTER TABLE voice_config
  ADD COLUMN IF NOT EXISTS vapi_assistant_id VARCHAR;

ALTER TABLE voice_config
  ADD COLUMN IF NOT EXISTS working_hours_start TIME DEFAULT '09:00';

ALTER TABLE voice_config
  ADD COLUMN IF NOT EXISTS working_hours_end TIME DEFAULT '18:00';

ALTER TABLE voice_config
  ADD COLUMN IF NOT EXISTS working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5];

ALTER TABLE voice_config
  ADD COLUMN IF NOT EXISTS timezone VARCHAR DEFAULT 'Europe/Paris';

ALTER TABLE voice_config
  ADD COLUMN IF NOT EXISTS qualification_questions JSONB;

ALTER TABLE voice_config
  ADD COLUMN IF NOT EXISTS max_call_duration_seconds INTEGER DEFAULT 300;

ALTER TABLE voice_config
  ADD COLUMN IF NOT EXISTS retry_on_no_answer BOOLEAN DEFAULT false;

ALTER TABLE voice_config
  ADD COLUMN IF NOT EXISTS max_retry_attempts INTEGER DEFAULT 2;

ALTER TABLE voice_config
  ADD COLUMN IF NOT EXISTS delay_between_retries_minutes INTEGER DEFAULT 30;

ALTER TABLE voice_config
  ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR;

-- Mise à jour pour activer l'agent
UPDATE voice_config
SET
  is_enabled = true,
  ai_agent_enabled = true,
  agent_enabled = true
WHERE organization_id = '2740ed23-bffe-423e-a038-abaa231525b3';