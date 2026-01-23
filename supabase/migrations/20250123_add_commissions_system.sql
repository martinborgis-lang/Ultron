-- Migration: Système de commissions complet pour produits financiers
-- Date: 2025-01-23
-- Description: Ajoute les colonnes nécessaires pour le calcul des commissions

-- 1. Modifier la table products pour ajouter les 4 taux de commission
ALTER TABLE products
ADD COLUMN IF NOT EXISTS commission_conseiller_initial DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_conseiller_periodique DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_cabinet_initial DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_cabinet_periodique DECIMAL(5,2) DEFAULT 0;

-- Commentaires pour documentation
COMMENT ON COLUMN products.commission_conseiller_initial IS 'Commission conseiller sur versement initial (%)';
COMMENT ON COLUMN products.commission_conseiller_periodique IS 'Commission conseiller sur versements périodiques année 1 (%)';
COMMENT ON COLUMN products.commission_cabinet_initial IS 'Commission cabinet sur versement initial (%)';
COMMENT ON COLUMN products.commission_cabinet_periodique IS 'Commission cabinet sur versements périodiques (%)';

-- 2. Modifier la table crm_prospects pour stocker les détails de vente
ALTER TABLE crm_prospects
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id),
ADD COLUMN IF NOT EXISTS versement_initial DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS versement_mensuel DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS frais_taux DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS frais_sur VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS date_vente TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS commissions_calculees JSONB;

-- Contraintes pour validation
ALTER TABLE crm_prospects
ADD CONSTRAINT check_frais_taux CHECK (frais_taux >= 0 AND frais_taux <= 1),
ADD CONSTRAINT check_frais_sur CHECK (frais_sur IN ('initial', 'periodique', 'les_deux') OR frais_sur IS NULL),
ADD CONSTRAINT check_versements_positifs CHECK (
  (versement_initial IS NULL OR versement_initial >= 0) AND
  (versement_mensuel IS NULL OR versement_mensuel >= 0)
);

-- Index pour optimiser les requêtes de rapport
CREATE INDEX IF NOT EXISTS idx_prospects_ventes ON crm_prospects(organization_id, date_vente)
WHERE stage_slug = 'gagne' AND date_vente IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prospects_product ON crm_prospects(organization_id, product_id)
WHERE product_id IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN crm_prospects.product_id IS 'Produit vendu lors de la clôture';
COMMENT ON COLUMN crm_prospects.versement_initial IS 'Montant du premier versement en euros';
COMMENT ON COLUMN crm_prospects.versement_mensuel IS 'Montant du versement mensuel en euros';
COMMENT ON COLUMN crm_prospects.frais_taux IS 'Taux de frais appliqués par le conseiller (0-1%)';
COMMENT ON COLUMN crm_prospects.frais_sur IS 'Sur quoi les frais s''appliquent: initial, periodique, les_deux';
COMMENT ON COLUMN crm_prospects.date_vente IS 'Date de clôture de la vente';
COMMENT ON COLUMN crm_prospects.commissions_calculees IS 'Détail JSON des commissions calculées';

-- 3. Mise à jour des contraintes existantes sur les commissions produits
ALTER TABLE products
ADD CONSTRAINT check_commissions_valides CHECK (
  commission_conseiller_initial >= 0 AND commission_conseiller_initial <= 100 AND
  commission_conseiller_periodique >= 0 AND commission_conseiller_periodique <= 100 AND
  commission_cabinet_initial >= 0 AND commission_cabinet_initial <= 100 AND
  commission_cabinet_periodique >= 0 AND commission_cabinet_periodique <= 100
);

-- 4. Exemple de données de test (optionnel - peut être retiré en production)
-- UPDATE products SET
--   commission_conseiller_initial = 2.5,
--   commission_conseiller_periodique = 1.5,
--   commission_cabinet_initial = 3.0,
--   commission_cabinet_periodique = 2.0
-- WHERE type = 'commission' AND organization_id IS NOT NULL;