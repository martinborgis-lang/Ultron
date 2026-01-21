-- Migration: Champs RGPD pour tracking consentement et désinscription
-- Les prospects sont considérés consentants à l'import (campagnes pub)

-- 1. Colonnes de tracking consentement
ALTER TABLE crm_prospects
ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS consent_source VARCHAR(50) DEFAULT 'campaign',
ADD COLUMN IF NOT EXISTS consent_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

-- 2. Colonnes pour tracer les demandes RGPD
ALTER TABLE crm_prospects
ADD COLUMN IF NOT EXISTS gdpr_export_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS gdpr_anonymized_at TIMESTAMPTZ;

-- 3. Index pour requêtes de désinscription
CREATE INDEX IF NOT EXISTS idx_prospects_unsubscribed
ON crm_prospects(organization_id, unsubscribed_at)
WHERE unsubscribed_at IS NOT NULL;

-- 4. Mettre à jour les prospects existants comme consentants
UPDATE crm_prospects
SET consent_marketing = TRUE,
    consent_source = 'campaign',
    consent_date = created_at
WHERE consent_marketing IS NULL;

COMMENT ON COLUMN crm_prospects.consent_marketing IS 'TRUE par défaut (consentement via campagne pub)';
COMMENT ON COLUMN crm_prospects.unsubscribed_at IS 'Date de désinscription si le prospect a cliqué Se désinscrire';