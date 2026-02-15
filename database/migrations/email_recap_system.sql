-- Migration: Email Récapitulatif Post-RDV Avec Délai Paramétrable
-- Date: 2026-02-13
-- Description: Ajout du système d'emails programmés avec délai configurable

-- 1. Ajouter les paramètres email récap dans la table organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS email_recap_enabled BOOLEAN DEFAULT true;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS email_recap_delay_hours INTEGER DEFAULT 2
CHECK (email_recap_delay_hours >= 1 AND email_recap_delay_hours <= 168); -- Entre 1h et 7 jours

-- 2. Créer la table scheduled_emails pour la programmation
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES crm_prospects(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Type d'email et timing
  email_type VARCHAR(50) NOT NULL, -- 'rdv_recap', 'followup', 'reminder', etc.
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,

  -- Status de l'email
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),

  -- Contenu de l'email (JSON pour flexibilité)
  email_data JSONB NOT NULL,

  -- Gestion des erreurs
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour la performance du CRON job
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_pending_sorted
ON scheduled_emails(scheduled_at ASC)
WHERE status = 'pending';

-- Index pour requêtes par organisation et prospect
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_org_prospect
ON scheduled_emails(organization_id, prospect_id);

-- Index pour requêtes par conseiller
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_advisor
ON scheduled_emails(advisor_id);

-- Fonction de mise à jour du timestamp
CREATE OR REPLACE FUNCTION update_scheduled_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour automatique
DROP TRIGGER IF EXISTS trigger_update_scheduled_emails_updated_at ON scheduled_emails;
CREATE TRIGGER trigger_update_scheduled_emails_updated_at
    BEFORE UPDATE ON scheduled_emails
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_emails_updated_at();

-- Vues utiles pour monitoring
CREATE OR REPLACE VIEW v_scheduled_emails_pending AS
SELECT
    se.*,
    o.name as organization_name,
    u.full_name as advisor_name,
    u.email as advisor_email,
    cp.first_name || ' ' || cp.last_name as prospect_name,
    cp.email as prospect_email,
    (se.scheduled_at <= NOW()) as is_due
FROM scheduled_emails se
LEFT JOIN organizations o ON se.organization_id = o.id
LEFT JOIN users u ON se.advisor_id = u.id
LEFT JOIN crm_prospects cp ON se.prospect_id = cp.id
WHERE se.status = 'pending'
ORDER BY se.scheduled_at ASC;

CREATE OR REPLACE VIEW v_scheduled_emails_stats AS
SELECT
    organization_id,
    email_type,
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest_created,
    MAX(created_at) as newest_created
FROM scheduled_emails
GROUP BY organization_id, email_type, status
ORDER BY organization_id, email_type, status;

-- Commentaires pour documentation
COMMENT ON TABLE scheduled_emails IS 'Table pour la programmation des emails avec délai configurable';
COMMENT ON COLUMN scheduled_emails.email_type IS 'Type d''email: rdv_recap, followup, reminder, proposition, etc.';
COMMENT ON COLUMN scheduled_emails.email_data IS 'Données JSON contenant subject, body, prospect_data, rdv_data, etc.';
COMMENT ON COLUMN scheduled_emails.scheduled_at IS 'Date/heure d''envoi programmée (timezone UTC)';
COMMENT ON COLUMN scheduled_emails.retry_count IS 'Nombre de tentatives d''envoi effectuées';
COMMENT ON COLUMN organizations.email_recap_enabled IS 'Active/désactive l''envoi automatique d''email récap après RDV';
COMMENT ON COLUMN organizations.email_recap_delay_hours IS 'Délai en heures avant envoi email récap (1-168h)';