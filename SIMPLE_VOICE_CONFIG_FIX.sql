-- ========================================
-- CONFIGURATION VOICE SIMPLE - VAPI + TWILIO
-- ========================================

-- Puisque vous avez déjà TWILIO configuré en variables d'environnement,
-- il ne faut ajouter que les colonnes VAPI essentielles :

-- ✅ SEULE COLONNE VAPI CRITIQUE
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS vapi_api_key VARCHAR;

-- ✅ COLONNES INTERFACE EXISTANTE (pour les champs déjà dans l'UI)
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS working_hours_start TIME DEFAULT '09:00';
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS working_hours_end TIME DEFAULT '18:00';
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS max_call_duration_seconds INTEGER DEFAULT 300;
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS retry_on_no_answer BOOLEAN DEFAULT false;
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS max_retry_attempts INTEGER DEFAULT 2;

-- ✅ ACTIVATION DE VOTRE AGENT
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
  vapi_api_key IS NOT NULL as has_vapi_key,
  'Twilio configuré en variable environnement' as twilio_status
FROM voice_config
WHERE organization_id = '2740ed23-bffe-423e-a038-abaa231525b3';