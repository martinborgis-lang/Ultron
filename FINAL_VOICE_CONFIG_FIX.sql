-- ========================================
-- CORRECTION FINALE VOICE_CONFIG
-- ========================================

-- Architecture confirmée :
-- ✅ VAPI_API_KEY : Variable environnement Vercel
-- ✅ TWILIO_* : Variables environnement Vercel
-- ❌ Colonnes UI manquantes en base de données

-- AJOUTER UNIQUEMENT les colonnes pour l'interface utilisateur :
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

-- ACTIVER l'agent maintenant que les colonnes existent :
UPDATE voice_config
SET
  is_enabled = true,
  ai_agent_enabled = true,
  agent_enabled = true
WHERE organization_id = '2740ed23-bffe-423e-a038-abaa231525b3';

-- ========================================
-- VÉRIFICATION FINALE
-- ========================================

SELECT
  agent_name,
  is_enabled,
  ai_agent_enabled,
  agent_enabled,
  working_hours_start,
  working_hours_end,
  max_call_duration_seconds,
  retry_on_no_answer,
  max_retry_attempts,
  'VAPI_API_KEY en env variable' as vapi_status,
  'Twilio en env variables' as twilio_status
FROM voice_config
WHERE organization_id = '2740ed23-bffe-423e-a038-abaa231525b3';