-- Migration pour le système de produits et commissions
-- À exécuter dans Supabase SQL Editor

-- Table des produits configurables par l'admin
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL CHECK (type IN ('fixed', 'commission')), -- 'fixed' = bénéfice fixe, 'commission' = %

  -- Pour produits à bénéfice fixe (ex: pompe à chaleur)
  fixed_value NUMERIC, -- Prix fixe en euros

  -- Pour produits à commission (ex: CGP)
  commission_rate NUMERIC, -- Pourcentage de commission (ex: 2.5 pour 2.5%)

  -- Métadata
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Contraintes
  CONSTRAINT valid_fixed_product CHECK (
    (type = 'fixed' AND fixed_value IS NOT NULL AND fixed_value > 0) OR
    type = 'commission'
  ),
  CONSTRAINT valid_commission_product CHECK (
    (type = 'commission' AND commission_rate IS NOT NULL AND commission_rate > 0 AND commission_rate <= 100) OR
    type = 'fixed'
  )
);

-- Table des commissions par conseiller (personnalisables)
CREATE TABLE IF NOT EXISTS advisor_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE, -- NULL = commission par défaut

  commission_rate NUMERIC NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  is_default BOOLEAN DEFAULT false, -- Commission par défaut pour ce conseiller

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Un conseiller ne peut avoir qu'une commission par produit
  UNIQUE(user_id, product_id),
  -- Un seul taux par défaut par conseiller
  EXCLUDE (user_id WITH =) WHERE (is_default = true AND product_id IS NULL)
);

-- Table des deals avec produits sélectionnés
CREATE TABLE IF NOT EXISTS deal_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES crm_prospects(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Montants
  client_amount NUMERIC NOT NULL CHECK (client_amount > 0), -- Montant client (ex: 100k€ assurance vie)
  company_revenue NUMERIC NOT NULL CHECK (company_revenue > 0), -- CA pour l'entreprise
  advisor_commission NUMERIC DEFAULT 0 CHECK (advisor_commission >= 0), -- Commission du conseiller

  -- Calculs automatiques
  commission_rate_used NUMERIC, -- Taux utilisé pour le calcul
  advisor_commission_rate NUMERIC, -- Taux conseiller utilisé

  -- Métadata
  closed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Un prospect ne peut avoir qu'un deal actif
  UNIQUE(prospect_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_products_org_active ON products(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_advisor_commissions_user ON advisor_commissions(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_deal_products_advisor_date ON deal_products(advisor_id, closed_at);
CREATE INDEX IF NOT EXISTS idx_deal_products_org_date ON deal_products(organization_id, closed_at);

-- RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_products ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour products
CREATE POLICY "Users can view organization products"
ON products FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage products"
ON products FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);

-- Politiques RLS pour advisor_commissions
CREATE POLICY "Users can view organization commissions"
ON advisor_commissions FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage commissions"
ON advisor_commissions FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);

-- Politiques RLS pour deal_products
CREATE POLICY "Users can view organization deals"
ON deal_products FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Users can create deals"
ON deal_products FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_id = auth.uid()
  )
  AND advisor_id IN (
    SELECT id FROM users
    WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all deals"
ON deal_products FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);

-- Fonction pour calculer automatiquement les revenus et commissions
CREATE OR REPLACE FUNCTION calculate_deal_revenue()
RETURNS TRIGGER AS $$
DECLARE
  product products%ROWTYPE;
  advisor_rate NUMERIC;
  default_rate NUMERIC;
BEGIN
  -- Récupérer le produit
  SELECT * INTO product FROM products WHERE id = NEW.product_id;

  IF product IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Calculer le CA entreprise selon le type de produit
  IF product.type = 'fixed' THEN
    NEW.company_revenue := product.fixed_value;
  ELSIF product.type = 'commission' THEN
    NEW.company_revenue := NEW.client_amount * (product.commission_rate / 100);
    NEW.commission_rate_used := product.commission_rate;
  END IF;

  -- Récupérer le taux de commission du conseiller pour ce produit
  SELECT commission_rate INTO advisor_rate
  FROM advisor_commissions
  WHERE user_id = NEW.advisor_id
    AND product_id = NEW.product_id;

  -- Si pas de taux spécifique, récupérer le taux par défaut du conseiller
  IF advisor_rate IS NULL THEN
    SELECT commission_rate INTO default_rate
    FROM advisor_commissions
    WHERE user_id = NEW.advisor_id
      AND product_id IS NULL
      AND is_default = true;

    advisor_rate := COALESCE(default_rate, 0);
  END IF;

  -- Calculer la commission du conseiller
  NEW.advisor_commission := NEW.company_revenue * (advisor_rate / 100);
  NEW.advisor_commission_rate := advisor_rate;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement lors de l'insertion/mise à jour
CREATE OR REPLACE TRIGGER trigger_calculate_deal_revenue
  BEFORE INSERT OR UPDATE ON deal_products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_deal_revenue();

-- Fonction pour mettre à jour deal_value dans crm_prospects
CREATE OR REPLACE FUNCTION sync_prospect_deal_value()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour la valeur du deal dans crm_prospects
  UPDATE crm_prospects
  SET deal_value = NEW.company_revenue,
      updated_at = now()
  WHERE id = NEW.prospect_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour synchroniser avec crm_prospects
CREATE OR REPLACE TRIGGER trigger_sync_prospect_deal_value
  AFTER INSERT OR UPDATE ON deal_products
  FOR EACH ROW
  EXECUTE FUNCTION sync_prospect_deal_value();

-- Données par défaut pour les catégories de produits CGP
INSERT INTO products (organization_id, name, description, type, commission_rate, category, created_by)
SELECT
  o.id,
  'Assurance Vie',
  'Contrats d''assurance vie et capitalisation',
  'commission',
  2.0,
  'assurance_vie',
  NULL
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM products p
  WHERE p.organization_id = o.id
    AND p.name = 'Assurance Vie'
);

INSERT INTO products (organization_id, name, description, type, commission_rate, category, created_by)
SELECT
  o.id,
  'PEA',
  'Plan d''Épargne en Actions',
  'commission',
  1.5,
  'pea',
  NULL
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM products p
  WHERE p.organization_id = o.id
    AND p.name = 'PEA'
);

-- Commissions par défaut pour les conseillers existants (10%)
INSERT INTO advisor_commissions (organization_id, user_id, commission_rate, is_default)
SELECT
  u.organization_id,
  u.id,
  10.0,
  true
FROM users u
WHERE u.role = 'conseiller'
  AND NOT EXISTS (
    SELECT 1 FROM advisor_commissions ac
    WHERE ac.user_id = u.id
      AND ac.is_default = true
      AND ac.product_id IS NULL
  );