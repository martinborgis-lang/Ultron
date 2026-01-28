-- ========================================
-- AJOUTER COLONNES UTM À CRM_PROSPECTS
-- ========================================

-- Le webhook essaye d'écrire utm_campaign, utm_source, utm_medium
-- mais ces colonnes n'existent pas dans crm_prospects

-- Ajouter les colonnes UTM manquantes
ALTER TABLE crm_prospects ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
ALTER TABLE crm_prospects ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);
ALTER TABLE crm_prospects ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);

-- Vérification
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'crm_prospects'
  AND column_name LIKE 'utm_%'
ORDER BY column_name;