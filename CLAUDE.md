# CLAUDE.md - Instructions pour Claude Code

## 🎯 PROJET ULTRON

**Ultron** est une application SaaS multi-tenant avancée pour automatiser la gestion de prospects et les ventes pour des cabinets de gestion de patrimoine (CGP).

### Fonctionnalités principales
- **Architecture Bi-Mode** : Choix entre mode CRM (Supabase) ou mode Google Sheet
- **Dashboard Admin** : Statistiques avancées avec KPIs, heatmaps, et performances équipe
- **Pipeline CRM Intelligent** : Kanban avec gestion de produits et commissions
- **Extension Chrome** : Side panel pour analyse temps réel et qualification pendant calls
- **IA Assistant** : Chat intégré pour requêtes SQL et aide conversationnelle
- **Système de Meetings** : Transcription automatique, analyse IA, et suivi RDV
- **Gestion de Produits** : Configuration produits avec commissions variables
- **Workflows Automatisés** : Qualification IA, emails, rappels programmés
- **Multi-tenant** : OAuth Google par entreprise + Gmail individuel par conseiller
- **Planning Avancé** : Tâches, événements, intégration Google Calendar
- **Landing Page Moderne** : Interface marketing avec animations et branding

---

## 🏗️ ARCHITECTURE BI-MODE

Ultron supporte deux modes de stockage des données, configurables par organisation :

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Components                       │
│  (DashboardContent, ProspectsContent, PipelineKanban...)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              APIs Unifiées /api/prospects/unified/*          │
│              /api/planning/* (avec getCurrentUserAndOrg)     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Factory Pattern                           │
│      getProspectService() / getPlanningService()            │
└─────────────────────────────────────────────────────────────┘
                    │                       │
        data_mode='sheet'          data_mode='crm'
                    │                       │
                    ▼                       ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│   SheetProspectService    │   │    CrmProspectService     │
│   SheetPlanningService    │   │    CrmPlanningService     │
│   (Google Sheets/Cal API) │   │    (Supabase + RLS)       │
│   READ ONLY (prospects)   │   │    FULL CRUD              │
└───────────────────────────┘   └───────────────────────────┘
```

### Configuration du mode
- Stocké dans `organizations.data_mode` ('sheet' | 'crm')
- Configurable via `/settings/data-source`
- Mode exclusif (pas de mixage)

---

## 🛠️ STACK TECHNIQUE

| Composant | Technologie |
|-----------|-------------|
| Framework | Next.js 14 (App Router) |
| Langage | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Anthropic Claude Sonnet 4 |
| Email | Gmail API |
| Sheets | Google Sheets API |
| Scheduling | Upstash QStash |
| Drag & Drop | @dnd-kit/core |
| Icons | Lucide React |
| Charts | Recharts |
| Hosting | Vercel |
| Real-time | Supabase Realtime |
| PDF Generation | jsPDF / PDFKit |

---

## 📁 STRUCTURE DU PROJET

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── admin/page.tsx                  # 🆕 Dashboard Admin
│   │   ├── prospects/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx               # Vue 360° prospect
│   │   ├── pipeline/page.tsx               # Kanban CRM
│   │   ├── planning/page.tsx               # Tâches & événements
│   │   ├── meetings/page.tsx               # 🆕 Gestion transcriptions RDV
│   │   ├── assistant/page.tsx              # 🆕 IA Assistant conversationnel
│   │   ├── tasks/page.tsx                  # 🆕 Gestionnaire de tâches
│   │   ├── import/page.tsx                 # 🆕 Import CSV prospects
│   │   ├── agenda/page.tsx                 # 🆕 Vue calendrier avancée
│   │   ├── meeting/
│   │   │   └── prepare/[prospectId]/page.tsx # 🆕 Préparation RDV IA
│   │   ├── features/
│   │   │   └── calculateur/page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── data-source/page.tsx        # Choix mode Sheet/CRM
│   │       ├── prompts/page.tsx
│   │       ├── products/page.tsx           # 🆕 Gestion produits
│   │       ├── scoring/page.tsx            # 🆕 Configuration scoring IA
│   │       ├── thresholds/page.tsx         # 🆕 Seuils admin
│   │       └── team/page.tsx
│   ├── auth/
│   │   ├── callback/page.tsx
│   │   └── set-password/page.tsx
│   ├── api/
│   │   ├── prospects/
│   │   │   └── unified/                    # ⭐ APIs BI-MODE
│   │   │       ├── route.ts                # GET/POST prospects
│   │   │       ├── stats/route.ts          # GET stats
│   │   │       ├── by-stage/route.ts       # GET groupé par stage
│   │   │       └── [id]/
│   │   │           ├── route.ts            # GET/PATCH/DELETE
│   │   │           └── stage/route.ts      # PATCH stage (drag&drop)
│   │   ├── planning/                       # ⭐ APIs BI-MODE
│   │   │   ├── route.ts                    # GET/POST events
│   │   │   └── [id]/
│   │   │       ├── route.ts                # GET/PATCH/DELETE
│   │   │       └── complete/route.ts       # POST mark complete
│   │   ├── meeting/                        # 🆕 APIs Meetings & Transcription
│   │   │   ├── transcribe/route.ts         # POST transcription automatique
│   │   │   ├── analyze/route.ts            # POST analyse IA meeting
│   │   │   ├── save/route.ts               # POST sauvegarde meeting
│   │   │   ├── prepare/[prospectId]/route.ts # GET préparation RDV
│   │   │   └── transcripts/
│   │   │       ├── route.ts                # GET/POST transcriptions
│   │   │       ├── [id]/route.ts           # GET/DELETE transcription
│   │   │       └── [id]/pdf/route.ts       # GET export PDF
│   │   ├── extension/                      # 🆕 APIs Extension Chrome
│   │   │   ├── analyze/route.ts            # POST analyse prospect
│   │   │   ├── analyze-realtime/route.ts   # POST analyse temps réel
│   │   │   ├── prospects/route.ts          # GET prospects pour extension
│   │   │   ├── search-prospect/route.ts    # POST recherche prospect
│   │   │   └── prospect/[id]/route.ts      # GET détail prospect
│   │   ├── assistant/route.ts              # 🆕 POST IA Assistant chat
│   │   ├── admin/                          # 🆕 APIs Dashboard Admin
│   │   │   ├── stats/route.ts              # GET statistiques admin
│   │   │   ├── charts/route.ts             # GET données graphiques
│   │   │   ├── thresholds/route.ts         # GET/POST seuils config
│   │   │   └── revenue-breakdown/route.ts  # GET répartition revenus
│   │   ├── products/                       # 🆕 APIs Gestion Produits
│   │   │   ├── route.ts                    # GET/POST produits
│   │   │   └── [id]/route.ts               # GET/PATCH/DELETE produit
│   │   ├── deal-products/route.ts          # 🆕 API Produits par deal
│   │   ├── advisor-commissions/            # 🆕 APIs Commissions
│   │   │   ├── route.ts                    # GET/POST commissions
│   │   │   └── [id]/route.ts               # PATCH/DELETE commission
│   │   ├── crm/                            # APIs CRM directes
│   │   │   ├── prospects/route.ts
│   │   │   ├── stages/route.ts
│   │   │   ├── activities/route.ts
│   │   │   ├── tasks/route.ts
│   │   │   ├── emails/route.ts
│   │   │   └── import/route.ts
│   │   ├── sheets/                         # APIs Google Sheets
│   │   │   ├── prospects/route.ts
│   │   │   ├── stats/route.ts
│   │   │   ├── update-status/route.ts
│   │   │   └── test/route.ts
│   │   ├── google/
│   │   │   ├── auth/route.ts
│   │   │   ├── callback/route.ts
│   │   │   └── check-scopes/route.ts       # 🆕 Vérification scopes
│   │   ├── calendar/                       # 🆕 APIs Google Calendar
│   │   │   └── events/
│   │   │       ├── route.ts                # GET/POST événements
│   │   │       └── [id]/route.ts           # GET/PATCH/DELETE événement
│   │   ├── auth/
│   │   │   └── extension-login/route.ts    # 🆕 Auth pour extension
│   │   ├── webhooks/
│   │   │   ├── qualification/route.ts
│   │   │   ├── rdv-valide/route.ts
│   │   │   ├── plaquette/route.ts
│   │   │   └── send-rappel/route.ts
│   │   ├── agents/                         # 🆕 APIs Agents automatisés
│   │   │   ├── telegram/route.ts           # Webhook Telegram
│   │   │   └── trigger/route.ts            # Déclenchement agents
│   │   ├── organization/
│   │   ├── team/
│   │   ├── user/
│   │   └── prompts/
│   ├── layout.tsx
│   └── page.tsx                            # 🆕 Landing page moderne
├── components/
│   ├── ui/                                 # shadcn components
│   │   ├── confirm-dialog.tsx              # 🆕 Modal confirmation custom
│   │   ├── alert-dialog-custom.tsx         # 🆕 Modal alerte custom
│   │   └── prompt-dialog.tsx               # 🆕 Modal saisie custom
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MobileNav.tsx
│   ├── landing/                            # 🆕 Composants Landing Page
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── TrustSection.tsx
│   │   ├── FooterSection.tsx
│   │   ├── ParticleBackground.tsx
│   │   ├── SmoothScroll.tsx
│   │   ├── DashboardPreview.tsx
│   │   ├── PipelinePreview.tsx
│   │   ├── FinalCTA.tsx
│   │   └── NexusLogo.tsx
│   ├── dashboard/
│   │   ├── DashboardContent.tsx            # Utilise /api/prospects/unified
│   │   ├── StatsCards.tsx
│   │   ├── ProspectsChart.tsx
│   │   ├── RecentProspects.tsx
│   │   └── ActivityFeed.tsx
│   ├── admin/                              # 🆕 Composants Dashboard Admin
│   │   ├── AdminDashboardContent.tsx
│   │   ├── AdminStatsCards.tsx
│   │   ├── AdvisorPerformanceTable.tsx
│   │   ├── ConversionFunnelChart.tsx
│   │   ├── RevenueChart.tsx
│   │   ├── RevenueBreakdownDashboard.tsx
│   │   ├── ActivityHeatmap.tsx
│   │   ├── TopPerformers.tsx
│   │   ├── AlertsPanel.tsx
│   │   └── RevenueExplanation.tsx
│   ├── assistant/                          # 🆕 Composants IA Assistant
│   │   ├── AssistantContent.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── QueryResultTable.tsx
│   │   ├── TypingIndicator.tsx
│   │   └── WelcomeScreen.tsx
│   ├── meeting/                            # 🆕 Composants Meetings
│   │   └── MeetingPrepContent.tsx
│   ├── prospects/
│   │   └── ProspectsContent.tsx            # Utilise /api/prospects/unified
│   ├── crm/
│   │   ├── PipelineKanban.tsx              # Utilise /api/crm/* (à migrer)
│   │   ├── ProspectForm.tsx
│   │   ├── ProspectCard.tsx
│   │   ├── DealProductSelector.tsx         # 🆕 Sélecteur produits
│   │   ├── WaitingReasonModal.tsx
│   │   ├── RdvNotesModal.tsx
│   │   ├── ActivityTimeline.tsx
│   │   ├── PipelineColumn.tsx
│   │   └── ProspectTasks.tsx
│   ├── agenda/                             # 🆕 Composants Agenda
│   │   └── AgendaContent.tsx
│   ├── planning/
│   │   ├── PlanningContent.tsx             # Utilise /api/planning
│   │   └── TaskForm.tsx
│   ├── settings/
│   │   ├── PromptsEditor.tsx
│   │   ├── ProductsManager.tsx             # 🆕 Gestionnaire produits
│   │   ├── ScoringConfig.tsx               # 🆕 Configuration scoring
│   │   ├── ThresholdConfigForm.tsx         # 🆕 Configuration seuils
│   │   ├── GoogleSheetsConfig.tsx
│   │   ├── PlaquetteConfig.tsx
│   │   ├── TeamManager.tsx
│   │   ├── GmailTestButton.tsx
│   │   └── ThemeSelector.tsx
│   ├── features/
│   │   └── InterestCalculator.tsx
│   └── auth/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── supabase-admin.ts               # createAdminClient() bypass RLS
│   ├── services/                       # ⭐ ARCHITECTURE BI-MODE
│   │   ├── interfaces/
│   │   │   └── index.ts                # IProspectService, IPlanningService
│   │   ├── factories/
│   │   │   ├── prospect-factory.ts     # getProspectService()
│   │   │   └── planning-factory.ts     # getPlanningService()
│   │   ├── crm/
│   │   │   ├── prospect-service.ts     # CrmProspectService
│   │   │   └── planning-service.ts     # CrmPlanningService
│   │   ├── sheet/
│   │   │   ├── prospect-service.ts     # SheetProspectService
│   │   │   └── planning-service.ts     # SheetPlanningService
│   │   └── get-organization.ts         # getCurrentUserAndOrganization()
│   ├── google.ts
│   ├── gmail.ts
│   ├── anthropic.ts
│   ├── qstash.ts
│   ├── cors.ts                         # 🆕 Configuration CORS extension
│   └── utils.ts
├── hooks/
├── types/
│   ├── index.ts
│   ├── crm.ts                          # Types CRM (CrmProspect, PipelineStage...)
│   ├── products.ts                     # 🆕 Types produits et commissions
│   ├── meeting.ts                      # 🆕 Types transcriptions et meetings
│   ├── pipeline.ts                     # 🆕 Types pipeline bi-mode
│   └── admin.ts                        # 🆕 Types dashboard admin
└── middleware.ts
```

---

## 🗄️ STRUCTURE BASE DE DONNÉES SUPABASE

> **Schema SQL Complet :** Toute la base de données est disponible dans [`/database/ultron-complete-schema.sql`](database/ultron-complete-schema.sql)

### 📊 Vue d'ensemble Architecture Multi-Tenant

```
🏢 ORGANIZATIONS (Multi-tenant)
├── 👥 USERS (Admins + Conseillers)
├── 🛍️ PRODUCTS & COMMISSIONS System
├── 🎯 CRM Complete (Prospects + Pipeline)
├── 📹 MEETINGS & Transcription IA
├── 📊 ADMIN Analytics & Thresholds
├── 🤖 AGENT Automation System
└── ⚙️ SYSTEM Configuration
```

### Tables Principales

**🏢 organizations** - Entreprises clientes (Multi-tenant)
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR NOT NULL UNIQUE,

  -- Mode de données configurable
  data_mode VARCHAR DEFAULT 'crm' CHECK (data_mode IN ('sheet', 'crm')), -- ⭐ Bi-mode

  -- Intégrations Google
  google_sheet_id VARCHAR,
  google_credentials JSONB,

  -- Branding & UI
  logo_url VARCHAR,
  primary_color VARCHAR DEFAULT '#6366f1',

  -- Abonnement
  plan VARCHAR DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),

  -- Configuration IA Prompts
  prompt_qualification JSONB,
  prompt_synthese JSONB,
  prompt_rappel JSONB,
  prompt_plaquette JSONB,

  -- Plaquette PDF
  plaquette_id VARCHAR, -- Google Drive ID

  -- Configuration Scoring IA ⭐
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

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**👥 users** - Utilisateurs (Admins + Conseillers)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE, -- Lien avec Supabase Auth
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identité
  email VARCHAR NOT NULL,
  full_name VARCHAR,
  role VARCHAR DEFAULT 'conseiller' CHECK (role IN ('admin', 'conseiller')),

  -- Credentials Gmail individuels
  gmail_credentials JSONB,

  -- Profil
  avatar_url VARCHAR,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 🛍️ Système Produits & Commissions

**products** - Catalogue produits configurables
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Info produit
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL CHECK (type IN ('fixed', 'commission')), -- Type flexible
  category VARCHAR, -- Catégorie métier (ex: 'assurance_vie', 'pea')

  -- Produits à bénéfice fixe (ex: pompe à chaleur = 500€ fixe)
  fixed_value NUMERIC, -- Valeur fixe en euros

  -- Produits à commission (ex: CGP = 2% du montant investi)
  commission_rate NUMERIC, -- Pourcentage commission

  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Contraintes de validation
  CONSTRAINT valid_fixed_product CHECK (
    (type = 'fixed' AND fixed_value IS NOT NULL AND fixed_value > 0) OR type = 'commission'
  ),
  CONSTRAINT valid_commission_product CHECK (
    (type = 'commission' AND commission_rate IS NOT NULL AND commission_rate > 0 AND commission_rate <= 100) OR type = 'fixed'
  )
);
```

**advisor_commissions** - Commissions personnalisées par conseiller
```sql
CREATE TABLE advisor_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE, -- NULL = commission par défaut

  commission_rate NUMERIC NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  is_default BOOLEAN DEFAULT false, -- Commission par défaut pour ce conseiller

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, product_id), -- Un taux par conseiller/produit
  EXCLUDE (user_id WITH =) WHERE (is_default = true AND product_id IS NULL) -- Un seul défaut par conseiller
);
```

**deal_products** - Deals avec calcul automatique CA/commissions
```sql
CREATE TABLE deal_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES crm_prospects(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Montants client
  client_amount NUMERIC NOT NULL CHECK (client_amount > 0), -- Montant investi client

  -- Calculs automatiques (via trigger)
  company_revenue NUMERIC NOT NULL CHECK (company_revenue > 0), -- CA entreprise calculé
  advisor_commission NUMERIC DEFAULT 0 CHECK (advisor_commission >= 0), -- Commission conseiller
  commission_rate_used NUMERIC, -- Taux produit utilisé
  advisor_commission_rate NUMERIC, -- Taux conseiller utilisé

  -- Métadonnées
  closed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(prospect_id) -- Un deal actif par prospect
);
```

### 🎯 CRM Complet

**pipeline_stages** - Étapes pipeline personnalisables
```sql
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  name VARCHAR NOT NULL, -- "Nouveau", "RDV Pris", etc.
  slug VARCHAR NOT NULL, -- "nouveau", "rdv_pris", etc.
  color VARCHAR DEFAULT '#6366f1',
  position INTEGER NOT NULL,

  -- Comportement étape
  is_won BOOLEAN DEFAULT false,
  is_lost BOOLEAN DEFAULT false,
  default_probability INTEGER DEFAULT 50,

  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);
```

**crm_prospects** - Prospects avec qualification IA
```sql
CREATE TABLE crm_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identité
  first_name VARCHAR, last_name VARCHAR, email VARCHAR, phone VARCHAR,
  company VARCHAR, job_title VARCHAR,
  address TEXT, city VARCHAR, postal_code VARCHAR, country VARCHAR DEFAULT 'France',

  -- Profil financier CGP
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

  -- Qualification IA ⭐
  qualification VARCHAR DEFAULT 'non_qualifie' CHECK (qualification IN ('CHAUD', 'TIEDE', 'FROID', 'non_qualifie')),
  score_ia INTEGER CHECK (score_ia >= 0 AND score_ia <= 100),
  analyse_ia TEXT,
  derniere_qualification TIMESTAMPTZ,

  -- Métriques produits (calculées)
  total_commission_earned NUMERIC DEFAULT 0,
  products_sold INTEGER DEFAULT 0,

  -- Source & Attribution
  source VARCHAR, source_detail VARCHAR,
  assigned_to UUID REFERENCES users(id),
  tags TEXT[], notes TEXT,

  -- Statut final
  lost_reason VARCHAR,
  won_date TIMESTAMPTZ, lost_date TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**crm_activities** - Historique interactions
```sql
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES crm_prospects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  type VARCHAR NOT NULL CHECK (type IN ('note', 'call', 'email', 'meeting', 'task')),
  direction VARCHAR CHECK (direction IN ('inbound', 'outbound')),
  subject VARCHAR, content TEXT,

  -- Email spécifique
  email_status VARCHAR,
  email_opened_at TIMESTAMPTZ,
  email_opened_count INTEGER DEFAULT 0,

  -- Call/Meeting spécifique
  duration_minutes INTEGER,
  outcome VARCHAR,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**crm_events** - Planning bi-mode compatible
```sql
CREATE TABLE crm_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Liaison prospect (bi-mode) ⭐
  prospect_id UUID REFERENCES crm_prospects(id) ON DELETE CASCADE,
  prospect_sheet_id VARCHAR, -- ID ligne Sheet pour mode bi-mode
  prospect_name VARCHAR,

  -- Info événement
  type VARCHAR DEFAULT 'task' CHECK (type IN ('task', 'call', 'meeting', 'reminder', 'email')),
  title VARCHAR NOT NULL, description TEXT,

  -- Timing
  start_date TIMESTAMPTZ, end_date TIMESTAMPTZ, due_date TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,

  -- Statut
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,

  -- Attribution
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  priority VARCHAR DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Liens meeting
  meet_link VARCHAR, -- Google Meet
  calendar_link VARCHAR, -- Rappel calendrier

  -- Sync externe
  external_id VARCHAR, -- Google Calendar
  external_source VARCHAR,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 📹 Système Meetings & IA

**meeting_transcripts** - Transcriptions avec analyse IA
```sql
CREATE TABLE meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES crm_prospects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Info meeting
  meeting_date TIMESTAMPTZ DEFAULT now(),
  duration_seconds INTEGER,
  google_meet_link VARCHAR(500),

  -- Données transcription
  transcript_text TEXT, -- Transcription brute
  transcript_json JSONB, -- Segmentée avec speakers ⭐

  -- Analyse IA avancée
  ai_summary TEXT, -- Résumé intelligent
  key_points JSONB, -- Array points clés
  objections_detected JSONB, -- Array objections avec réponses suggérées ⭐
  next_actions JSONB, -- Array prochaines actions

  -- Export
  pdf_url VARCHAR(500), -- Rapport PDF généré

  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 📊 Admin & Analytics

**admin_thresholds** - Seuils configurables alertes
```sql
CREATE TABLE admin_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  metric_name VARCHAR NOT NULL, -- 'conversion_rate', 'activity_target', etc.
  threshold_value NUMERIC NOT NULL,
  threshold_type VARCHAR NOT NULL CHECK (threshold_type IN ('warning', 'critical')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**daily_stats** - Statistiques quotidiennes enrichies
```sql
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Métriques prospects
  total_prospects INTEGER DEFAULT 0,
  prospects_chaud INTEGER DEFAULT 0, prospects_tiede INTEGER DEFAULT 0, prospects_froid INTEGER DEFAULT 0,

  -- Métriques activité
  mails_envoyes INTEGER DEFAULT 0, rdv_pris INTEGER DEFAULT 0,

  -- Métriques revenus ⭐
  revenue_generated NUMERIC DEFAULT 0, -- CA généré
  commissions_paid NUMERIC DEFAULT 0, -- Commissions versées
  products_sold INTEGER DEFAULT 0, -- Produits vendus
  conversion_rate NUMERIC DEFAULT 0, -- Taux conversion

  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, date)
);
```

**activity_logs** - Logs d'activité enrichis
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),

  action VARCHAR NOT NULL,
  entity_type VARCHAR, -- 'prospect', 'product', 'meeting', etc. ⭐
  entity_id UUID, -- ID entité concernée ⭐
  details JSONB,

  -- Tracking avancé
  ip_address INET, -- Tracking IP ⭐
  user_agent TEXT, -- Tracking navigateur ⭐

  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 🤖 Système Agents & Automation

**agent_runs** - Exécutions agent IA
```sql
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),

  agent_type VARCHAR NOT NULL, -- 'qualification', 'email', 'analysis'
  trigger_event VARCHAR, -- Événement déclencheur
  input_data JSONB, output_data JSONB, -- Entrée/Sortie

  -- Exécution
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  tokens_used INTEGER DEFAULT 0, -- Tokens IA consommés ⭐
  duration_ms INTEGER, -- Durée exécution
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);
```

**agent_ideas** & **agent_tasks** - Système d'idées automatiques
```sql
CREATE TABLE agent_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL, description TEXT,
  source VARCHAR DEFAULT 'auto',
  priority INTEGER DEFAULT 50,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
  telegram_message_id BIGINT, -- Intégration Telegram
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES agent_ideas(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'pending',
  prompt TEXT NOT NULL,
  branch_name VARCHAR, commit_hash VARCHAR, pr_url VARCHAR, -- Git integration
  started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### ⚙️ Tables Système

**system_settings** - Configuration système
```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  setting_key VARCHAR NOT NULL, -- 'ai_model', 'email_limits', 'features'
  setting_value JSONB NOT NULL, -- Valeur configuration flexible
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, setting_key)
);
```

**Autres tables système :**
- `email_logs` - Historique emails envoyés
- `scheduled_emails` - Emails programmés (legacy QStash)
- `prompts` - Prompts IA configurables
- `crm_email_templates` - Templates emails
- `crm_saved_filters` - Filtres sauvegardés

### 🔐 Sécurité & Performance

**Row Level Security (RLS) :** Toutes les tables principales activées
**Index optimisés :** Performance sur requêtes fréquentes
**Triggers automatiques :**
- Calcul automatique revenus/commissions (`calculate_deal_revenue()`)
- Synchronisation valeur deal (`sync_prospect_deal_value()`)
- Mise à jour timestamps (`update_updated_at_column()`)

**Contraintes métier :**
- Validation types produits (fixed vs commission)
- Unicité commissions par conseiller/produit
- Seuils scores IA (0-100)
- États pipeline cohérents

---

## 🆕 NOUVELLES FONCTIONNALITÉS DÉVELOPPÉES

### 🎮 Extension Chrome - Side Panel Intelligent
**Localisation :** `/api/extension/*`

L'extension Chrome offre un side panel intégré pour l'analyse en temps réel :

**Fonctionnalités :**
- **Authentification sécurisée** : Login via token Supabase (`/api/auth/extension-login`)
- **Analyse temps réel** : IA analyse la conversation pendant les appels (`/api/extension/analyze-realtime`)
- **Recherche prospects** : Recherche instantanée dans la base (`/api/extension/search-prospect`)
- **Qualification automatique** : Suggestions contextuelles et détection d'objections
- **Synchronisation** : Accès aux prospects et mise à jour en direct

**APIs spécialisées :**
- `POST /api/extension/analyze` - Analyse complète prospect
- `POST /api/extension/analyze-realtime` - Analyse temps réel avec suggestions
- `GET /api/extension/prospects` - Liste prospects pour extension
- `GET /api/extension/prospect/[id]` - Détail prospect spécifique

### 🎯 Dashboard Admin Avancé
**Localisation :** `/admin`, `/src/components/admin/*`

Dashboard complet pour superviseurs avec KPIs avancés :

**Composants principaux :**
- **AdminStatsCards** : Métriques clés (CA, conversion, activité)
- **AdvisorPerformanceTable** : Classement performance conseillers
- **ConversionFunnelChart** : Entonnoir de conversion par étapes
- **RevenueChart** : Graphiques revenus avec tendances
- **ActivityHeatmap** : Heatmap d'activité par conseiller/période
- **RevenueBreakdownDashboard** : Répartition détaillée CA par produit/conseiller
- **AlertsPanel** : Alertes automatiques sur seuils critiques

**APIs admin spécialisées :**
- `GET /api/admin/stats` - Statistiques globales organisation
- `GET /api/admin/charts` - Données pour graphiques dashboard
- `GET /api/admin/revenue-breakdown` - Détail répartition revenus
- `GET/POST /api/admin/thresholds` - Configuration seuils alertes

### 🤖 IA Assistant Conversationnel
**Localisation :** `/assistant`, `/src/components/assistant/*`

Assistant IA intégré pour requêtes naturelles sur les données :

**Fonctionnalités :**
- **Chat intelligent** : Interface conversationnelle avec Claude Sonnet 4
- **Requêtes SQL** : Conversion requêtes naturelles en SQL sécurisé
- **Analyses instantanées** : Statistiques et insights à la demande
- **Suggestions contextuelles** : Aide proactive selon le contexte
- **Accès sécurisé** : Respect RLS et permissions utilisateur

**Composants :**
- `AssistantContent` : Interface principale chat
- `ChatMessage` : Rendu messages avec support markdown/tableaux
- `QueryResultTable` : Affichage résultats requêtes SQL
- `TypingIndicator` : Animation en cours de réponse
- `WelcomeScreen` : Écran d'accueil avec suggestions

### 📹 Système de Meetings Avancé
**Localisation :** `/meetings`, `/src/app/api/meeting/*`

Gestion complète des RDV avec transcription et analyse IA :

**Fonctionnalités :**
- **Transcription automatique** : Conversion audio en texte structuré
- **Analyse IA avancée** : Résumés, points clés, objections détectées
- **Préparation RDV** : Brief IA personnalisé avant chaque meeting
- **Export PDF** : Rapports complets avec insights IA
- **Gestion historique** : Archivage et recherche dans les transcriptions

**APIs meetings :**
- `POST /api/meeting/transcribe` - Transcription audio en temps réel
- `POST /api/meeting/analyze` - Analyse IA complète du meeting
- `GET /api/meeting/prepare/[prospectId]` - Préparation meeting
- `POST /api/meeting/save` - Sauvegarde meeting et métadonnées
- `GET /api/meeting/transcripts` - Liste des transcriptions
- `GET /api/meeting/transcripts/[id]/pdf` - Export PDF rapport

### 🛍️ Gestion Avancée de Produits
**Localisation :** `/settings/products`, `/src/app/api/products/*`

Système complet de gestion produits et commissions :

**Types de produits :**
- **Produits à bénéfice fixe** : Entreprise gagne montant fixe par vente
- **Produits à commission** : Entreprise gagne % du montant investi

**Gestion commissions :**
- **Configuration flexible** : Taux par conseiller/produit
- **Calcul automatique** : Commission calculée selon type produit
- **Suivi performance** : CA généré par conseiller/produit
- **Rapports détaillés** : Répartition revenus et commissions

**Tables associées :**
- `products` : Catalogue produits organisation
- `deal_products` : Produits vendus par prospect
- `advisor_commissions` : Taux commissions conseillers

### 🎨 Landing Page Moderne
**Localisation :** `/`, `/src/components/landing/*`

Page d'accueil marketing avancée avec branding Ultron :

**Composants :**
- **HeroSection** : Section héro avec animations et CTA
- **FeaturesSection** : Présentation fonctionnalités avec icônes
- **DashboardPreview** : Aperçu interface dashboard
- **PipelinePreview** : Démonstration pipeline CRM
- **ParticleBackground** : Animation particules arrière-plan
- **NexusLogo** : Logo Ultron animé en 3D
- **FinalCTA** : Call-to-action final avec formulaire

### 📊 Système de Scoring IA Configurable
**Localisation :** `/settings/scoring`, `organizations.scoring_config`

Configuration avancée de l'algorithme de qualification :

**Paramètres configurables :**
- **Seuils qualification** : CHAUD (70+), TIÈDE (40-69), FROID (<40)
- **Pondération critères** : Revenus (25%), IA (50%), Patrimoine (25%)
- **Seuils financiers** : Revenus min/max, patrimoine min/max
- **Adaptation métier** : Personnalisation selon secteur CGP

### 🗓️ Planning Avancé avec Google Calendar
**Localisation :** `/planning`, `/agenda`, `/src/app/api/calendar/*`

Gestion complète planning avec intégration Google :

**Fonctionnalités :**
- **Vues multiples** : Jour, semaine, mois, liste
- **Synchronisation Google** : Bidirectionnelle avec Google Calendar
- **Gestion tâches** : Création, assignation, suivi complétion
- **Liens Meet** : Génération automatique Google Meet
- **Rappels** : Notifications programmées via QStash

### 📈 Analytics et Métriques Avancées
**Répartition :** Composants admin + dashboard

Système complet de métriques et KPIs :

**Métriques principales :**
- **Taux de conversion** : Par étape pipeline et global
- **CA par conseiller** : Revenus générés et commissions
- **Performance produits** : Ventes et rentabilité par produit
- **Activité équipe** : Heatmaps d'engagement
- **Tendances temporelles** : Évolution indicateurs

**Alertes configurables :**
- **Seuils personnalisés** : Warning/Critical par métrique
- **Notifications proactives** : Alerts dashboard admin
- **Suivi objectifs** : Écarts performance vs targets

---

## 🔌 INTERFACES & SERVICES BI-MODE (Enrichi)

### APIs Unifiées Complètes

| Endpoint | Méthodes | Description | Statut |
|----------|----------|-------------|---------|
| `/api/prospects/unified` | GET, POST | Liste/Créer prospects | ✅ Bi-Mode |
| `/api/prospects/unified/stats` | GET | Statistiques prospects | ✅ Bi-Mode |
| `/api/prospects/unified/by-stage` | GET | Prospects groupés par stage | ✅ Bi-Mode |
| `/api/prospects/unified/[id]` | GET, PATCH, DELETE | CRUD prospect | ✅ Bi-Mode |
| `/api/prospects/unified/[id]/stage` | PATCH | Update stage (drag&drop) | ✅ Bi-Mode |
| `/api/planning` | GET, POST | Liste/Créer événements | ✅ Bi-Mode |
| `/api/planning/[id]` | GET, PATCH, DELETE | CRUD événement | ✅ Bi-Mode |
| `/api/planning/[id]/complete` | POST | Marquer complété | ✅ Bi-Mode |
| `/api/stages/unified` | GET | Stages pipeline | ✅ Bi-Mode |
| `/api/sheets/update-status` | PATCH | 🆕 Update statut Sheet | 🔶 Sheet only |

---

## 🔐 AUTHENTIFICATION & SÉCURITÉ (Enrichi)

### Extension Chrome - Authentification Sécurisée

```typescript
// /api/auth/extension-login
export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  // Auth Supabase standard
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password
  });

  if (error) return NextResponse.json({ error }, { status: 401 });

  // Retourne token pour extension
  return NextResponse.json({
    access_token: data.session.access_token,
    user: data.user
  });
}
```

### CORS pour Extension
```typescript
// /lib/cors.ts - Configuration CORS extension
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'chrome-extension://*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}
```

---

## 🎯 WORKFLOWS AUTOMATISÉS (Enrichis)

### 1. Qualification IA Avancée (/api/webhooks/qualification)
- **Analyse contextuelle** : Prompt personnalisé par organisation
- **Scoring multicritère** : Revenus + IA + Patrimoine avec pondération
- **Seuils adaptatifs** : Configuration flexible via `scoring_config`
- **Justification détaillée** : Explication du score IA

### 2. Meetings et Transcription (/api/meeting/*)
- **Transcription temps réel** : Conversion audio avec speakers
- **Analyse post-meeting** : Résumé, points clés, objections
- **Actions suggérées** : Prochaines étapes recommandées par IA
- **Export automatique** : PDF rapport complet

### 3. Système de Commissions (/api/deal-products, /api/advisor-commissions)
- **Calcul automatique** : Commission selon type produit
- **Répartition flexible** : Taux personnalisés par conseiller/produit
- **Suivi revenus** : Mise à jour temps réel CA et commissions

### 4. Alertes Proactives (/api/admin/*)
- **Seuils configurables** : Warning/Critical par métrique
- **Notifications dashboard** : Alerts temps réel admin
- **Escalation automatique** : Actions selon niveau alerte

---

## 📊 NOUVELLES TABLES & STRUCTURE (Complément)

### Tables Analytics

**daily_stats** - Stats quotidiennes (enrichie)
```sql
- id UUID PRIMARY KEY
- organization_id UUID
- date DATE NOT NULL
- total_prospects INTEGER DEFAULT 0
- prospects_chaud, prospects_tiede, prospects_froid INTEGER DEFAULT 0
- mails_envoyes, rdv_pris INTEGER DEFAULT 0
- revenue_generated NUMERIC DEFAULT 0        -- 🆕 CA généré
- commissions_paid NUMERIC DEFAULT 0         -- 🆕 Commissions versées
- products_sold INTEGER DEFAULT 0            -- 🆕 Produits vendus
- conversion_rate NUMERIC DEFAULT 0          -- 🆕 Taux de conversion
- created_at TIMESTAMPTZ DEFAULT now()
```

**activity_logs** - Logs d'activité (enrichis)
```sql
- id UUID PRIMARY KEY
- organization_id, user_id UUID
- action VARCHAR NOT NULL
- entity_type VARCHAR                        -- 🆕 'prospect', 'product', 'meeting'
- entity_id UUID                            -- 🆕 ID entité concernée
- details JSONB
- ip_address INET                           -- 🆕 Tracking IP
- user_agent TEXT                           -- 🆕 Tracking navigateur
- created_at TIMESTAMPTZ DEFAULT now()
```

### Tables Système Avancées

**agent_runs** - Exécutions agent (nouvelles)
```sql
- id UUID PRIMARY KEY
- organization_id UUID
- agent_type VARCHAR NOT NULL               -- 'qualification', 'email', 'analysis'
- trigger_event VARCHAR                     -- Événement déclencheur
- input_data JSONB                          -- Données entrée
- output_data JSONB                         -- Résultats
- status VARCHAR DEFAULT 'pending'          -- 'pending', 'running', 'completed', 'failed'
- tokens_used INTEGER DEFAULT 0             -- Tokens IA consommés
- duration_ms INTEGER                       -- Durée exécution
- error_message TEXT                        -- Message d'erreur si échec
- created_at TIMESTAMPTZ DEFAULT now()
```

**system_settings** - Configuration système (nouvelle)
```sql
- id UUID PRIMARY KEY
- organization_id UUID REFERENCES organizations(id)
- setting_key VARCHAR NOT NULL              -- 'ai_model', 'email_limits', 'features'
- setting_value JSONB NOT NULL              -- Valeur configuration
- is_active BOOLEAN DEFAULT true
- updated_by UUID REFERENCES users(id)
- created_at, updated_at TIMESTAMPTZ
```

---

## 🚀 COMMANDES (Enrichies)

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Build production
npm run lint         # Vérifier le code
npm run typecheck    # Vérification TypeScript
npm run test         # Tests unitaires (si configurés)
```

### Git (Enrichi)
```bash
git add .
git commit -m "feat: nouvelle fonctionnalité"    # feat, fix, style, refactor, docs, chore
git push origin main

# Branches de fonctionnalités
git checkout -b feat/extension-chrome
git checkout -b fix/admin-dashboard
git checkout -b refactor/api-unified
```

---

## 🔗 LIENS (Mis à jour)

- **Production** : https://ultron-murex.vercel.app
- **GitHub** : https://github.com/martinborgis-lang/Ultron
- **Supabase** : https://supabase.com/dashboard
- **Vercel** : https://vercel.com/dashboard
- **Anthropic Console** : https://console.anthropic.com
- **QStash Dashboard** : https://console.upstash.com/qstash
- **Google Cloud Console** : https://console.cloud.google.com (APIs Gmail/Sheets/Calendar)

---

## ⚠️ NOTES IMPORTANTES (Mises à jour)

### 🎮 Extension Chrome
- **Authentification** : Token-based avec CORS configuré
- **Side Panel** : Interface dédiée pour analyse temps réel
- **Sécurité** : Validation token Supabase sur chaque requête
- **Performance** : Cache local pour réduire appels API

### 🎯 Dashboard Admin
- **Accès restreint** : Role 'admin' requis
- **Métriques temps réel** : Mise à jour automatique
- **Export données** : Fonctionnalité intégrée graphiques
- **Alertes configurables** : Seuils personnalisables par organisation

### 🤖 IA Assistant
- **Modèle** : Claude Sonnet 4 (plus puissant que Claude 3.5)
- **Sécurité SQL** : Requêtes filtrées et validées
- **Context aware** : Accès contexte utilisateur/organisation
- **Rate limiting** : Protection contre abus

### 📹 Meetings & Transcription
- **Formats supportés** : MP3, WAV, M4A pour transcription
- **Langue** : Français optimisé pour contexte CGP
- **Stockage** : Transcriptions chiffrées en base
- **Export PDF** : Rapports professionnels avec branding

### 🛍️ Gestion Produits
- **Types flexibles** : Fixe vs Commission adaptés métier CGP
- **Calculs automatiques** : Commissions calculées en temps réel
- **Multi-conseillers** : Taux différenciés par conseiller/produit
- **Historique** : Traçabilité complète ventes et commissions

### 🔄 Architecture Bi-Mode
- **Mode Sheet** : Lecture seule prospects + planning Google Calendar
- **Mode CRM** : CRUD complet + fonctionnalités avancées
- **Migration** : Possible de CRM vers Sheet (pas l'inverse)
- **Compatibilité** : APIs unifiées garantissent fonctionnement identique

### 🚀 Performance & Monitoring
- **Lazy loading** : Composants chargés à la demande
- **Caching** : Redis pour requêtes fréquentes (production)
- **Monitoring** : Logs détaillés et métriques performance
- **Scaling** : Architecture préparée montée en charge

---

## 📋 ROADMAP & PROCHAINES ÉTAPES

### 🎯 Priorité 1 : Extension Chrome (En cours)
- [ ] Finaliser side panel avec toutes les APIs
- [ ] Tests utilisateurs et optimisations
- [ ] Publication Chrome Web Store
- [ ] Documentation utilisateur

### 📊 Priorité 2 : Analytics Avancés
- [ ] Tableaux de bord prédictifs avec ML
- [ ] Alertes intelligentes basées sur patterns
- [ ] Export données pour outils BI externes
- [ ] API publique pour intégrations

### 🤖 Priorité 3 : IA Avancée
- [ ] Assistant vocal pour calls en temps réel
- [ ] Analyse sentiment client pendant meetings
- [ ] Recommandations produits automatiques
- [ ] Prédiction probabilité closing

### 🔧 Priorité 4 : Intégrations
- [ ] Zapier pour workflows externes
- [ ] Calendly pour prise RDV automatique
- [ ] WhatsApp Business API
- [ ] Intégration CRM externes (Salesforce, HubSpot)

### 📱 Priorité 5 : Mobile
- [ ] Application mobile React Native
- [ ] Push notifications prospects chauds
- [ ] Mode offline pour consultations terrain
- [ ] Widget iOS/Android pour accès rapide

---

## 🏆 FONCTIONNALITÉS DÉVELOPPÉES NON DOCUMENTÉES (Récapitulatif)

✅ **Extension Chrome avec Side Panel**
✅ **Dashboard Admin Complet**
✅ **IA Assistant Conversationnel**
✅ **Système de Meetings & Transcription**
✅ **Gestion Avancée de Produits**
✅ **Landing Page Moderne**
✅ **Système de Scoring Configurable**
✅ **Planning avec Google Calendar**
✅ **Analytics & Métriques Avancées**
✅ **Alertes Proactives Configurables**
✅ **APIs Extension Sécurisées**
✅ **Modals Personnalisées Ultron**
✅ **Architecture Bi-Mode Complète**
✅ **Workflow Commissions Automatisé**

Le projet Ultron est maintenant une plateforme SaaS complète et avancée pour la gestion de patrimoine, avec des fonctionnalités enterprise et une architecture scalable prête pour la production.