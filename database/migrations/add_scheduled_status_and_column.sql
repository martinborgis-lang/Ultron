-- Migration pour ajouter le statut 'scheduled' et la colonne scheduled_at à phone_calls
-- Date: 2026-01-29

-- 1. Ajouter la colonne scheduled_at si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'phone_calls' AND column_name = 'scheduled_at') THEN
        ALTER TABLE phone_calls ADD COLUMN scheduled_at TIMESTAMPTZ;
    END IF;
END $$;

-- 2. Supprimer l'ancienne contrainte
ALTER TABLE phone_calls DROP CONSTRAINT IF EXISTS phone_calls_status_check;

-- 3. Ajouter la nouvelle contrainte avec 'scheduled'
ALTER TABLE phone_calls ADD CONSTRAINT phone_calls_status_check CHECK (status IN (
    'queued',      -- En file d'attente
    'scheduled',   -- Programmé (nouveau)
    'ringing',     -- En cours de sonnerie
    'in_progress', -- En cours
    'completed',   -- Terminé
    'failed',      -- Échoué
    'no_answer',   -- Pas de réponse
    'busy',        -- Occupé
    'cancelled'    -- Annulé
));

-- 4. Mettre à jour les appels existants qui utilisent déjà scheduled_at sans statut approprié
UPDATE phone_calls
SET status = 'scheduled'
WHERE scheduled_at IS NOT NULL
  AND status = 'queued';

COMMENT ON COLUMN phone_calls.scheduled_at IS 'Date/heure programmée pour exécution de l''appel';