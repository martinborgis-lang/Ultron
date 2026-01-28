-- Migration pour le système de Voice Click-to-Call avec Twilio
-- Date: 2025-01-28
-- Description: Ajoute la table voice_calls pour gérer l'historique des appels avec transcription et analyse IA

-- =====================================================
-- TABLE VOICE_CALLS
-- =====================================================

CREATE TABLE IF NOT EXISTS voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Prospect lié à l'appel (peut être NULL pour appels externes)
  prospect_id UUID REFERENCES crm_prospects(id) ON DELETE SET NULL,
  prospect_name VARCHAR, -- Nom au moment de l'appel (peut changer)

  -- Informations appel
  twilio_call_sid VARCHAR NOT NULL, -- SID unique Twilio
  phone_number VARCHAR NOT NULL,
  direction VARCHAR NOT NULL CHECK (direction IN ('inbound', 'outbound')),

  -- Statut et timing
  status VARCHAR NOT NULL DEFAULT 'initiated' CHECK (status IN (
    'initiated', 'ringing', 'in-progress', 'completed',
    'failed', 'busy', 'no-answer', 'canceled'
  )),
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Enregistrement audio
  recording_sid VARCHAR, -- SID enregistrement Twilio
  recording_url VARCHAR,
  recording_status VARCHAR CHECK (recording_status IN (
    'in-progress', 'paused', 'stopped', 'completed', 'failed'
  )),
  recording_duration_seconds INTEGER,
  recording_channels INTEGER DEFAULT 1,

  -- Transcription automatique
  transcript TEXT, -- Transcription complète
  transcript_confidence NUMERIC CHECK (transcript_confidence >= 0 AND transcript_confidence <= 1),
  transcription_status VARCHAR DEFAULT 'not_started' CHECK (transcription_status IN (
    'not_started', 'processing', 'completed', 'failed'
  )),
  transcription_processed_at TIMESTAMPTZ,
  transcription_error TEXT,

  -- Analyse IA avancée
  ai_summary TEXT, -- Résumé intelligent de l'appel
  ai_key_points TEXT[], -- Points clés extraits
  ai_next_actions TEXT[], -- Prochaines actions recommandées
  ai_objections TEXT[], -- Objections détectées
  ai_outcome VARCHAR, -- Résultat analysé par IA

  -- Analyse sentiment
  sentiment_overall VARCHAR CHECK (sentiment_overall IN ('positive', 'negative', 'neutral')),
  sentiment_score NUMERIC CHECK (sentiment_score >= -1 AND sentiment_score <= 1),

  -- Notes et résultat manuel
  outcome VARCHAR, -- Résultat saisi par l'utilisateur
  notes TEXT,

  -- Métadonnées
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Contraintes
  UNIQUE(twilio_call_sid), -- Un SID Twilio unique

  -- Index pour performance
  CHECK (duration_seconds >= 0),
  CHECK (recording_duration_seconds >= 0)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_voice_calls_org_user ON voice_calls(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_prospect ON voice_calls(prospect_id) WHERE prospect_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_voice_calls_created_at ON voice_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_calls_twilio_sid ON voice_calls(twilio_call_sid);
CREATE INDEX IF NOT EXISTS idx_voice_calls_status ON voice_calls(status);
CREATE INDEX IF NOT EXISTS idx_voice_calls_phone ON voice_calls(phone_number);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;

-- Politique RLS: Les utilisateurs ne peuvent voir que les appels de leur organisation
CREATE POLICY "voice_calls_org_policy" ON voice_calls
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id
      FROM users
      WHERE auth_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_voice_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_voice_calls_updated_at_trigger
  BEFORE UPDATE ON voice_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_calls_updated_at();

-- =====================================================
-- FONCTIONS HELPER
-- =====================================================

-- Fonction pour obtenir les statistiques d'appels pour une organisation
CREATE OR REPLACE FUNCTION get_voice_calls_stats(
  p_organization_id UUID,
  p_period_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_calls BIGINT,
  completed_calls BIGINT,
  total_duration BIGINT,
  avg_duration NUMERIC,
  successful_calls BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH call_data AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      SUM(duration_seconds) FILTER (WHERE status = 'completed') as total_dur,
      COUNT(*) FILTER (WHERE ai_outcome IN ('rdv_pris', 'callback_demande', 'information_demandee')) as successful
    FROM voice_calls
    WHERE organization_id = p_organization_id
      AND created_at >= (NOW() - INTERVAL '1 day' * p_period_days)
  )
  SELECT
    cd.total,
    cd.completed,
    COALESCE(cd.total_dur, 0),
    CASE WHEN cd.completed > 0 THEN cd.total_dur::NUMERIC / cd.completed ELSE 0 END,
    cd.successful,
    CASE WHEN cd.total > 0 THEN (cd.successful::NUMERIC / cd.total) * 100 ELSE 0 END
  FROM call_data cd;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE voice_calls IS 'Historique des appels Voice avec Twilio, transcription et analyse IA';
COMMENT ON COLUMN voice_calls.twilio_call_sid IS 'SID unique Twilio pour cet appel';
COMMENT ON COLUMN voice_calls.transcript IS 'Transcription complète de l\'appel (Deepgram)';
COMMENT ON COLUMN voice_calls.ai_summary IS 'Résumé intelligent généré par Claude';
COMMENT ON COLUMN voice_calls.ai_outcome IS 'Résultat de l\'appel analysé par IA';
COMMENT ON COLUMN voice_calls.sentiment_overall IS 'Sentiment général de l\'appel (positive/negative/neutral)';

-- Fin de migration