-- ========================================
-- AJOUTER COLONNE DÉLAI D'APPEL
-- ========================================

-- Ajouter la colonne pour le délai d'attente avant l'appel
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS call_delay_minutes INTEGER DEFAULT 5;

-- Vérification
SELECT
  id,
  agent_name,
  call_delay_minutes,
  is_enabled
FROM voice_config
WHERE organization_id = '2740ed23-bffe-423e-a038-abaa231525b3';