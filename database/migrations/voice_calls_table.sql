-- Migration: Création de la table voice_calls pour le système Click-to-Call

-- Table pour les appels téléphoniques WebRTC
CREATE TABLE IF NOT EXISTS voice_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    prospect_id UUID REFERENCES crm_prospects(id) ON DELETE SET NULL,

    -- Identifiant Twilio
    twilio_call_sid VARCHAR(100) UNIQUE,

    -- Détails de l'appel
    phone_number VARCHAR(20) NOT NULL,
    prospect_name VARCHAR(200),
    direction VARCHAR(20) DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),

    -- Statut et timing
    status VARCHAR(20) DEFAULT 'initiated' CHECK (status IN (
        'initiated', 'ringing', 'answered', 'in-progress', 'completed', 'failed', 'no-answer', 'busy', 'cancelled'
    )),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,

    -- Résultats de l'appel
    outcome VARCHAR(50),
    notes TEXT,
    next_action VARCHAR(100),

    -- Enregistrement
    recording_url VARCHAR(500),

    -- Coûts
    cost_cents INTEGER DEFAULT 0,

    -- Métadonnées
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_voice_calls_organization_id ON voice_calls(organization_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_user_id ON voice_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_prospect_id ON voice_calls(prospect_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_twilio_sid ON voice_calls(twilio_call_sid);
CREATE INDEX IF NOT EXISTS idx_voice_calls_created_at ON voice_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_calls_status ON voice_calls(status);

-- RLS (Row Level Security)
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs ne peuvent voir que les appels de leur organisation
CREATE POLICY voice_calls_select_policy ON voice_calls
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users
            WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY voice_calls_insert_policy ON voice_calls
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users
            WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY voice_calls_update_policy ON voice_calls
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM users
            WHERE auth_id = auth.uid()
        )
    );

-- Trigger pour la mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_voice_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_voice_calls_updated_at
    BEFORE UPDATE ON voice_calls
    FOR EACH ROW
    EXECUTE FUNCTION update_voice_calls_updated_at();

-- Commentaires pour la documentation
COMMENT ON TABLE voice_calls IS 'Historique des appels téléphoniques WebRTC via Twilio';
COMMENT ON COLUMN voice_calls.twilio_call_sid IS 'Identifiant unique Twilio pour l''appel';
COMMENT ON COLUMN voice_calls.direction IS 'Direction de l''appel: inbound (entrant) ou outbound (sortant)';
COMMENT ON COLUMN voice_calls.outcome IS 'Résultat de l''appel: rdv_pris, callback_demande, pas_interesse, etc.';
COMMENT ON COLUMN voice_calls.cost_cents IS 'Coût de l''appel en centimes d''euro';