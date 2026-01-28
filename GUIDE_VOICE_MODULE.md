# 📞 GUIDE MODULE VOICE - Fonctionnalités d'Appel

## 🎯 Fonctionnalités Implémentées

1. **Click-to-Call WebRTC** avec Twilio
2. **Agent IA Vocal** automatisé (VAPI)
3. **Transcription automatique** avec analyse IA
4. **Dashboard appels** avec statistiques
5. **Webhooks Twilio** pour suivi temps réel

---

## 🗄️ Tables Supabase Nécessaires

### 1. Table `voice_calls` - Historique des appels

```sql
CREATE TABLE voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES crm_prospects(id) ON DELETE SET NULL,

  -- Identifiants Twilio
  twilio_call_sid VARCHAR UNIQUE,
  twilio_conference_sid VARCHAR,

  -- Info appel
  type VARCHAR NOT NULL DEFAULT 'click_to_call' CHECK (type IN ('click_to_call', 'ai_agent', 'inbound')),
  direction VARCHAR NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  status VARCHAR DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'in-progress', 'completed', 'failed', 'no-answer')),

  -- Participants
  from_number VARCHAR,
  to_number VARCHAR NOT NULL,
  prospect_name VARCHAR,

  -- Timing
  initiated_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,

  -- Enregistrement
  recording_url VARCHAR,
  recording_sid VARCHAR,
  recording_status VARCHAR,
  recording_duration_seconds INTEGER,
  recording_channels INTEGER DEFAULT 1,

  -- Transcription et IA
  transcript TEXT,
  transcript_confidence NUMERIC,
  transcription_status VARCHAR DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  transcription_processed_at TIMESTAMPTZ,
  transcription_error TEXT,

  -- Analyse IA
  ai_summary TEXT,
  ai_key_points JSONB DEFAULT '[]',
  ai_next_actions JSONB DEFAULT '[]',
  ai_objections JSONB DEFAULT '[]',
  ai_outcome VARCHAR,
  sentiment_overall VARCHAR CHECK (sentiment_overall IN ('positive', 'negative', 'neutral')),
  sentiment_score NUMERIC,

  -- Métadonnées
  call_notes TEXT,
  outcome VARCHAR, -- 'rdv_pris', 'pas_interesse', 'callback_demande', etc.
  next_action VARCHAR,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_voice_calls_org_user ON voice_calls(organization_id, user_id);
CREATE INDEX idx_voice_calls_prospect ON voice_calls(prospect_id);
CREATE INDEX idx_voice_calls_twilio_sid ON voice_calls(twilio_call_sid);
CREATE INDEX idx_voice_calls_status ON voice_calls(status);
CREATE INDEX idx_voice_calls_date ON voice_calls(initiated_at);

-- RLS
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organization calls" ON voice_calls
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own organization calls" ON voice_calls
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own organization calls" ON voice_calls
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );
```

### 2. Table `voice_config` - Configuration voice par organisation

```sql
CREATE TABLE voice_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Configuration générale
  is_enabled BOOLEAN DEFAULT false,
  twilio_configured BOOLEAN DEFAULT false,

  -- Agent IA (VAPI)
  ai_agent_enabled BOOLEAN DEFAULT false,
  ai_agent_name VARCHAR DEFAULT 'Assistant IA',
  ai_agent_voice VARCHAR DEFAULT 'alloy',
  ai_agent_language VARCHAR DEFAULT 'fr',
  ai_agent_prompt TEXT,

  -- Click-to-call
  click_to_call_enabled BOOLEAN DEFAULT true,
  auto_recording BOOLEAN DEFAULT true,
  auto_transcription BOOLEAN DEFAULT true,

  -- Webhooks
  webhook_url VARCHAR,
  webhook_events JSONB DEFAULT '["call.started", "call.ended", "recording.completed"]',

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(organization_id)
);

-- RLS
ALTER TABLE voice_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can manage own voice config" ON voice_config
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );
```

### 3. Table `voice_scripts` - Scripts pour agent IA

```sql
CREATE TABLE voice_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name VARCHAR NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR DEFAULT 'prospection' CHECK (type IN ('prospection', 'qualification', 'suivi', 'custom')),

  -- Variables dynamiques supportées
  variables JSONB DEFAULT '[]', -- ['prospect_name', 'company', 'last_interaction']

  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE voice_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can manage own scripts" ON voice_scripts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );
```

---

## 🚀 Test du Module Voice

### Étape 1: Configuration Initiale

#### 1.1 Vérifier les tables existent

```sql
-- Vérifier que les tables sont créées
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('voice_calls', 'voice_config', 'voice_scripts');
```

#### 1.2 Créer configuration voice pour votre organisation

```sql
-- Remplacez 'YOUR_ORG_ID' par l'ID de votre organisation
INSERT INTO voice_config (
  organization_id,
  is_enabled,
  ai_agent_enabled,
  ai_agent_name,
  ai_agent_prompt,
  click_to_call_enabled,
  auto_recording,
  auto_transcription
) VALUES (
  'YOUR_ORG_ID',
  true,
  true,
  'Assistant CGP',
  'Vous êtes un assistant pour un cabinet de gestion de patrimoine. Votre rôle est de qualifier les prospects et de prendre des rendez-vous. Soyez professionnel, courtois et à l''écoute.',
  true,
  true,
  true
) ON CONFLICT (organization_id)
DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  ai_agent_enabled = EXCLUDED.ai_agent_enabled,
  updated_at = now();
```

#### 1.3 Créer un script type

```sql
-- Script de prospection basique
INSERT INTO voice_scripts (
  organization_id,
  name,
  content,
  type,
  variables,
  created_by
) VALUES (
  'YOUR_ORG_ID',
  'Script Prospection CGP',
  'Bonjour {prospect_name}, je vous contacte de la part de {company}. Nous aidons nos clients à optimiser leur patrimoine financier. Auriez-vous quelques minutes pour échanger sur votre situation patrimoniale ?',
  'prospection',
  '["prospect_name", "company"]'::jsonb,
  'YOUR_USER_ID'
);
```

### Étape 2: Test Click-to-Call

#### 2.1 Accéder à l'interface

1. **URL**: `http://localhost:3000/prospects`
2. **Cliquer** sur l'icône téléphone d'un prospect
3. **Vérifier** que le widget d'appel s'ouvre

#### 2.2 Vérifier les données en base pendant l'appel

```sql
-- Voir les appels en cours
SELECT
  id,
  twilio_call_sid,
  prospect_name,
  status,
  duration_seconds,
  initiated_at
FROM voice_calls
WHERE organization_id = 'YOUR_ORG_ID'
AND status IN ('initiated', 'ringing', 'in-progress')
ORDER BY initiated_at DESC;
```

#### 2.3 Vérifier l'historique après l'appel

```sql
-- Historique complet des appels
SELECT
  vc.*,
  p.first_name,
  p.last_name,
  u.full_name as caller_name
FROM voice_calls vc
LEFT JOIN crm_prospects p ON vc.prospect_id = p.id
LEFT JOIN users u ON vc.user_id = u.id
WHERE vc.organization_id = 'YOUR_ORG_ID'
ORDER BY vc.initiated_at DESC
LIMIT 20;
```

### Étape 3: Test Agent IA

#### 3.1 Accéder à l'interface Agent IA

1. **URL**: `http://localhost:3000/voice/ai-agent`
2. **Vérifier** la configuration agent
3. **Créer une campagne** de test

#### 3.2 Vérifier les appels automatiques

```sql
-- Appels générés par l'agent IA
SELECT
  id,
  type,
  prospect_name,
  status,
  ai_outcome,
  ai_summary,
  initiated_at
FROM voice_calls
WHERE organization_id = 'YOUR_ORG_ID'
AND type = 'ai_agent'
ORDER BY initiated_at DESC;
```

#### 3.3 Analyser les résultats IA

```sql
-- Analyse des résultats par l'agent IA
SELECT
  prospect_name,
  ai_outcome,
  ai_summary,
  ai_key_points,
  sentiment_overall,
  sentiment_score
FROM voice_calls
WHERE organization_id = 'YOUR_ORG_ID'
AND ai_summary IS NOT NULL
ORDER BY initiated_at DESC;
```

### Étape 4: Test Transcription

#### 4.1 Vérifier les transcriptions

```sql
-- Appels avec transcription
SELECT
  id,
  prospect_name,
  transcription_status,
  transcript_confidence,
  LENGTH(transcript) as transcript_length,
  transcription_processed_at
FROM voice_calls
WHERE organization_id = 'YOUR_ORG_ID'
AND transcription_status = 'completed'
ORDER BY transcription_processed_at DESC;
```

#### 4.2 Voir une transcription complète

```sql
-- Transcription détaillée d'un appel spécifique
SELECT
  prospect_name,
  transcript,
  ai_summary,
  ai_key_points,
  ai_objections,
  ai_next_actions,
  sentiment_overall
FROM voice_calls
WHERE id = 'CALL_ID_HERE';
```

### Étape 5: Dashboard Statistiques

#### 5.1 Interface dashboard

1. **URL**: `http://localhost:3000/voice/calls`
2. **Vérifier** les statistiques affichées

#### 5.2 Requêtes pour les stats

```sql
-- Statistiques globales des appels
SELECT
  COUNT(*) as total_calls,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_calls,
  COUNT(CASE WHEN ai_outcome = 'rdv_pris' THEN 1 END) as rdv_pris,
  ROUND(AVG(duration_seconds), 0) as avg_duration,
  COUNT(CASE WHEN transcription_status = 'completed' THEN 1 END) as transcribed_calls
FROM voice_calls
WHERE organization_id = 'YOUR_ORG_ID'
AND initiated_at >= CURRENT_DATE - INTERVAL '30 days';
```

```sql
-- Appels par jour (30 derniers jours)
SELECT
  DATE(initiated_at) as date,
  COUNT(*) as total_calls,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN ai_outcome IN ('rdv_pris', 'interessé') THEN 1 END) as positive_outcome
FROM voice_calls
WHERE organization_id = 'YOUR_ORG_ID'
AND initiated_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(initiated_at)
ORDER BY date;
```

```sql
-- Performance par utilisateur
SELECT
  u.full_name,
  COUNT(vc.*) as total_calls,
  COUNT(CASE WHEN vc.status = 'completed' THEN 1 END) as completed_calls,
  COUNT(CASE WHEN vc.ai_outcome = 'rdv_pris' THEN 1 END) as rdv_pris,
  ROUND(AVG(vc.duration_seconds), 0) as avg_duration
FROM voice_calls vc
JOIN users u ON vc.user_id = u.id
WHERE vc.organization_id = 'YOUR_ORG_ID'
AND vc.initiated_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id, u.full_name
ORDER BY total_calls DESC;
```

---

## 🔧 Dépannage

### Problèmes courants

#### 1. Appels ne se lancent pas

```sql
-- Vérifier configuration Twilio
SELECT * FROM voice_config WHERE organization_id = 'YOUR_ORG_ID';

-- Vérifier si les appels sont créés en base
SELECT * FROM voice_calls
WHERE organization_id = 'YOUR_ORG_ID'
ORDER BY created_at DESC LIMIT 5;
```

#### 2. Transcription ne fonctionne pas

```sql
-- Vérifier le statut des transcriptions
SELECT
  id,
  twilio_call_sid,
  transcription_status,
  transcription_error,
  recording_url
FROM voice_calls
WHERE organization_id = 'YOUR_ORG_ID'
AND transcription_status = 'failed'
ORDER BY created_at DESC;
```

#### 3. Agent IA ne répond pas

```sql
-- Vérifier les appels de l'agent IA
SELECT
  id,
  status,
  ai_outcome,
  metadata
FROM voice_calls
WHERE organization_id = 'YOUR_ORG_ID'
AND type = 'ai_agent'
AND status = 'failed'
ORDER BY created_at DESC;
```

---

## 📊 Requêtes Utiles pour Monitoring

### Vue d'ensemble temps réel

```sql
-- Dashboard temps réel
SELECT
  'Appels aujourd''hui' as metric,
  COUNT(*) as value
FROM voice_calls
WHERE organization_id = 'YOUR_ORG_ID'
AND DATE(initiated_at) = CURRENT_DATE

UNION ALL

SELECT
  'Appels en cours',
  COUNT(*)
FROM voice_calls
WHERE organization_id = 'YOUR_ORG_ID'
AND status IN ('initiated', 'ringing', 'in-progress')

UNION ALL

SELECT
  'RDV pris ce mois',
  COUNT(*)
FROM voice_calls
WHERE organization_id = 'YOUR_ORG_ID'
AND ai_outcome = 'rdv_pris'
AND initiated_at >= date_trunc('month', CURRENT_DATE);
```

### Analyse de performance

```sql
-- Taux de conversion par outcome
SELECT
  ai_outcome,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM voice_calls
WHERE organization_id = 'YOUR_ORG_ID'
AND ai_outcome IS NOT NULL
AND initiated_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ai_outcome
ORDER BY count DESC;
```

---

**✅ Ce guide vous permet de tester complètement le module Voice et de surveiller son fonctionnement via Supabase !**