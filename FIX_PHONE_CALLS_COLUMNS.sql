-- ========================================
-- CORRIGER LES COLONNES MANQUANTES PHONE_CALLS
-- ========================================

-- Ajouter les colonnes manquantes dans phone_calls
ALTER TABLE phone_calls ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE phone_calls ADD COLUMN IF NOT EXISTS qualification_result VARCHAR(20);
ALTER TABLE phone_calls ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Vérifier les colonnes ajoutées
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'phone_calls'
  AND column_name IN ('scheduled_at', 'qualification_result', 'metadata')
ORDER BY column_name;