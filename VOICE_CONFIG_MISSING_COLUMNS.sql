-- ========================================
-- COLONNES MANQUANTES POUR VOICE_CONFIG
-- ========================================

-- Voici les colonnes manquantes essentielles pour VAPI basées sur votre table actuelle :
-- Colonnes existantes: id, organization_id, is_enabled, twilio_configured, ai_agent_enabled,
-- agent_name, agent_voice, agent_language, system_prompt, click_to_call_enabled,
-- auto_recording, auto_transcription, webhook_url, webhook_events, created_at, updated_at, agent_enabled

-- ✅ COLONNES VAPI CRITIQUES (obligatoires pour les appels)
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS vapi_api_key VARCHAR;
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS vapi_phone_number VARCHAR;
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS vapi_assistant_id VARCHAR;

-- ✅ COLONNES CONFIGURATION AVANCÉE (utilisées par l'interface)
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS working_hours_start TIME DEFAULT '09:00';
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS working_hours_end TIME DEFAULT '18:00';
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5];
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS timezone VARCHAR DEFAULT 'Europe/Paris';
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS qualification_questions JSONB;
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS max_call_duration_seconds INTEGER DEFAULT 300;
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS retry_on_no_answer BOOLEAN DEFAULT false;
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS max_retry_attempts INTEGER DEFAULT 2;
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS delay_between_retries_minutes INTEGER DEFAULT 30;
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR;

-- ✅ ACTIVATION DE VOTRE AGENT (remplacez par votre organization_id)
UPDATE voice_config
SET
  is_enabled = true,
  ai_agent_enabled = true,
  agent_enabled = true
WHERE organization_id = '2740ed23-bffe-423e-a038-abaa231525b3';

-- ========================================
-- VÉRIFICATION
-- ========================================

-- Vérifier que toutes les colonnes existent maintenant :
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'voice_config'
ORDER BY ordinal_position;

-- Vérifier la configuration de votre organisation :
SELECT
  agent_name,
  is_enabled,
  ai_agent_enabled,
  agent_enabled,
  vapi_api_key IS NOT NULL as has_vapi_key,
  vapi_phone_number,
  vapi_assistant_id
FROM voice_config
WHERE organization_id = '2740ed23-bffe-423e-a038-abaa231525b3';