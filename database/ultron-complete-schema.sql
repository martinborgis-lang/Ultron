-- ULTRON SaaS DATABASE SCHEMA - Complete SQL Structure
-- Version: 2025-01-21
-- Architecture: Multi-tenant SaaS with Row Level Security (RLS)

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- MAIN TABLES (Organizations & Users)
-- =====================================================

-- Organizations (Enterprises)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR NOT NULL UNIQUE,

  -- Data mode configuration
  data_mode VARCHAR DEFAULT 'crm' CHECK (data_mode IN ('sheet', 'crm')), -- 'sheet' | 'crm'

  -- Google integrations
  google_sheet_id VARCHAR,
  google_credentials JSONB,

  -- Branding & UI
  logo_url VARCHAR,
  primary_color VARCHAR DEFAULT '#6366f1',

  -- Subscription
  plan VARCHAR DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),

  -- AI Prompts configuration
  prompt_qualification JSONB,
  prompt_synthese JSONB,
  prompt_rappel JSONB,
  prompt_plaquette JSONB,

  -- PDF Plaquette
  plaquette_id VARCHAR, -- Google Drive ID

  -- AI Scoring configuration
  scoring_config JSONB DEFAULT '{
    "seuil_chaud": 70,
    "seuil_tiede": 40,
    "poids_revenus": 25,
    "poids_analyse_ia": 50,
    "poids_patrimoine": 25,
    "seuil_revenus_max": 10000,
    "seuil_revenus_min": 2500,
    "seuil_patrimoine_max": 300000,
    "seuil_patrimoine_min": 30000
  }',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Users (Advisors/Admins)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE, -- Link with Supabase Auth
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identity
  email VARCHAR NOT NULL,
  full_name VARCHAR,
  role VARCHAR DEFAULT 'conseiller' CHECK (role IN ('admin', 'conseiller')),

  -- Google credentials (individual Gmail)
  gmail_credentials JSONB,

  -- Profile
  avatar_url VARCHAR,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PRODUCTS & COMMISSIONS SYSTEM
-- =====================================================

-- Products sold by the organization
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Product info
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL CHECK (type IN ('fixed', 'commission')), -- 'fixed' = fixed benefit, 'commission' = %

  -- For fixed benefit products (e.g., heat pump)
  fixed_value NUMERIC, -- Fixed price in euros

  -- For commission products (e.g., CGP)
  commission_rate NUMERIC, -- Commission percentage (e.g., 2.5 for 2.5%)

  -- Category for organization (optional)
  category VARCHAR,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_fixed_product CHECK (
    (type = 'fixed' AND fixed_value IS NOT NULL AND fixed_value > 0) OR
    type = 'commission'
  ),
  CONSTRAINT valid_commission_product CHECK (
    (type = 'commission' AND commission_rate IS NOT NULL AND commission_rate > 0 AND commission_rate <= 100) OR
    type = 'fixed'
  )
);

-- Advisor commissions (customizable per advisor/product)
CREATE TABLE IF NOT EXISTS advisor_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE, -- NULL = default commission

  commission_rate NUMERIC NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  is_default BOOLEAN DEFAULT false, -- Default commission for this advisor

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One commission per advisor per product
  UNIQUE(user_id, product_id),
  -- Only one default rate per advisor
  EXCLUDE (user_id WITH =) WHERE (is_default = true AND product_id IS NULL)
);

-- =====================================================
-- CRM TABLES
-- =====================================================

-- Pipeline stages (customizable per organization)
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Stage info
  name VARCHAR NOT NULL, -- "Nouveau", "Contacté", etc.
  slug VARCHAR NOT NULL, -- "nouveau", "contacte", etc.
  color VARCHAR DEFAULT '#6366f1',
  position INTEGER NOT NULL, -- Display order

  -- Stage behavior
  is_won BOOLEAN DEFAULT false,
  is_lost BOOLEAN DEFAULT false,
  default_probability INTEGER DEFAULT 50,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(organization_id, slug)
);

-- CRM Prospects
CREATE TABLE IF NOT EXISTS crm_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identity
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  company VARCHAR,
  job_title VARCHAR,
  address TEXT,
  city VARCHAR,
  postal_code VARCHAR,
  country VARCHAR DEFAULT 'France',

  -- Financial profile (CGP specific)
  patrimoine_estime NUMERIC,
  revenus_annuels NUMERIC,
  situation_familiale VARCHAR,
  nb_enfants INTEGER,
  age INTEGER,
  profession VARCHAR,

  -- Pipeline
  stage_id UUID REFERENCES pipeline_stages(id),
  stage_slug VARCHAR DEFAULT 'nouveau',
  deal_value NUMERIC,
  close_probability INTEGER DEFAULT 50,
  expected_close_date DATE,

  -- AI Qualification
  qualification VARCHAR DEFAULT 'non_qualifie' CHECK (qualification IN ('CHAUD', 'TIEDE', 'FROID', 'non_qualifie')),
  score_ia INTEGER CHECK (score_ia >= 0 AND score_ia <= 100),
  analyse_ia TEXT,
  derniere_qualification TIMESTAMPTZ,

  -- Products sold (calculated fields)
  total_commission_earned NUMERIC DEFAULT 0,
  products_sold INTEGER DEFAULT 0,

  -- Source & Attribution
  source VARCHAR,
  source_detail VARCHAR,
  assigned_to UUID REFERENCES users(id),
  tags TEXT[],
  notes TEXT,

  -- Final status
  lost_reason VARCHAR,
  won_date TIMESTAMPTZ,
  lost_date TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Deals with selected products
CREATE TABLE IF NOT EXISTS deal_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES crm_prospects(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Amounts
  client_amount NUMERIC NOT NULL CHECK (client_amount > 0), -- Client amount (e.g., 100k€ life insurance)
  company_revenue NUMERIC NOT NULL CHECK (company_revenue > 0), -- Company revenue
  advisor_commission NUMERIC DEFAULT 0 CHECK (advisor_commission >= 0), -- Advisor commission

  -- Automatic calculations
  commission_rate_used NUMERIC, -- Rate used for calculation
  advisor_commission_rate NUMERIC, -- Advisor rate used

  -- Metadata
  closed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- One prospect can have only one active deal
  UNIQUE(prospect_id)
);

-- CRM Activities (interactions history)
CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES crm_prospects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Activity info
  type VARCHAR NOT NULL CHECK (type IN ('note', 'call', 'email', 'meeting', 'task')),
  direction VARCHAR CHECK (direction IN ('inbound', 'outbound')),
  subject VARCHAR,
  content TEXT,

  -- Email specific
  email_status VARCHAR,
  email_opened_at TIMESTAMPTZ,
  email_opened_count INTEGER DEFAULT 0,

  -- Call/Meeting specific
  duration_minutes INTEGER,
  outcome VARCHAR,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CRM Events (Planning - bi-mode compatible)
CREATE TABLE IF NOT EXISTS crm_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Prospect linking (bi-mode)
  prospect_id UUID REFERENCES crm_prospects(id) ON DELETE CASCADE,
  prospect_sheet_id VARCHAR, -- For Sheet mode linkage
  prospect_name VARCHAR,

  -- Event info
  type VARCHAR DEFAULT 'task' CHECK (type IN ('task', 'call', 'meeting', 'reminder', 'email')),
  title VARCHAR NOT NULL,
  description TEXT,

  -- Timing
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,

  -- Status
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,

  -- Assignment
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),

  -- Priority
  priority VARCHAR DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Meeting links
  meet_link VARCHAR, -- Google Meet link
  calendar_link VARCHAR, -- Calendar reminder link

  -- External sync
  external_id VARCHAR, -- For Google Calendar sync
  external_source VARCHAR,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Legacy CRM Tasks (prefer crm_events)
CREATE TABLE IF NOT EXISTS crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES crm_prospects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),

  -- Task info
  title VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR DEFAULT 'task' CHECK (type IN ('task', 'call', 'email', 'meeting', 'follow_up')),
  priority VARCHAR DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Timing
  due_date TIMESTAMPTZ,
  reminder_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- MEETINGS & TRANSCRIPTION SYSTEM
-- =====================================================

-- Meeting Transcripts with AI Analysis
CREATE TABLE IF NOT EXISTS meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES crm_prospects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Meeting info
  meeting_date TIMESTAMPTZ DEFAULT now(),
  duration_seconds INTEGER,
  google_meet_link VARCHAR(500),

  -- Transcript data
  transcript_text TEXT,
  transcript_json JSONB, -- Array of TranscriptSegment with speakers

  -- AI Analysis
  ai_summary TEXT,
  key_points JSONB, -- Array of strings
  objections_detected JSONB, -- Array of ObjectionDetected
  next_actions JSONB, -- Array of strings

  -- PDF export
  pdf_url VARCHAR(500),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- EMAIL & COMMUNICATION TEMPLATES
-- =====================================================

-- Email Templates
CREATE TABLE IF NOT EXISTS crm_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),

  -- Template info
  name VARCHAR NOT NULL,
  subject VARCHAR NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR CHECK (category IN ('introduction', 'follow_up', 'proposal', 'closing', 'other')),

  -- Sharing
  is_shared BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Saved Filters
CREATE TABLE IF NOT EXISTS crm_saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Filter info
  name VARCHAR NOT NULL,
  filters JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ADMIN & ANALYTICS TABLES
-- =====================================================

-- Configurable Admin Thresholds
CREATE TABLE IF NOT EXISTS admin_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Threshold config
  metric_name VARCHAR NOT NULL, -- 'conversion_rate', 'activity_target', etc.
  threshold_value NUMERIC NOT NULL,
  threshold_type VARCHAR NOT NULL CHECK (threshold_type IN ('warning', 'critical')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Daily Statistics
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Prospect metrics
  total_prospects INTEGER DEFAULT 0,
  prospects_chaud INTEGER DEFAULT 0,
  prospects_tiede INTEGER DEFAULT 0,
  prospects_froid INTEGER DEFAULT 0,

  -- Activity metrics
  mails_envoyes INTEGER DEFAULT 0,
  rdv_pris INTEGER DEFAULT 0,

  -- Revenue metrics
  revenue_generated NUMERIC DEFAULT 0,
  commissions_paid NUMERIC DEFAULT 0,
  products_sold INTEGER DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(organization_id, date)
);

-- Activity Logs (enhanced)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),

  -- Action info
  action VARCHAR NOT NULL,
  entity_type VARCHAR, -- 'prospect', 'product', 'meeting', etc.
  entity_id UUID, -- ID of the concerned entity
  details JSONB,

  -- Tracking
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- AGENT & AUTOMATION SYSTEM
-- =====================================================

-- Agent Ideas
CREATE TABLE IF NOT EXISTS agent_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  source VARCHAR DEFAULT 'auto',
  priority INTEGER DEFAULT 50,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
  telegram_message_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agent Tasks
CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES agent_ideas(id) ON DELETE CASCADE,

  -- Task execution
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  prompt TEXT NOT NULL,

  -- Git integration
  branch_name VARCHAR,
  commit_hash VARCHAR,
  pr_url VARCHAR,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agent Runs
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  agent_type VARCHAR NOT NULL, -- 'qualification', 'email', 'analysis'
  trigger_event VARCHAR, -- Event trigger
  input_data JSONB, -- Input data
  output_data JSONB, -- Results

  -- Execution info
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  tokens_used INTEGER DEFAULT 0, -- AI tokens consumed
  duration_ms INTEGER, -- Execution duration
  error_message TEXT, -- Error message if failed

  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- SYSTEM & CONFIGURATION TABLES
-- =====================================================

-- System Settings (configurable per organization)
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  setting_key VARCHAR NOT NULL, -- 'ai_model', 'email_limits', 'features'
  setting_value JSONB NOT NULL, -- Configuration value
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(organization_id, setting_key)
);

-- Email Logs (tracking sent emails)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Recipient
  prospect_email VARCHAR,
  prospect_name VARCHAR,

  -- Email content
  email_type VARCHAR NOT NULL,
  subject TEXT,
  body TEXT,
  gmail_message_id VARCHAR,
  has_attachment BOOLEAN DEFAULT false,

  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduled Emails (legacy, replaced by QStash)
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Schedule info
  prospect_data JSONB NOT NULL,
  email_type VARCHAR NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,

  -- Status
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Prompts (AI prompts configuration)
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Prompt info
  type VARCHAR NOT NULL, -- 'qualification', 'synthese', 'rappel', 'plaquette'
  name VARCHAR NOT NULL,
  system_prompt TEXT,
  user_prompt TEXT,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_org_role ON users(organization_id, role);

-- Products & Commissions
CREATE INDEX IF NOT EXISTS idx_products_org_active ON products(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_advisor_commissions_user ON advisor_commissions(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_deal_products_advisor_date ON deal_products(advisor_id, closed_at);
CREATE INDEX IF NOT EXISTS idx_deal_products_org_date ON deal_products(organization_id, closed_at);

-- CRM Prospects
CREATE INDEX IF NOT EXISTS idx_crm_prospects_org_stage ON crm_prospects(organization_id, stage_slug);
CREATE INDEX IF NOT EXISTS idx_crm_prospects_assigned ON crm_prospects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_prospects_qualification ON crm_prospects(qualification);
CREATE INDEX IF NOT EXISTS idx_crm_prospects_updated ON crm_prospects(updated_at);

-- CRM Activities
CREATE INDEX IF NOT EXISTS idx_crm_activities_prospect ON crm_activities(prospect_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_user_date ON crm_activities(user_id, created_at);

-- CRM Events
CREATE INDEX IF NOT EXISTS idx_crm_events_org_date ON crm_events(organization_id, start_date);
CREATE INDEX IF NOT EXISTS idx_crm_events_assigned ON crm_events(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_events_prospect ON crm_events(prospect_id);

-- Meeting Transcripts
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_prospect ON meeting_transcripts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_org ON meeting_transcripts(organization_id);
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_user ON meeting_transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_date ON meeting_transcripts(meeting_date DESC);

-- Activity Logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_org_date ON activity_logs(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);

-- Daily Stats
CREATE INDEX IF NOT EXISTS idx_daily_stats_org_date ON daily_stats(organization_id, date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all main tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES (Example for main tables)
-- =====================================================

-- Users can only access their organization's data
CREATE POLICY "Users can access their organization data" ON organizations
  FOR ALL TO authenticated
  USING (id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can access their organization users" ON users
  FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can access their organization prospects" ON crm_prospects
  FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid()));

-- Admins can manage products
CREATE POLICY "Admins can manage products" ON products
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_id = auth.uid() AND role = 'admin'
  ));

-- Users can view organization products
CREATE POLICY "Users can view organization products" ON products
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE auth_id = auth.uid()
  ));

-- Meeting transcripts policies
CREATE POLICY "Users can view their organization meetings" ON meeting_transcripts
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can manage their own meetings" ON meeting_transcripts
  FOR ALL TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ));

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Function to automatically calculate deal revenue and commissions
CREATE OR REPLACE FUNCTION calculate_deal_revenue()
RETURNS TRIGGER AS $$
DECLARE
  product products%ROWTYPE;
  advisor_rate NUMERIC;
  default_rate NUMERIC;
BEGIN
  -- Get the product
  SELECT * INTO product FROM products WHERE id = NEW.product_id;

  IF product IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Calculate company revenue based on product type
  IF product.type = 'fixed' THEN
    NEW.company_revenue := product.fixed_value;
  ELSIF product.type = 'commission' THEN
    NEW.company_revenue := NEW.client_amount * (product.commission_rate / 100);
    NEW.commission_rate_used := product.commission_rate;
  END IF;

  -- Get advisor commission rate for this product
  SELECT commission_rate INTO advisor_rate
  FROM advisor_commissions
  WHERE user_id = NEW.advisor_id
    AND product_id = NEW.product_id;

  -- If no specific rate, get default rate for advisor
  IF advisor_rate IS NULL THEN
    SELECT commission_rate INTO default_rate
    FROM advisor_commissions
    WHERE user_id = NEW.advisor_id
      AND product_id IS NULL
      AND is_default = true;

    advisor_rate := COALESCE(default_rate, 0);
  END IF;

  -- Calculate advisor commission
  NEW.advisor_commission := NEW.company_revenue * (advisor_rate / 100);
  NEW.advisor_commission_rate := advisor_rate;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate deal revenue automatically
CREATE OR REPLACE TRIGGER trigger_calculate_deal_revenue
  BEFORE INSERT OR UPDATE ON deal_products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_deal_revenue();

-- Function to update prospect deal value
CREATE OR REPLACE FUNCTION sync_prospect_deal_value()
RETURNS TRIGGER AS $$
BEGIN
  -- Update deal value in crm_prospects
  UPDATE crm_prospects
  SET deal_value = NEW.company_revenue,
      updated_at = now()
  WHERE id = NEW.prospect_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync with crm_prospects
CREATE OR REPLACE TRIGGER trigger_sync_prospect_deal_value
  AFTER INSERT OR UPDATE ON deal_products
  FOR EACH ROW
  EXECUTE FUNCTION sync_prospect_deal_value();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER trigger_update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_update_crm_prospects_updated_at
  BEFORE UPDATE ON crm_prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert default pipeline stages for existing organizations
INSERT INTO pipeline_stages (organization_id, name, slug, color, position, is_won, is_lost)
SELECT
  o.id,
  stage_name,
  stage_slug,
  stage_color,
  stage_position,
  stage_won,
  stage_lost
FROM organizations o
CROSS JOIN (
  VALUES
    ('Nouveau', 'nouveau', '#6366f1', 0, false, false),
    ('En attente', 'en_attente', '#f59e0b', 1, false, false),
    ('RDV Pris', 'rdv_pris', '#10b981', 2, false, false),
    ('RDV Effectué', 'rdv_effectue', '#3b82f6', 3, false, false),
    ('Négociation', 'negociation', '#8b5cf6', 4, false, false),
    ('Gagné', 'gagne', '#22c55e', 5, true, false),
    ('Perdu', 'perdu', '#ef4444', 6, false, true)
) AS stages(stage_name, stage_slug, stage_color, stage_position, stage_won, stage_lost)
WHERE NOT EXISTS (
  SELECT 1 FROM pipeline_stages ps
  WHERE ps.organization_id = o.id AND ps.slug = stage_slug
);

-- Insert default products for CGP organizations
INSERT INTO products (organization_id, name, description, type, commission_rate, created_by)
SELECT
  o.id,
  'Assurance Vie',
  'Contrats d''assurance vie et capitalisation',
  'commission',
  2.0,
  NULL
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM products p
  WHERE p.organization_id = o.id AND p.name = 'Assurance Vie'
);

INSERT INTO products (organization_id, name, description, type, commission_rate, created_by)
SELECT
  o.id,
  'PEA',
  'Plan d''Épargne en Actions',
  'commission',
  1.5,
  NULL
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM products p
  WHERE p.organization_id = o.id AND p.name = 'PEA'
);

-- Insert default commission rates for existing advisors (10%)
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

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE organizations IS 'Multi-tenant organizations with configurable data modes';
COMMENT ON TABLE users IS 'Users (advisors/admins) with individual Gmail credentials';
COMMENT ON TABLE products IS 'Products sold by organizations with flexible commission models';
COMMENT ON TABLE advisor_commissions IS 'Customizable commission rates per advisor/product';
COMMENT ON TABLE deal_products IS 'Closed deals with automatic revenue/commission calculation';
COMMENT ON TABLE crm_prospects IS 'CRM prospects with AI qualification and financial profiling';
COMMENT ON TABLE crm_events IS 'Bi-mode compatible events and planning system';
COMMENT ON TABLE meeting_transcripts IS 'Meeting transcriptions with AI analysis and insights';
COMMENT ON TABLE admin_thresholds IS 'Configurable admin alerts and performance thresholds';
COMMENT ON TABLE daily_stats IS 'Daily aggregated statistics for analytics dashboards';
COMMENT ON TABLE agent_runs IS 'AI agent execution tracking for automation workflows';

COMMENT ON COLUMN organizations.data_mode IS 'Storage mode: sheet (Google Sheets) or crm (Supabase)';
COMMENT ON COLUMN organizations.scoring_config IS 'AI scoring algorithm configuration with weights and thresholds';
COMMENT ON COLUMN products.type IS 'Product type: fixed (fixed benefit) or commission (percentage-based)';
COMMENT ON COLUMN crm_events.prospect_sheet_id IS 'Sheet row ID for bi-mode compatibility';
COMMENT ON COLUMN meeting_transcripts.transcript_json IS 'Structured transcript with speaker identification';
COMMENT ON COLUMN deal_products.client_amount IS 'Amount invested by client (e.g., 100k€ life insurance)';
COMMENT ON COLUMN deal_products.company_revenue IS 'Revenue earned by company (calculated automatically)';

-- =====================================================
-- END OF SCHEMA
-- =====================================================