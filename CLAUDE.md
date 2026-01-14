# CLAUDE.md - Instructions pour Claude Code

## 🎯 PROJET ULTRON

**Ultron** est une application SaaS multi-tenant pour automatiser la gestion de prospects pour des cabinets de gestion de patrimoine (CGP).

### Fonctionnalités principales
- **Architecture Bi-Mode** : Choix entre mode CRM (Supabase) ou mode Google Sheet
- Dashboard avec statistiques en temps réel
- Pipeline CRM avec drag & drop (Kanban)
- Connexion OAuth Google par entreprise (Sheets) + par conseiller (Gmail)
- Workflows automatisés (qualification IA, emails, rappels)
- Personnalisation des prompts IA par entreprise
- Gestion multi-conseillers avec Gmail individuel
- Planning et tâches intégrés
- Import CSV de prospects
- Rappels programmés via QStash
- Calculateur d'intérêts composés

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
| AI | Anthropic Claude API |
| Email | Gmail API |
| Sheets | Google Sheets API |
| Scheduling | Upstash QStash |
| Drag & Drop | @dnd-kit/core |
| Icons | Lucide React |
| Charts | Recharts |
| Hosting | Vercel |

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
│   │   ├── prospects/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx          # Vue 360° prospect
│   │   ├── pipeline/page.tsx           # Kanban CRM
│   │   ├── planning/page.tsx           # Tâches & événements
│   │   ├── features/
│   │   │   └── calculateur/page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── data-source/page.tsx    # Choix mode Sheet/CRM
│   │       ├── prompts/page.tsx
│   │       └── team/page.tsx
│   ├── auth/
│   │   ├── callback/page.tsx
│   │   └── set-password/page.tsx
│   ├── api/
│   │   ├── prospects/
│   │   │   └── unified/                # ⭐ APIs BI-MODE
│   │   │       ├── route.ts            # GET/POST prospects
│   │   │       ├── stats/route.ts      # GET stats
│   │   │       ├── by-stage/route.ts   # GET groupé par stage
│   │   │       └── [id]/
│   │   │           ├── route.ts        # GET/PATCH/DELETE
│   │   │           └── stage/route.ts  # PATCH stage (drag&drop)
│   │   ├── planning/                   # ⭐ APIs BI-MODE
│   │   │   ├── route.ts                # GET/POST events
│   │   │   └── [id]/
│   │   │       ├── route.ts            # GET/PATCH/DELETE
│   │   │       └── complete/route.ts   # POST mark complete
│   │   ├── crm/                        # APIs CRM directes
│   │   │   ├── prospects/route.ts
│   │   │   ├── stages/route.ts
│   │   │   ├── activities/route.ts
│   │   │   ├── tasks/route.ts
│   │   │   └── import/route.ts
│   │   ├── sheets/                     # APIs Google Sheets
│   │   │   ├── prospects/route.ts
│   │   │   ├── stats/route.ts
│   │   │   └── test/route.ts
│   │   ├── google/
│   │   │   ├── auth/route.ts
│   │   │   └── callback/route.ts
│   │   ├── webhooks/
│   │   │   ├── qualification/route.ts
│   │   │   ├── rdv-valide/route.ts
│   │   │   ├── plaquette/route.ts
│   │   │   └── send-rappel/route.ts
│   │   ├── organization/
│   │   ├── team/
│   │   ├── user/
│   │   └── prompts/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                             # shadcn components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MobileNav.tsx
│   ├── dashboard/
│   │   ├── DashboardContent.tsx        # Utilise /api/prospects/unified
│   │   ├── StatsCards.tsx
│   │   ├── ProspectsChart.tsx
│   │   ├── RecentProspects.tsx
│   │   └── ActivityFeed.tsx
│   ├── prospects/
│   │   └── ProspectsContent.tsx        # Utilise /api/prospects/unified
│   ├── crm/
│   │   ├── PipelineKanban.tsx          # Utilise /api/crm/* (à migrer)
│   │   ├── ProspectForm.tsx
│   │   ├── ProspectCard.tsx
│   │   └── ActivityTimeline.tsx
│   ├── planning/
│   │   ├── PlanningContent.tsx         # Utilise /api/planning
│   │   └── TaskForm.tsx
│   ├── auth/
│   ├── settings/
│   └── features/
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
│   └── utils.ts
├── hooks/
├── types/
│   ├── index.ts
│   └── crm.ts                          # Types CRM (CrmProspect, PipelineStage...)
└── middleware.ts
```

---

## 🗄️ STRUCTURE BASE DE DONNÉES SUPABASE

### Tables Principales

**organizations** - Entreprises clientes
```sql
- id UUID PRIMARY KEY
- name VARCHAR NOT NULL
- slug VARCHAR NOT NULL UNIQUE
- data_mode VARCHAR DEFAULT 'crm'        -- ⭐ 'sheet' | 'crm'
- google_sheet_id VARCHAR
- google_credentials JSONB
- logo_url VARCHAR
- primary_color VARCHAR DEFAULT '#6366f1'
- plan VARCHAR DEFAULT 'free'
- prompt_qualification JSONB
- prompt_synthese JSONB
- prompt_rappel JSONB
- prompt_plaquette JSONB
- plaquette_url VARCHAR
- scoring_config JSONB DEFAULT '{        -- ⭐ Config scoring IA
    "seuil_chaud": 70,
    "seuil_tiede": 40,
    "poids_revenus": 25,
    "poids_analyse_ia": 50,
    "poids_patrimoine": 25,
    "seuil_revenus_max": 10000,
    "seuil_revenus_min": 2500,
    "seuil_patrimoine_max": 300000,
    "seuil_patrimoine_min": 30000
  }'
- created_at, updated_at TIMESTAMPTZ
```

**users** - Utilisateurs (conseillers)
```sql
- id UUID PRIMARY KEY
- auth_id UUID UNIQUE                    -- Lien avec Supabase Auth
- organization_id UUID REFERENCES organizations(id)
- email VARCHAR NOT NULL
- full_name VARCHAR
- role VARCHAR DEFAULT 'conseiller'      -- 'admin' | 'conseiller'
- gmail_credentials JSONB
- avatar_url VARCHAR
- is_active BOOLEAN DEFAULT true
- created_at, updated_at TIMESTAMPTZ
```

### Tables CRM

**crm_prospects** - Prospects CRM
```sql
- id UUID PRIMARY KEY
- organization_id UUID REFERENCES organizations(id)
-- Identité
- first_name, last_name, email, phone VARCHAR
- company, job_title VARCHAR
- address TEXT, city, postal_code VARCHAR
- country VARCHAR DEFAULT 'France'
-- Profil financier (CGP)
- patrimoine_estime NUMERIC
- revenus_annuels NUMERIC
- situation_familiale VARCHAR
- nb_enfants INTEGER
- age INTEGER
- profession VARCHAR
-- Pipeline
- stage_id UUID REFERENCES pipeline_stages(id)
- stage_slug VARCHAR DEFAULT 'nouveau'
- deal_value NUMERIC
- close_probability INTEGER DEFAULT 50
- expected_close_date DATE
-- Qualification IA
- qualification VARCHAR DEFAULT 'non_qualifie'  -- 'CHAUD', 'TIEDE', 'FROID', 'non_qualifie'
- score_ia INTEGER
- analyse_ia TEXT
- derniere_qualification TIMESTAMPTZ
-- Source & Attribution
- source VARCHAR
- source_detail VARCHAR
- assigned_to UUID REFERENCES users(id)
- tags TEXT[]
- notes TEXT
-- Statut final
- lost_reason VARCHAR
- won_date TIMESTAMPTZ
- lost_date TIMESTAMPTZ
- last_activity_at TIMESTAMPTZ
-- Metadata
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()
```

**pipeline_stages** - Étapes du pipeline (configurables par org)
```sql
- id UUID PRIMARY KEY
- organization_id UUID REFERENCES organizations(id)
- name VARCHAR NOT NULL                   -- "Nouveau", "Contacté", etc.
- slug VARCHAR NOT NULL                   -- "nouveau", "contacte", etc.
- color VARCHAR DEFAULT '#6366f1'
- position INTEGER NOT NULL               -- Ordre d'affichage
- is_won BOOLEAN DEFAULT false
- is_lost BOOLEAN DEFAULT false
- default_probability INTEGER DEFAULT 50
- created_at TIMESTAMPTZ DEFAULT now()
```

**crm_activities** - Historique des interactions
```sql
- id UUID PRIMARY KEY
- organization_id, prospect_id, user_id UUID
- type VARCHAR NOT NULL                   -- 'note', 'call', 'email', 'meeting'
- direction VARCHAR                       -- 'inbound', 'outbound'
- subject VARCHAR
- content TEXT
- email_status VARCHAR
- email_opened_at TIMESTAMPTZ
- email_opened_count INTEGER DEFAULT 0
- duration_minutes INTEGER
- outcome VARCHAR
- metadata JSONB DEFAULT '{}'
- created_at TIMESTAMPTZ DEFAULT now()
```

**crm_events** - Événements / Planning (bi-mode)
```sql
- id UUID PRIMARY KEY
- organization_id UUID
- prospect_id UUID
- prospect_sheet_id VARCHAR               -- ⭐ Pour lien avec Sheet en mode bi-mode
- prospect_name VARCHAR
- type VARCHAR DEFAULT 'task'             -- 'task', 'call', 'meeting', 'reminder', 'email'
- title VARCHAR NOT NULL
- description TEXT
- start_date, end_date, due_date TIMESTAMPTZ
- all_day BOOLEAN DEFAULT false
- status VARCHAR DEFAULT 'pending'        -- 'pending', 'completed', 'cancelled'
- completed_at TIMESTAMPTZ
- assigned_to, created_by UUID
- priority VARCHAR DEFAULT 'medium'       -- 'low', 'medium', 'high', 'urgent'
- external_id VARCHAR                     -- Pour sync Google Calendar
- external_source VARCHAR
- metadata JSONB DEFAULT '{}'
- created_at, updated_at TIMESTAMPTZ
```

**crm_tasks** - Tâches (legacy, préférer crm_events)
```sql
- id UUID PRIMARY KEY
- organization_id, prospect_id UUID
- assigned_to, created_by UUID
- title VARCHAR NOT NULL
- description TEXT
- type VARCHAR DEFAULT 'task'             -- 'task', 'call', 'email', 'meeting', 'follow_up'
- priority VARCHAR DEFAULT 'medium'
- due_date TIMESTAMPTZ
- reminder_at TIMESTAMPTZ
- completed_at TIMESTAMPTZ
- is_completed BOOLEAN DEFAULT false
- created_at TIMESTAMPTZ DEFAULT now()
```

**crm_email_templates** - Templates d'emails
```sql
- id UUID PRIMARY KEY
- organization_id, created_by UUID
- name VARCHAR NOT NULL
- subject VARCHAR NOT NULL
- content TEXT NOT NULL
- category VARCHAR                        -- 'introduction', 'follow_up', 'proposal', 'closing', 'other'
- is_shared BOOLEAN DEFAULT true
- is_active BOOLEAN DEFAULT true
- usage_count INTEGER DEFAULT 0
- created_at, updated_at TIMESTAMPTZ
```

**crm_saved_filters** - Filtres sauvegardés
```sql
- id UUID PRIMARY KEY
- organization_id, user_id UUID
- name VARCHAR NOT NULL
- filters JSONB NOT NULL
- is_default BOOLEAN DEFAULT false
- is_shared BOOLEAN DEFAULT false
- created_at TIMESTAMPTZ DEFAULT now()
```

### Tables Système

**activity_logs** - Logs d'activité
```sql
- id UUID PRIMARY KEY
- organization_id, user_id UUID
- action VARCHAR NOT NULL
- details JSONB
- created_at TIMESTAMPTZ DEFAULT now()
```

**email_logs** - Historique des emails envoyés
```sql
- id UUID PRIMARY KEY
- organization_id UUID
- prospect_email, prospect_name VARCHAR
- email_type VARCHAR NOT NULL
- subject, body TEXT
- gmail_message_id VARCHAR
- has_attachment BOOLEAN DEFAULT false
- sent_at TIMESTAMPTZ DEFAULT now()
```

**daily_stats** - Stats quotidiennes
```sql
- id UUID PRIMARY KEY
- organization_id UUID
- date DATE NOT NULL
- total_prospects INTEGER DEFAULT 0
- prospects_chaud, prospects_tiede, prospects_froid INTEGER DEFAULT 0
- mails_envoyes, rdv_pris INTEGER DEFAULT 0
- created_at TIMESTAMPTZ DEFAULT now()
```

**prompts** - Prompts IA personnalisables
```sql
- id UUID PRIMARY KEY
- organization_id UUID
- type VARCHAR NOT NULL
- name VARCHAR NOT NULL
- system_prompt, user_prompt TEXT
- is_active BOOLEAN DEFAULT true
- created_at, updated_at TIMESTAMPTZ
```

**scheduled_emails** - Emails programmés (legacy, remplacé par QStash)
```sql
- id UUID PRIMARY KEY
- organization_id UUID
- prospect_data JSONB NOT NULL
- email_type VARCHAR NOT NULL
- scheduled_for TIMESTAMPTZ NOT NULL
- status VARCHAR DEFAULT 'pending'
- sent_at TIMESTAMPTZ
- error_message TEXT
- created_at TIMESTAMPTZ DEFAULT now()
```

### Tables Agent (Automatisation)

**agent_ideas** - Idées générées par l'agent
```sql
- id UUID PRIMARY KEY
- title VARCHAR NOT NULL
- description TEXT
- source VARCHAR DEFAULT 'auto'
- priority INTEGER DEFAULT 50
- status VARCHAR DEFAULT 'pending'
- telegram_message_id BIGINT
- created_at TIMESTAMP DEFAULT now()
```

**agent_tasks** - Tâches de l'agent
```sql
- id UUID PRIMARY KEY
- idea_id UUID REFERENCES agent_ideas(id)
- status VARCHAR DEFAULT 'pending'
- prompt TEXT NOT NULL
- branch_name, commit_hash, pr_url VARCHAR
- started_at, completed_at TIMESTAMP
- error_message TEXT
- created_at TIMESTAMP DEFAULT now()
```

**agent_runs** - Exécutions de l'agent
```sql
- id UUID PRIMARY KEY
- task_id UUID REFERENCES agent_tasks(id)
- agent VARCHAR
- status VARCHAR
- logs TEXT
- tokens_input, tokens_output, duration_seconds INTEGER
- created_at TIMESTAMP DEFAULT now()
```

---

## 🔌 INTERFACES & SERVICES BI-MODE

### Interfaces (`src/lib/services/interfaces/index.ts`)

```typescript
// Format unifié pour les prospects
export interface ProspectData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  source?: string;
  age?: number;
  situationPro?: string;
  revenusMensuels?: number;
  patrimoine?: number;
  besoins?: string;
  notesAppel?: string;
  
  stage: string;                          // 'nouveau', 'contacte', etc.
  qualification: 'CHAUD' | 'TIEDE' | 'FROID' | 'NON_QUALIFIE' | null;
  scoreIa?: number;
  justificationIa?: string;
  
  dateRdv?: string;
  rappelSouhaite?: string;
  mailPlaquetteEnvoye?: boolean;
  mailSyntheseEnvoye?: boolean;
  mailRappelEnvoye?: boolean;
  
  emailConseiller?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IProspectService {
  getAll(filters?: ProspectFilters): Promise<ProspectData[]>;
  getById(id: string): Promise<ProspectData | null>;
  create(data: Partial<ProspectData>): Promise<ProspectData>;
  update(id: string, data: Partial<ProspectData>): Promise<ProspectData>;
  delete(id: string): Promise<void>;
  updateStage(id: string, stage: string): Promise<ProspectData>;
  getByStage(): Promise<Record<string, ProspectData[]>>;
  getStats(): Promise<{ total: number; byQualification: Record<string, number>; byStage: Record<string, number>; }>;
}

export interface IPlanningService {
  getAll(filters?: PlanningFilters): Promise<PlanningEvent[]>;
  getById(id: string): Promise<PlanningEvent | null>;
  create(event: Partial<PlanningEvent>): Promise<PlanningEvent>;
  update(id: string, data: Partial<PlanningEvent>): Promise<PlanningEvent>;
  delete(id: string): Promise<void>;
  markComplete(id: string): Promise<PlanningEvent>;
  markIncomplete(id: string): Promise<PlanningEvent>;
  getByProspect(prospectId: string): Promise<PlanningEvent[]>;
}

export interface Organization {
  id: string;
  name: string;
  data_mode: 'sheet' | 'crm';
  google_sheet_id?: string;
}
```

### Factory Pattern

```typescript
// src/lib/services/factories/prospect-factory.ts
export function getProspectService(organization: Organization): IProspectService {
  if (organization.data_mode === 'sheet') {
    return new SheetProspectService(organization.id);
  }
  return new CrmProspectService(organization.id);
}

// src/lib/services/factories/planning-factory.ts
export function getPlanningService(organization: Organization, userId: string): IPlanningService {
  if (organization.data_mode === 'sheet') {
    return new SheetPlanningService(organization.id, userId);
  }
  return new CrmPlanningService(organization.id, userId);
}
```

### Mapping Sheet → CRM

| Champ Sheet (Google) | Champ Unifié | Champ CRM (Supabase) |
|---------------------|--------------|---------------------|
| nom | lastName | last_name |
| prenom | firstName | first_name |
| email | email | email |
| telephone | phone | phone |
| statutAppel | stage | stage_slug |
| qualificationIA | qualification | qualification |
| scoreIA | scoreIa | score_ia |
| justificationIA | justificationIa | analyse_ia |
| revenus | revenusMensuels | revenus_annuels / 12 |
| patrimoine | patrimoine | patrimoine_estime |

### Mapping Statut Appel → Stage

| Statut Sheet | Stage Pipeline |
|--------------|----------------|
| "" / "Nouveau" | nouveau |
| "Contacté", "Appelé", "Rappeler", "Plaquette" | contacte |
| "RDV Validé" | rdv_valide |
| "RDV Effectué", "Après RDV" | proposition |
| "Proposition", "Négociation" | negociation |
| "Gagné" | gagne |
| "Refusé", "Perdu" | perdu |

---

## 🔗 APIs

### APIs Unifiées (Bi-Mode)

| Endpoint | Méthodes | Description |
|----------|----------|-------------|
| `/api/prospects/unified` | GET, POST | Liste/Créer prospects |
| `/api/prospects/unified/stats` | GET | Statistiques |
| `/api/prospects/unified/by-stage` | GET | Prospects groupés par stage |
| `/api/prospects/unified/[id]` | GET, PATCH, DELETE | CRUD prospect |
| `/api/prospects/unified/[id]/stage` | PATCH | Update stage (drag&drop) |
| `/api/planning` | GET, POST | Liste/Créer événements |
| `/api/planning/[id]` | GET, PATCH, DELETE | CRUD événement |
| `/api/planning/[id]/complete` | POST | Marquer complété |

### APIs CRM (Direct Supabase)

| Endpoint | Usage |
|----------|-------|
| `/api/crm/prospects` | Liste avec relations (stage, assigned_user) |
| `/api/crm/prospects/[id]` | Détail prospect avec vue 360° |
| `/api/crm/stages` | Liste des stages pipeline |
| `/api/crm/activities` | Historique interactions |
| `/api/crm/tasks` | Tâches (legacy, utiliser planning) |
| `/api/crm/import` | Import CSV |

### APIs Google Sheets

| Endpoint | Usage |
|----------|-------|
| `/api/sheets/prospects` | Lit les prospects de la Sheet |
| `/api/sheets/stats` | Calcule stats depuis la Sheet |
| `/api/sheets/test` | Teste la connexion |

### Utilisation dans les composants

| Composant | API utilisée | Mode |
|-----------|--------------|------|
| DashboardContent | /api/prospects/unified/stats + /api/prospects/unified | Bi-Mode ✅ |
| ProspectsContent | /api/prospects/unified | Bi-Mode ✅ |
| PipelineKanban | /api/crm/stages + /api/crm/prospects | CRM only (à migrer) |
| /prospects/[id] | /api/crm/prospects/[id] | CRM only |
| PlanningContent | /api/planning | Bi-Mode ✅ |

---

## 🔐 AUTHENTIFICATION & SÉCURITÉ

### getCurrentUserAndOrganization()

```typescript
// src/lib/services/get-organization.ts
export async function getCurrentUserAndOrganization(): Promise<{
  user: { id: string; email: string };
  organization: Organization;
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const adminClient = createAdminClient();
  
  const { data: userData } = await adminClient
    .from('users')
    .select('id, email, organization_id')
    .eq('auth_id', user.id)
    .single();
    
  const { data: orgData } = await adminClient
    .from('organizations')
    .select('id, name, data_mode, google_sheet_id')
    .eq('id', userData.organization_id)
    .single();
    
  return { user: userData, organization: orgData };
}
```

### Pattern des APIs Unifiées

```typescript
export async function GET(request: NextRequest) {
  const context = await getCurrentUserAndOrganization();
  
  if (!context) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const service = getProspectService(context.organization);
  const data = await service.getAll();
  
  return NextResponse.json(data);
}
```

### createAdminClient() - Bypass RLS

```typescript
// src/lib/supabase-admin.ts
export function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
```

---

## 🔐 VARIABLES D'ENVIRONNEMENT

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Google OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # ou https://ultron-murex.vercel.app

# Anthropic (Claude AI)
ANTHROPIC_API_KEY=sk-ant-xxx

# Upstash QStash
QSTASH_TOKEN=xxx
QSTASH_CURRENT_SIGNING_KEY=xxx
QSTASH_NEXT_SIGNING_KEY=xxx
```

---

## 👥 GESTION MULTI-CONSEILLERS

### Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                    ENTREPRISE (Organization)                    │
│                                                                 │
│  data_mode: 'sheet' | 'crm'                                    │
│  Google Credentials (Sheets + Drive)                            │
│  ↓                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Conseiller A│  │ Conseiller B│  │ Conseiller C│             │
│  │ Gmail A     │  │ Gmail B     │  │ Gmail C     │             │
│  │ (admin)     │  │ (conseiller)│  │ (conseiller)│             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  Mode Sheet: Google Sheet partagée (colonne Z = Email)          │
│  Mode CRM: assigned_to dans crm_prospects                       │
└─────────────────────────────────────────────────────────────────┘
```

### OAuth Google - Deux types

| Type | URL | Stockage | Usage |
|------|-----|----------|-------|
| Organization | `/api/google/auth?type=organization` | organizations.google_credentials | Sheets, Drive |
| Gmail | `/api/google/auth?type=gmail` | users.gmail_credentials | Envoi emails |

---

## 🔄 WORKFLOWS AUTOMATISÉS

### 1. Qualification (/api/webhooks/qualification)
- Déclenché par Apps Script quand statut change
- Analyse le prospect avec Claude
- Retourne : qualification (CHAUD/TIEDE/FROID), score (0-100), priorité, justification
- Update colonnes Q, R, S, T de la Sheet

### 2. RDV Validé (/api/webhooks/rdv-valide)
- Déclenché quand statut = "RDV Validé"
- Qualifie le prospect si pas déjà fait
- Génère et envoie mail de synthèse
- Programme rappel 24h via QStash
- Update colonne X (Mail Synthèse = Oui)

### 3. Plaquette (/api/webhooks/plaquette)
- Déclenché quand statut = "À rappeler - Plaquette"
- Génère mail sobre + télécharge PDF depuis Drive
- Envoie avec pièce jointe
- Update colonne W (Mail Plaquette = Oui)

### 4. Rappel 24h (/api/webhooks/send-rappel)
- Appelé par QStash 24h avant le RDV
- Génère et envoie mail de rappel
- Update colonne Y (Mail Rappel 24h = Oui)

---

## 📊 STRUCTURE GOOGLE SHEET (26 COLONNES A-Z)

| Col | Lettre | Nom | Section |
|-----|--------|-----|---------|
| 1 | A | ID | Leads |
| 2 | B | Date Lead | Leads |
| 3 | C | Nom | Leads |
| 4 | D | Prénom | Leads |
| 5 | E | Email | Leads |
| 6 | F | Téléphone | Leads |
| 7 | G | Source | Leads |
| 8 | H | Âge | Leads |
| 9 | I | Situation Pro | Leads |
| 10 | J | Revenus Mensuels | Leads |
| 11 | K | Patrimoine | Leads |
| 12 | L | Besoins | Conseiller |
| 13 | M | Notes Appel | Conseiller |
| 14 | N | Statut Appel | Conseiller |
| 15 | O | Date RDV | Conseiller |
| 16 | P | Rappel Souhaité | Conseiller |
| 17 | Q | Qualification IA | IA |
| 18 | R | Score IA | IA |
| 19 | S | Priorité IA | IA |
| 20 | T | Justification IA | IA |
| 21 | U | RDV Prévu | IA |
| 22 | V | Lien Rappel Calendar | IA |
| 23 | W | Mail Plaquette Envoyé | IA |
| 24 | X | Mail Synthèse Envoyé | IA |
| 25 | Y | Mail Rappel 24h Envoyé | IA |
| 26 | Z | Email Conseiller | IA |

---

## 🎨 CONVENTIONS DE CODE

### Style
- Composants shadcn/ui au maximum
- Tailwind CSS (pas de CSS custom)
- Couleur primaire : Indigo (#6366f1)
- Cards : rounded-xl + shadow-sm

### TypeScript
- Toujours typer les props
- Types dans src/types/index.ts et src/types/crm.ts
- Éviter `any`

### Fichiers
- Composants : PascalCase (StatsCards.tsx)
- Services : kebab-case (prospect-service.ts)
- Hooks : camelCase avec `use` (useUser.ts)

### Imports
- Alias `@/` pour imports absolus
- Exemple : `import { Button } from "@/components/ui/button"`

### APIs
- Toujours `export const dynamic = 'force-dynamic'` pour les routes dynamiques
- Pattern : getCurrentUserAndOrganization() → Factory → Service

---

## 🚀 COMMANDES

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Build production
npm run lint         # Vérifier le code
```

### Git
```bash
git add .
git commit -m "type: description"
git push origin main
```

Convention commits : feat, fix, style, refactor, docs, chore

---

## 🔗 LIENS

- **Prod** : https://ultron-murex.vercel.app
- **GitHub** : https://github.com/martinborgis-lang/Ultron
- **Supabase** : https://supabase.com/dashboard
- **Vercel** : https://vercel.com
- **Anthropic** : https://console.anthropic.com
- **QStash** : https://console.upstash.com/qstash

---

## ⚠️ NOTES IMPORTANTES

1. **Architecture Bi-Mode** : Le mode est défini par `organizations.data_mode`. Les APIs unifiées routent automatiquement vers le bon service.

2. **Limitations Mode Sheet** :
   - Lecture seule pour les prospects (CRUD désactivé)
   - Drag & drop non disponible dans le Pipeline
   - Planning non encore implémenté (TODO: Google Calendar)

3. **Migration Pipeline** : Le composant PipelineKanban utilise encore les APIs `/api/crm/*` directement. À migrer vers `/api/prospects/unified/*`.

4. **RLS Bypass** : Les services utilisent `createAdminClient()` pour contourner RLS après vérification de l'auth.

5. **Multi-tenant** : Chaque org a ses propres credentials Google et chaque conseiller son Gmail.

6. **QStash** : Remplace le CRON Vercel pour les rappels 24h.

7. **Colonne Z** : Email du conseiller dans la Sheet pour identifier l'expéditeur.

---

## 📋 TODO / Prochaines étapes

1. [ ] Migrer PipelineKanban vers APIs unifiées
2. [ ] Implémenter SheetPlanningService avec Google Calendar API
3. [ ] Ajouter drag & drop en mode Sheet (update colonne Statut Appel)
4. [ ] Vue 360° prospect en mode Sheet
5. [ ] Sync bidirectionnelle Sheet ↔ CRM (optionnel)