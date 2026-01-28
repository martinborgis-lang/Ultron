-- ═══════════════════════════════════════════════════════════════════════════════════
-- LINKEDIN AGENT - Base de données
-- Agent IA pour générer des posts LinkedIn professionnels pour CGP
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Configuration LinkedIn du cabinet
CREATE TABLE linkedin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identité cabinet
  cabinet_name VARCHAR(255),
  cabinet_description TEXT,
  cabinet_specialties TEXT[], -- ex: ['PER', 'Immobilier', 'Succession', 'Défiscalisation']
  cabinet_values TEXT, -- Valeurs, philosophie du cabinet
  cabinet_differentiators TEXT, -- Ce qui les différencie

  -- Chiffres clés (optionnels, pour crédibiliser)
  years_experience INTEGER,
  clients_count INTEGER,
  average_return DECIMAL(5,2), -- Rendement moyen en %
  assets_under_management DECIMAL(15,2), -- Encours sous gestion

  -- Contact et CTA
  website_url VARCHAR(500),
  booking_url VARCHAR(500), -- Lien de prise de RDV
  phone VARCHAR(50),

  -- Ton et style
  tone VARCHAR(50) DEFAULT 'professionnel', -- 'professionnel', 'decontracte', 'expert', 'accessible'
  target_audience TEXT, -- Description de la cible (entrepreneurs, cadres, retraités...)
  topics_to_avoid TEXT, -- Sujets à éviter

  -- Plaquette PDF
  brochure_url VARCHAR(500), -- URL du PDF stocké
  brochure_text TEXT, -- Texte extrait du PDF

  -- Préférences de publication
  posting_frequency VARCHAR(50) DEFAULT 'weekly', -- 'daily', 'weekly', 'biweekly'
  preferred_hashtags TEXT[], -- Hashtags favoris

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Historique des posts générés
CREATE TABLE linkedin_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),

  -- Contenu du post
  content TEXT NOT NULL,
  hook TEXT, -- L'accroche du post
  topic VARCHAR(255), -- Thème principal
  news_source VARCHAR(500), -- Source de l'actualité utilisée

  -- Média suggéré
  suggested_image_url VARCHAR(500),
  suggested_image_description TEXT,

  -- Métadonnées
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'approved', 'published', 'rejected'
  generated_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,

  -- Feedback
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_linkedin_config_org ON linkedin_config(organization_id);
CREATE INDEX idx_linkedin_posts_org ON linkedin_posts(organization_id);
CREATE INDEX idx_linkedin_posts_status ON linkedin_posts(status);
CREATE INDEX idx_linkedin_posts_created ON linkedin_posts(created_at DESC);
CREATE INDEX idx_linkedin_posts_topic ON linkedin_posts(topic);

-- Trigger pour updated_at
CREATE TRIGGER update_linkedin_config_updated_at
    BEFORE UPDATE ON linkedin_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE linkedin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_posts ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can manage their org linkedin config"
  ON linkedin_config FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can manage their org linkedin posts"
  ON linkedin_posts FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE auth_id = auth.uid()
  ));

-- Commentaires pour documentation
COMMENT ON TABLE linkedin_config IS 'Configuration des cabinets pour la génération de posts LinkedIn';
COMMENT ON TABLE linkedin_posts IS 'Historique des posts LinkedIn générés par l''IA';
COMMENT ON COLUMN linkedin_config.cabinet_specialties IS 'Array des spécialités du cabinet (PER, SCPI, etc.)';
COMMENT ON COLUMN linkedin_config.tone IS 'Ton de communication : professionnel, accessible, expert, decontracte';
COMMENT ON COLUMN linkedin_config.preferred_hashtags IS 'Array des hashtags favoris du cabinet';
COMMENT ON COLUMN linkedin_posts.hook IS 'Première ligne accrocheuse du post';
COMMENT ON COLUMN linkedin_posts.status IS 'Statut : draft, approved, published, rejected';