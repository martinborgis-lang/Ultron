-- ========================================
-- SCHÉMA AGENT IA AUTOMATIQUE VAPI.AI
-- ========================================

-- Configuration Agent IA par organisation
CREATE TABLE voice_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Configuration Vapi.ai
    vapi_api_key TEXT NOT NULL, -- Chiffré
    vapi_phone_number VARCHAR(20), -- Numéro acheté sur Vapi
    vapi_assistant_id UUID, -- ID assistant configuré

    -- Configuration Agent IA
    agent_name VARCHAR(100) DEFAULT 'Assistant Ultron',
    agent_voice VARCHAR(50) DEFAULT 'jennifer', -- Voix Vapi (jennifer, alex, etc.)
    agent_language VARCHAR(10) DEFAULT 'fr-FR',

    -- Horaires d'appel
    working_hours_start TIME DEFAULT '09:00',
    working_hours_end TIME DEFAULT '18:00',
    working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 1=Lundi, 7=Dimanche
    timezone VARCHAR(50) DEFAULT 'Europe/Paris',

    -- Scripts et prompts
    system_prompt TEXT DEFAULT 'Vous êtes un assistant commercial pour un cabinet de gestion de patrimoine. Votre objectif est de qualifier le prospect et prendre un rendez-vous.',
    qualification_questions JSONB DEFAULT '[
        "Quel est votre situation professionnelle actuelle ?",
        "Avez-vous déjà des placements ou investissements ?",
        "Quel serait votre budget disponible pour de nouveaux investissements ?",
        "Quand seriez-vous disponible pour un rendez-vous ?"
    ]',

    -- Configuration comportement
    max_call_duration_seconds INTEGER DEFAULT 300, -- 5 minutes max
    retry_on_no_answer BOOLEAN DEFAULT true,
    max_retry_attempts INTEGER DEFAULT 2,
    delay_between_retries_minutes INTEGER DEFAULT 60,

    -- Webhook configuration
    webhook_url VARCHAR(500), -- URL pour recevoir events Vapi
    webhook_secret VARCHAR(100), -- Secret pour sécuriser webhook

    -- État
    is_enabled BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(organization_id)
);

-- Appels téléphoniques effectués
CREATE TABLE phone_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    prospect_id UUID REFERENCES crm_prospects(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Conseiller assigné

    -- Numéros de téléphone
    from_number VARCHAR(20), -- Numéro Vapi utilisé
    to_number VARCHAR(20) NOT NULL, -- Numéro prospect

    -- Identification Vapi
    vapi_call_id VARCHAR(100) UNIQUE, -- ID call Vapi
    vapi_assistant_id VARCHAR(100), -- ID assistant utilisé

    -- État de l'appel
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN (
        'queued',      -- En file d'attente
        'ringing',     -- En cours de sonnerie
        'in_progress', -- En cours
        'completed',   -- Terminé
        'failed',      -- Échoué
        'no_answer',   -- Pas de réponse
        'busy',        -- Occupé
        'cancelled'    -- Annulé
    )),

    -- Timing
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,

    -- Résultats conversation
    transcript_text TEXT,
    transcript_json JSONB, -- Transcription détaillée avec timestamps

    -- Qualification IA
    qualification_score INTEGER CHECK (qualification_score >= 0 AND qualification_score <= 100),
    qualification_result VARCHAR(20) CHECK (qualification_result IN ('CHAUD', 'TIEDE', 'FROID', 'NON_QUALIFIE')),
    qualification_notes TEXT,

    -- Résultat commercial
    outcome VARCHAR(20) DEFAULT 'unknown' CHECK (outcome IN (
        'appointment_booked', -- RDV pris
        'callback_requested', -- Rappel demandé
        'not_interested',     -- Pas intéressé
        'wrong_number',       -- Mauvais numéro
        'unknown'            -- Inconnu
    )),

    -- RDV pris
    appointment_date TIMESTAMPTZ,
    appointment_duration_minutes INTEGER DEFAULT 60,
    appointment_notes TEXT,

    -- Analytics
    cost_cents INTEGER, -- Coût en centimes
    answered BOOLEAN DEFAULT false,
    client_satisfaction_rating INTEGER CHECK (client_satisfaction_rating >= 1 AND client_satisfaction_rating <= 5),

    -- Métadonnées
    source VARCHAR(50), -- 'webhook', 'manual', 'campaign'
    campaign_id UUID, -- Pour tracking campagnes
    retry_count INTEGER DEFAULT 0,
    parent_call_id UUID REFERENCES phone_calls(id), -- Si retry

    -- Enregistrement audio
    recording_url VARCHAR(500), -- URL Vapi de l'enregistrement
    recording_duration_seconds INTEGER,

    -- Erreurs
    error_message TEXT,
    error_code VARCHAR(50),

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Scripts de conversation configurables
CREATE TABLE voice_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Identification
    name VARCHAR(100) NOT NULL,
    description TEXT,
    script_type VARCHAR(20) DEFAULT 'qualification' CHECK (script_type IN (
        'qualification',  -- Script qualification
        'appointment',    -- Script prise RDV
        'callback',      -- Script rappel
        'followup'       -- Script suivi
    )),

    -- Contenu script
    opening_message TEXT NOT NULL, -- Message d'ouverture
    questions JSONB, -- Questions structurées
    closing_message TEXT, -- Message de fermeture

    -- Configuration comportement
    max_duration_seconds INTEGER DEFAULT 300,
    interrupt_sensitive BOOLEAN DEFAULT true, -- Peut être interrompu

    -- État
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(10) DEFAULT '1.0',

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(organization_id, name)
);

-- Webhooks reçus de formulaires/sites web
CREATE TABLE voice_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Source webhook
    source VARCHAR(50) NOT NULL, -- 'contact_form', 'landing_page', 'facebook_lead'
    webhook_url VARCHAR(500), -- URL d'origine

    -- Données prospect
    prospect_data JSONB NOT NULL, -- Toutes les données reçues
    phone_number VARCHAR(20), -- Extrait des données
    email VARCHAR(255), -- Extrait des données
    name VARCHAR(200), -- Extrait des données

    -- Traitement
    processed BOOLEAN DEFAULT false,
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN (
        'pending',    -- En attente
        'processing', -- En cours de traitement
        'completed',  -- Traité avec succès
        'failed',     -- Échec traitement
        'skipped'     -- Ignoré (hors horaires, numéro invalide, etc.)
    )),

    -- Résultats traitement
    prospect_created_id UUID REFERENCES crm_prospects(id),
    call_created_id UUID REFERENCES phone_calls(id),
    processing_notes TEXT,
    error_message TEXT,

    -- Timing
    processed_at TIMESTAMPTZ,
    scheduled_call_at TIMESTAMPTZ, -- Quand l'appel est programmé

    -- Métadonnées
    ip_address INET,
    user_agent TEXT,
    referer VARCHAR(500),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Statistiques quotidiennes Agent IA
CREATE TABLE voice_daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Appels
    total_calls INTEGER DEFAULT 0,
    successful_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    no_answer_calls INTEGER DEFAULT 0,

    -- Résultats
    appointments_booked INTEGER DEFAULT 0,
    qualified_prospects INTEGER DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,

    -- Coûts
    total_cost_cents INTEGER DEFAULT 0,
    average_cost_per_call_cents INTEGER DEFAULT 0,

    -- Qualité
    average_qualification_score NUMERIC,
    average_satisfaction_rating NUMERIC,

    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(organization_id, date)
);

-- Créer les index pour performance
CREATE INDEX idx_voice_config_org ON voice_config(organization_id);
CREATE INDEX idx_phone_calls_org ON phone_calls(organization_id);
CREATE INDEX idx_phone_calls_prospect ON phone_calls(prospect_id);
CREATE INDEX idx_phone_calls_status ON phone_calls(status);
CREATE INDEX idx_phone_calls_created_at ON phone_calls(created_at);
CREATE INDEX idx_phone_calls_vapi_id ON phone_calls(vapi_call_id);
CREATE INDEX idx_voice_scripts_org ON voice_scripts(organization_id);
CREATE INDEX idx_voice_webhooks_org ON voice_webhooks(organization_id);
CREATE INDEX idx_voice_webhooks_processed ON voice_webhooks(processed);
CREATE INDEX idx_voice_webhooks_phone ON voice_webhooks(phone_number);
CREATE INDEX idx_voice_daily_stats_org_date ON voice_daily_stats(organization_id, date);

-- Activer RLS sur toutes les tables
ALTER TABLE voice_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_daily_stats ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view their organization voice_config" ON voice_config
    FOR SELECT USING (organization_id IN (SELECT id FROM organizations WHERE id = auth.jwt() ->> 'organization_id'));

CREATE POLICY "Admins can manage their organization voice_config" ON voice_config
    FOR ALL USING (organization_id IN (
        SELECT o.id FROM organizations o
        JOIN users u ON u.organization_id = o.id
        WHERE u.auth_id = auth.uid() AND u.role = 'admin'
    ));

CREATE POLICY "Users can view their organization phone_calls" ON phone_calls
    FOR SELECT USING (organization_id IN (SELECT id FROM organizations WHERE id = auth.jwt() ->> 'organization_id'));

CREATE POLICY "Users can manage their organization phone_calls" ON phone_calls
    FOR ALL USING (organization_id IN (
        SELECT u.organization_id FROM users u WHERE u.auth_id = auth.uid()
    ));

CREATE POLICY "Users can view their organization voice_scripts" ON voice_scripts
    FOR SELECT USING (organization_id IN (SELECT id FROM organizations WHERE id = auth.jwt() ->> 'organization_id'));

CREATE POLICY "Users can manage their organization voice_scripts" ON voice_scripts
    FOR ALL USING (organization_id IN (
        SELECT u.organization_id FROM users u WHERE u.auth_id = auth.uid()
    ));

CREATE POLICY "Users can view their organization voice_webhooks" ON voice_webhooks
    FOR SELECT USING (organization_id IN (SELECT id FROM organizations WHERE id = auth.jwt() ->> 'organization_id'));

CREATE POLICY "Users can manage their organization voice_webhooks" ON voice_webhooks
    FOR ALL USING (organization_id IN (
        SELECT u.organization_id FROM users u WHERE u.auth_id = auth.uid()
    ));

CREATE POLICY "Users can view their organization voice_daily_stats" ON voice_daily_stats
    FOR SELECT USING (organization_id IN (SELECT id FROM organizations WHERE id = auth.jwt() ->> 'organization_id'));

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_voice()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_voice_config_updated_at
    BEFORE UPDATE ON voice_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_voice();

CREATE TRIGGER update_phone_calls_updated_at
    BEFORE UPDATE ON phone_calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_voice();

CREATE TRIGGER update_voice_scripts_updated_at
    BEFORE UPDATE ON voice_scripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_voice();

CREATE TRIGGER update_voice_webhooks_updated_at
    BEFORE UPDATE ON voice_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_voice();

-- Fonction pour chiffrer les API keys
CREATE OR REPLACE FUNCTION encrypt_vapi_key(api_key TEXT)
RETURNS TEXT AS $$
BEGIN
    -- En production, utiliser pg_crypto ou un service externe
    -- Pour dev, on stocke en clair (à changer en prod)
    RETURN api_key;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour déchiffrer les API keys
CREATE OR REPLACE FUNCTION decrypt_vapi_key(encrypted_key TEXT)
RETURNS TEXT AS $$
BEGIN
    -- En production, utiliser pg_crypto ou un service externe
    -- Pour dev, on lit en clair (à changer en prod)
    RETURN encrypted_key;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les stats quotidiennes
CREATE OR REPLACE FUNCTION update_voice_daily_stats(org_id UUID, stat_date DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO voice_daily_stats (organization_id, date,
        total_calls, successful_calls, failed_calls, no_answer_calls,
        appointments_booked, qualified_prospects, total_duration_minutes,
        total_cost_cents, average_cost_per_call_cents,
        average_qualification_score, average_satisfaction_rating
    )
    SELECT
        org_id,
        stat_date,
        COUNT(*) as total_calls,
        COUNT(*) FILTER (WHERE status = 'completed' AND answered = true) as successful_calls,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_calls,
        COUNT(*) FILTER (WHERE status = 'no_answer') as no_answer_calls,
        COUNT(*) FILTER (WHERE outcome = 'appointment_booked') as appointments_booked,
        COUNT(*) FILTER (WHERE qualification_result IN ('CHAUD', 'TIEDE')) as qualified_prospects,
        SUM(COALESCE(duration_seconds, 0)) / 60 as total_duration_minutes,
        SUM(COALESCE(cost_cents, 0)) as total_cost_cents,
        CASE WHEN COUNT(*) > 0 THEN SUM(COALESCE(cost_cents, 0)) / COUNT(*) ELSE 0 END as average_cost_per_call_cents,
        AVG(qualification_score) as average_qualification_score,
        AVG(client_satisfaction_rating) as average_satisfaction_rating
    FROM phone_calls
    WHERE organization_id = org_id
    AND DATE(created_at) = stat_date
    ON CONFLICT (organization_id, date)
    DO UPDATE SET
        total_calls = EXCLUDED.total_calls,
        successful_calls = EXCLUDED.successful_calls,
        failed_calls = EXCLUDED.failed_calls,
        no_answer_calls = EXCLUDED.no_answer_calls,
        appointments_booked = EXCLUDED.appointments_booked,
        qualified_prospects = EXCLUDED.qualified_prospects,
        total_duration_minutes = EXCLUDED.total_duration_minutes,
        total_cost_cents = EXCLUDED.total_cost_cents,
        average_cost_per_call_cents = EXCLUDED.average_cost_per_call_cents,
        average_qualification_score = EXCLUDED.average_qualification_score,
        average_satisfaction_rating = EXCLUDED.average_satisfaction_rating;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les stats lors d'un appel
CREATE OR REPLACE FUNCTION trigger_update_voice_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour les stats du jour
    PERFORM update_voice_daily_stats(NEW.organization_id, DATE(NEW.created_at));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_voice_stats_on_call
    AFTER INSERT OR UPDATE ON phone_calls
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_voice_daily_stats();

-- Commentaires sur les tables
COMMENT ON TABLE voice_config IS 'Configuration Agent IA par organisation avec paramètres Vapi.ai';
COMMENT ON TABLE phone_calls IS 'Historique des appels téléphoniques automatiques avec résultats IA';
COMMENT ON TABLE voice_scripts IS 'Scripts de conversation configurables pour différents scénarios';
COMMENT ON TABLE voice_webhooks IS 'Webhooks reçus de formulaires web déclenchant des appels automatiques';
COMMENT ON TABLE voice_daily_stats IS 'Statistiques quotidiennes performance Agent IA';

COMMENT ON COLUMN voice_config.vapi_api_key IS 'Clé API Vapi.ai chiffrée';
COMMENT ON COLUMN voice_config.qualification_questions IS 'Questions de qualification format JSON array';
COMMENT ON COLUMN phone_calls.transcript_json IS 'Transcription détaillée avec timestamps et speakers';
COMMENT ON COLUMN phone_calls.qualification_score IS 'Score de qualification IA de 0 à 100';
COMMENT ON COLUMN voice_webhooks.prospect_data IS 'Données brutes du prospect reçues via webhook';