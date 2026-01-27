-- ======================================
-- ULTRON - Lead Finder Module Schema
-- ======================================
-- Tables pour le module de scraping et gestion de leads

-- Table pour gérer les crédits de leads par organisation
CREATE TABLE lead_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Crédits
  credits_total INTEGER DEFAULT 0 CHECK (credits_total >= 0),
  credits_used INTEGER DEFAULT 0 CHECK (credits_used >= 0),

  -- Métadonnées
  last_purchase_date TIMESTAMPTZ,
  last_usage_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Contraintes
  CONSTRAINT valid_credits CHECK (credits_used <= credits_total),
  UNIQUE(organization_id)
);

-- Index pour performance
CREATE INDEX idx_lead_credits_organization ON lead_credits(organization_id);

-- Table pour l'historique des recherches de leads
CREATE TABLE lead_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Paramètres de recherche
  search_type VARCHAR(20) NOT NULL CHECK (search_type IN ('particulier', 'entreprise')),
  profession VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  postal_code VARCHAR(10),

  -- Résultats
  leads_requested INTEGER NOT NULL CHECK (leads_requested > 0),
  leads_found INTEGER DEFAULT 0 CHECK (leads_found >= 0),
  credits_consumed INTEGER DEFAULT 0 CHECK (credits_consumed >= 0),

  -- Statut et métadonnées
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  search_duration_ms INTEGER,

  -- APIs utilisées
  api_source VARCHAR(50), -- 'outscraper', 'google_places', 'demo'
  api_response_raw JSONB,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_lead_searches_organization ON lead_searches(organization_id);
CREATE INDEX idx_lead_searches_user ON lead_searches(user_id);
CREATE INDEX idx_lead_searches_status ON lead_searches(status);
CREATE INDEX idx_lead_searches_created_at ON lead_searches(created_at DESC);

-- Table pour stocker les leads trouvés (avant import dans CRM)
CREATE TABLE lead_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID NOT NULL REFERENCES lead_searches(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Informations contact
  name VARCHAR(255),
  company_name VARCHAR(255),
  profession VARCHAR(255),

  -- Adresse
  address TEXT,
  postal_code VARCHAR(10),
  city VARCHAR(255),
  country VARCHAR(100) DEFAULT 'France',

  -- Contact
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(500),

  -- Métadonnées de source
  source VARCHAR(100) NOT NULL, -- 'google_places', 'outscraper', 'demo'
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
  raw_data JSONB DEFAULT '{}',

  -- Import vers CRM
  imported_to_crm BOOLEAN DEFAULT FALSE,
  prospect_id UUID, -- Si importé, lien vers crm_prospects
  imported_at TIMESTAMPTZ,
  imported_by UUID REFERENCES users(id),

  -- Validation et qualité
  is_valid BOOLEAN DEFAULT TRUE,
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  validation_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_lead_results_search ON lead_results(search_id);
CREATE INDEX idx_lead_results_organization ON lead_results(organization_id);
CREATE INDEX idx_lead_results_imported ON lead_results(imported_to_crm);
CREATE INDEX idx_lead_results_prospect ON lead_results(prospect_id) WHERE prospect_id IS NOT NULL;
CREATE INDEX idx_lead_results_email ON lead_results(email) WHERE email IS NOT NULL;
CREATE INDEX idx_lead_results_phone ON lead_results(phone) WHERE phone IS NOT NULL;

-- Table pour les statistiques de lead scraping par organisation
CREATE TABLE lead_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Métriques recherches
  searches_performed INTEGER DEFAULT 0,
  leads_found INTEGER DEFAULT 0,
  credits_consumed INTEGER DEFAULT 0,

  -- Métriques qualité
  leads_imported INTEGER DEFAULT 0,
  import_rate NUMERIC DEFAULT 0 CHECK (import_rate >= 0 AND import_rate <= 100),
  avg_quality_score NUMERIC DEFAULT 0,

  -- Métriques par type
  entreprise_searches INTEGER DEFAULT 0,
  particulier_searches INTEGER DEFAULT 0,

  -- Sources API utilisées
  outscraper_calls INTEGER DEFAULT 0,
  google_places_calls INTEGER DEFAULT 0,
  demo_calls INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(organization_id, date)
);

-- Index pour performance
CREATE INDEX idx_lead_stats_organization_date ON lead_stats(organization_id, date DESC);

-- ======================================
-- TRIGGERS AUTOMATIQUES
-- ======================================

-- Trigger pour mettre à jour lead_credits après utilisation
CREATE OR REPLACE FUNCTION update_lead_credits_after_search()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les crédits utilisés quand une recherche est complétée
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE lead_credits
    SET
      credits_used = credits_used + NEW.credits_consumed,
      last_usage_date = now(),
      updated_at = now()
    WHERE organization_id = NEW.organization_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lead_credits
  AFTER UPDATE ON lead_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_credits_after_search();

-- Trigger pour mettre à jour lead_stats quotidiennement
CREATE OR REPLACE FUNCTION update_lead_stats_daily()
RETURNS TRIGGER AS $$
DECLARE
  current_date_val DATE := CURRENT_DATE;
BEGIN
  -- Insérer ou mettre à jour les statistiques du jour
  INSERT INTO lead_stats (
    organization_id, date,
    searches_performed, leads_found, credits_consumed,
    leads_imported, import_rate,
    entreprise_searches, particulier_searches
  )
  VALUES (
    NEW.organization_id, current_date_val,
    1, COALESCE(NEW.leads_found, 0), COALESCE(NEW.credits_consumed, 0),
    0, 0,
    CASE WHEN NEW.search_type = 'entreprise' THEN 1 ELSE 0 END,
    CASE WHEN NEW.search_type = 'particulier' THEN 1 ELSE 0 END
  )
  ON CONFLICT (organization_id, date)
  DO UPDATE SET
    searches_performed = lead_stats.searches_performed + 1,
    leads_found = lead_stats.leads_found + COALESCE(NEW.leads_found, 0),
    credits_consumed = lead_stats.credits_consumed + COALESCE(NEW.credits_consumed, 0),
    entreprise_searches = lead_stats.entreprise_searches +
      CASE WHEN NEW.search_type = 'entreprise' THEN 1 ELSE 0 END,
    particulier_searches = lead_stats.particulier_searches +
      CASE WHEN NEW.search_type = 'particulier' THEN 1 ELSE 0 END,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lead_stats_daily
  AFTER INSERT ON lead_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_stats_daily();

-- Trigger pour mettre à jour les stats d'import
CREATE OR REPLACE FUNCTION update_import_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les statistiques quand un lead est importé
  IF NEW.imported_to_crm = TRUE AND OLD.imported_to_crm = FALSE THEN
    UPDATE lead_stats
    SET
      leads_imported = leads_imported + 1,
      import_rate = CASE
        WHEN leads_found > 0 THEN (leads_imported + 1) * 100.0 / leads_found
        ELSE 0
      END,
      updated_at = now()
    WHERE organization_id = NEW.organization_id
    AND date = CURRENT_DATE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_import_stats
  AFTER UPDATE ON lead_results
  FOR EACH ROW
  EXECUTE FUNCTION update_import_stats();

-- ======================================
-- RLS (Row Level Security)
-- ======================================

-- Activer RLS sur toutes les tables
ALTER TABLE lead_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_stats ENABLE ROW LEVEL SECURITY;

-- Policies pour lead_credits
CREATE POLICY "Users can view their organization credits"
  ON lead_credits FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage their organization credits"
  ON lead_credits FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies pour lead_searches
CREATE POLICY "Users can view their organization searches"
  ON lead_searches FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can create searches for their organization"
  ON lead_searches FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own searches"
  ON lead_searches FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Policies pour lead_results
CREATE POLICY "Users can view their organization lead results"
  ON lead_results FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their organization lead results"
  ON lead_results FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE auth_id = auth.uid()
    )
  );

-- Policies pour lead_stats
CREATE POLICY "Users can view their organization lead stats"
  ON lead_stats FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage their organization lead stats"
  ON lead_stats FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- ======================================
-- FONCTIONS UTILITAIRES
-- ======================================

-- Fonction pour initialiser les crédits d'une organisation
CREATE OR REPLACE FUNCTION init_lead_credits(org_id UUID, initial_credits INTEGER DEFAULT 10)
RETURNS UUID AS $$
DECLARE
  credits_id UUID;
BEGIN
  INSERT INTO lead_credits (organization_id, credits_total, credits_used)
  VALUES (org_id, initial_credits, 0)
  ON CONFLICT (organization_id) DO NOTHING
  RETURNING id INTO credits_id;

  RETURN credits_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour ajouter des crédits
CREATE OR REPLACE FUNCTION add_lead_credits(org_id UUID, additional_credits INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE lead_credits
  SET
    credits_total = credits_total + additional_credits,
    last_purchase_date = now(),
    updated_at = now()
  WHERE organization_id = org_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier les crédits disponibles
CREATE OR REPLACE FUNCTION check_available_credits(org_id UUID)
RETURNS INTEGER AS $$
DECLARE
  available INTEGER;
BEGIN
  SELECT (credits_total - credits_used)
  INTO available
  FROM lead_credits
  WHERE organization_id = org_id;

  RETURN COALESCE(available, 0);
END;
$$ LANGUAGE plpgsql;

-- ======================================
-- INSERTION DONNÉES INITIALES
-- ======================================

-- Créer des crédits pour toutes les organisations existantes
INSERT INTO lead_credits (organization_id, credits_total, credits_used)
SELECT id, 10, 0 FROM organizations
ON CONFLICT (organization_id) DO NOTHING;

-- ======================================
-- COMMENTAIRES TABLES
-- ======================================

COMMENT ON TABLE lead_credits IS 'Gestion des crédits de recherche de leads par organisation';
COMMENT ON TABLE lead_searches IS 'Historique des recherches de leads avec paramètres et résultats';
COMMENT ON TABLE lead_results IS 'Leads trouvés lors des recherches, avant import vers CRM';
COMMENT ON TABLE lead_stats IS 'Statistiques quotidiennes de l''activité lead scraping';

COMMENT ON COLUMN lead_credits.credits_total IS 'Total des crédits achetés/attribués';
COMMENT ON COLUMN lead_credits.credits_used IS 'Crédits consommés lors des recherches';
COMMENT ON COLUMN lead_searches.search_type IS 'Type de recherche: particulier ou entreprise';
COMMENT ON COLUMN lead_searches.status IS 'Statut de la recherche: pending, processing, completed, failed';
COMMENT ON COLUMN lead_results.confidence_score IS 'Score de confiance de la qualité du lead (0-100)';
COMMENT ON COLUMN lead_results.quality_score IS 'Score qualité calculé après validation (0-100)';