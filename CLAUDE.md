# CLAUDE.md - Instructions pour Claude Code

## 🔍 RÈGLES DE RECHERCHE ET DOCUMENTATION

### ⚠️ TOUJOURS DEMANDER LA DOCUMENTATION OFFICIELLE

**Quand demander au user de vérifier la documentation externe :**
- Les APIs externes (VAPI, Twilio, Stripe, etc.) retournent des erreurs de format
- Les services tiers changent leur API (très fréquent avec VAPI, OpenAI, etc.)
- Les messages d'erreur indiquent un format ou paramètre non reconnu
- Les intégrations échouent avec des erreurs vagues ou de validation
- Doute sur les paramètres requis d'une API externe

**Phrases à utiliser :**
- "Peux-tu vérifier la doc VAPI récente sur [sujet] ?"
- "L'API semble avoir changé, peux-tu checker leur documentation ?"
- "Peux-tu regarder des exemples récents de [service] pour ce format ?"
- "Cette erreur suggère un changement d'API, vérifie leur changelog"
- "Peux-tu me donner un exemple de payload qui fonctionne depuis leur doc ?"

**NE JAMAIS tâtonner** avec des formats d'API quand on peut demander la source officielle !

---

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
- **🆕 Lead Finder** : Moteur de recherche prospects avec Outscraper et Google Places
- **🆕 LinkedIn Agent** : Générateur IA de posts LinkedIn professionnels
- **🆕 Agent Vocal IA** : Appels automatiques avec Vapi.ai et qualification IA
- **🆕 Click-to-Call** : Système d'appels WebRTC intégré avec Twilio
- **🆕 Calculateur Défiscalisation** : Simulations fiscales avancées
- **🆕 Générateur de Lettres** : Templates lettres automatisées (rachat, etc.)
- **🆕 Système GDPR** : Conformité protection données
- **🆕 Système Sécurité** : Protection injections et monitoring avancé

---

## 🏗️ ARCHITECTURE CRM

Ultron utilise une architecture CRM complète basée sur Supabase :

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Components                       │
│  (DashboardContent, ProspectsContent, PipelineKanban...)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                APIs CRM /api/prospects/unified/*             │
│              /api/planning/* (avec getCurrentUserAndOrg)     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CRM Services                              │
│         CrmProspectService & CrmPlanningService             │
│                (Supabase + RLS)                             │
│                   FULL CRUD                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ STACK TECHNIQUE

| Composant | Technologie |
|-----------|-------------|
| Framework | Next.js 16.1.1 (App Router) |
| Langage | TypeScript 5+ |
| Runtime | React 19.2.3 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Anthropic Claude Sonnet 4 |
| Email | Gmail API |
| Scheduling | Upstash QStash |
| Voice/Calls | Vapi.ai + Twilio WebRTC |
| Transcription | Deepgram |
| Drag & Drop | @dnd-kit/core |
| Icons | Lucide React |
| Charts | Recharts |
| Animations | Framer Motion + GSAP |
| 3D Graphics | Three.js + React Three Fiber |
| PDF Generation | jsPDF + jsPDF-AutoTable |
| Hosting | Vercel |
| Real-time | Supabase Realtime |
| Scroll | Lenis (smooth scroll) |

---

## 📁 STRUCTURE DU PROJET

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── complete-registration/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx                    # 🆕 Dashboard Admin principal
│   │   │   ├── prompts/page.tsx            # 🆕 Gestion prompts admin
│   │   │   └── sync/page.tsx               # 🆕 Synchronisation données
│   │   ├── prospects/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx               # Vue 360° prospect détaillée
│   │   ├── pipeline/page.tsx               # Kanban CRM avancé
│   │   ├── planning/page.tsx               # Tâches & événements avec Google Cal
│   │   ├── meetings/page.tsx               # 🆕 Gestion transcriptions RDV
│   │   ├── assistant/page.tsx              # 🆕 IA Assistant conversationnel
│   │   ├── leads-finder/page.tsx           # 🆕 Moteur recherche prospects
│   │   ├── linkedin-agent/page.tsx         # 🆕 Générateur posts LinkedIn IA
│   │   ├── voice/
│   │   │   ├── ai-agent/page.tsx           # 🆕 Dashboard Agent IA automatique
│   │   │   ├── calls/page.tsx              # 🆕 Historique appels
│   │   │   └── form-test/page.tsx          # 🆕 Test formulaires webhooks
│   │   ├── tasks/page.tsx                  # 🆕 Gestionnaire de tâches
│   │   ├── import/page.tsx                 # 🆕 Import CSV prospects
│   │   ├── agenda/page.tsx                 # 🆕 Vue calendrier avancée
│   │   ├── meeting/
│   │   │   └── prepare/[prospectId]/page.tsx # 🆕 Préparation RDV IA
│   │   ├── features/
│   │   │   ├── calculateur/page.tsx
│   │   │   └── defiscalisation/page.tsx    # 🆕 Calculateur défiscalisation
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── prompts/page.tsx
│   │       ├── products/page.tsx           # 🆕 Gestion produits
│   │       ├── scoring/page.tsx            # 🆕 Configuration scoring IA
│   │       ├── thresholds/page.tsx         # 🆕 Seuils admin
│   │       ├── voice/page.tsx              # 🆕 Configuration Agent IA vocal
│   │       └── team/page.tsx
│   ├── (legal)/                            # 🆕 Pages légales
│   │   ├── legal/page.tsx                  # Mentions légales
│   │   └── privacy/page.tsx                # Politique de confidentialité
│   ├── auth/
│   │   ├── callback/page.tsx
│   │   └── set-password/page.tsx
│   ├── api/
│   │   ├── prospects/
│   │   │   └── unified/                    # APIs CRM
│   │   │       ├── route.ts                # GET/POST prospects
│   │   │       ├── stats/route.ts          # GET stats
│   │   │       ├── by-stage/route.ts       # GET groupé par stage
│   │   │       └── [id]/
│   │   │           ├── route.ts            # GET/PATCH/DELETE
│   │   │           └── stage/route.ts      # PATCH stage (drag&drop)
│   │   ├── planning/                       # APIs CRM
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
│   │   ├── leads/                          # 🆕 APIs Lead Finder
│   │   │   ├── search/route.ts             # POST recherche prospects
│   │   │   ├── import/route.ts             # POST import vers CRM
│   │   │   ├── credits/route.ts            # GET crédits disponibles
│   │   │   └── stats/route.ts              # GET statistiques recherches
│   │   ├── linkedin/                       # 🆕 APIs LinkedIn Agent
│   │   │   ├── config/route.ts             # GET/POST configuration cabinet
│   │   │   ├── generate/route.ts           # POST génération post IA
│   │   │   └── posts/route.ts              # GET historique posts
│   │   ├── voice/                          # 🆕 APIs Agent Vocal & Click-to-Call
│   │   │   ├── ai-agent/
│   │   │   │   ├── config/route.ts         # GET/POST configuration agent IA
│   │   │   │   ├── webhook/route.ts        # POST webhook formulaires web
│   │   │   │   ├── vapi-webhook/route.ts   # POST webhook Vapi.ai
│   │   │   │   ├── execute-call/route.ts   # POST exécution appel programmé
│   │   │   │   ├── call/route.ts           # GET/POST appels manuels
│   │   │   │   ├── book-appointment/route.ts # POST prise RDV
│   │   │   │   ├── available-slots/route.ts # GET créneaux disponibles
│   │   │   │   └── stats/route.ts          # GET statistiques agent vocal
│   │   │   ├── calls/                      # 🆕 APIs historique appels
│   │   │   │   ├── route.ts                # GET/POST appels WebRTC
│   │   │   │   └── stats/route.ts          # GET statistiques appels
│   │   │   ├── click-to-call/
│   │   │   │   ├── token/route.ts          # GET token Twilio WebRTC
│   │   │   │   ├── call/route.ts           # POST initiation appel
│   │   │   │   ├── hangup/route.ts         # POST fin appel avec outcome
│   │   │   │   ├── twiml/route.ts          # GET configuration TwiML
│   │   │   │   ├── twilio-webhook/route.ts # POST webhook événements Twilio
│   │   │   │   ├── recording-webhook/route.ts # POST webhook enregistrements
│   │   │   │   └── save-notes/route.ts     # POST sauvegarde notes appel
│   │   │   ├── config/route.ts             # GET/POST configuration générale
│   │   │   ├── setup/route.ts              # POST configuration initiale
│   │   │   ├── debug/route.ts              # 🆕 Debug et diagnostics
│   │   │   ├── fix-status/route.ts         # 🆕 Correction statuts appels
│   │   │   ├── migrate-scheduled/route.ts  # 🆕 Migration appels programmés
│   │   │   ├── test-call/route.ts          # 🆕 Test appels
│   │   │   ├── test-direct/route.ts        # 🆕 Test appels directs
│   │   │   ├── test-execute/route.ts       # 🆕 Test exécution
│   │   │   ├── test-format/route.ts        # 🆕 Test formats
│   │   │   ├── test-fresh/route.ts         # 🆕 Test nouvelles fonctionnalités
│   │   │   └── form/organization/route.ts  # 🆕 Configuration organisation
│   │   ├── extension/                      # 🆕 APIs Extension Chrome
│   │   │   ├── analyze/route.ts            # POST analyse prospect
│   │   │   ├── analyze-realtime/route.ts   # POST analyse temps réel
│   │   │   ├── prospects/route.ts          # GET prospects pour extension
│   │   │   ├── search-prospect/route.ts    # POST recherche prospect
│   │   │   ├── prospect/[id]/route.ts      # GET détail prospect
│   │   │   └── calendar-events/route.ts    # 🆕 GET événements calendrier
│   │   ├── assistant/route.ts              # 🆕 POST IA Assistant chat
│   │   ├── admin/                          # 🆕 APIs Dashboard Admin
│   │   │   ├── stats/route.ts              # GET statistiques admin
│   │   │   ├── charts/route.ts             # GET données graphiques
│   │   │   ├── thresholds/route.ts         # GET/POST seuils config
│   │   │   ├── revenue-breakdown/route.ts  # GET répartition revenus
│   │   │   ├── check-prompts/route.ts      # 🆕 Vérification prompts
│   │   │   ├── init-prompts/route.ts       # 🆕 Initialisation prompts
│   │   │   ├── clean-rdv-effectue/route.ts # 🆕 Nettoyage RDV effectués
│   │   │   ├── force-stages/route.ts       # 🆕 Force synchronisation stages
│   │   │   ├── migrate-stages-rdv/route.ts # 🆕 Migration stages RDV
│   │   │   ├── sync-stages/route.ts        # 🆕 Synchronisation stages
│   │   │   └── test-email-scheduling/route.ts # 🆕 Test programmation emails
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
│   │   │   ├── send-rappel/route.ts
│   │   │   └── send-scheduled-email/route.ts # 🆕 Envoi emails programmés
│   │   ├── agents/                         # 🆕 APIs Agents automatisés
│   │   │   ├── telegram/route.ts           # Webhook Telegram
│   │   │   └── trigger/route.ts            # Déclenchement agents
│   │   ├── organization/
│   │   │   ├── email-settings/route.ts     # 🆕 Configuration emails
│   │   │   ├── plaquette/route.ts          # 🆕 Gestion plaquettes
│   │   │   └── scoring/route.ts            # 🆕 Configuration scoring
│   │   ├── team/
│   │   │   ├── route.ts                    # GET/POST équipe
│   │   │   └── [id]/
│   │   │       ├── route.ts                # GET/PATCH/DELETE membre
│   │   │       └── gmail/
│   │   │           ├── route.ts            # Configuration Gmail
│   │   │           └── test/route.ts       # Test configuration Gmail
│   │   ├── user/
│   │   │   └── me/route.ts                 # GET profil utilisateur
│   │   ├── prompts/
│   │   │   ├── route.ts                    # GET/POST prompts
│   │   │   └── test/route.ts               # 🆕 Test prompts
│   │   ├── fiscal/                         # 🆕 APIs défiscalisation
│   │   │   └── simulate/route.ts           # Simulation défiscalisation
│   │   ├── gdpr/                           # 🆕 APIs conformité GDPR
│   │   │   ├── delete/route.ts             # Suppression données
│   │   │   ├── export/route.ts             # Export données
│   │   │   └── rectify/route.ts            # Rectification données
│   │   ├── letters/                        # 🆕 APIs génération lettres
│   │   │   ├── generate/route.ts           # Génération lettres
│   │   │   └── pdf/route.ts                # Export PDF lettres
│   │   ├── sales/                          # 🆕 APIs gestion ventes
│   │   │   ├── route.ts                    # CRUD ventes
│   │   │   ├── calculate/route.ts          # Calculs commissions
│   │   │   └── commissions/route.ts        # Gestion commissions
│   │   ├── security/                       # 🆕 APIs sécurité
│   │   │   ├── stats/route.ts              # Statistiques sécurité
│   │   │   ├── test/
│   │   │   │   ├── route.ts                # Tests sécurité
│   │   │   │   └── attack/route.ts         # Tests d'attaque
│   │   │   └── test-email-templates/route.ts
│   │   ├── unsubscribe/                    # 🆕 APIs désabonnement
│   │   │   ├── route.ts                    # Désabonnement
│   │   │   └── verify/route.ts             # Vérification désabonnement
│   │   ├── gmail/test/route.ts             # 🆕 Test Gmail
│   │   ├── test-db/route.ts                # 🆕 Test base de données
│   │   ├── pagination/test/route.ts        # 🆕 Test pagination
│   │   ├── debug/plaquette/route.ts        # 🆕 Debug plaquettes
│   │   ├── security-test/route.ts          # 🆕 Test sécurité global
│   │   └── prompt-security-test/route.ts   # 🆕 Test sécurité prompts
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
│   ├── voice/                              # 🆕 Composants Agent Vocal
│   │   ├── CallWidget.tsx                  # Widget appels WebRTC intégré
│   │   └── CallHistoryContent.tsx          # 🆕 Historique des appels
│   ├── prospects/
│   │   ├── ProspectsContent.tsx            # Utilise /api/prospects/unified
│   │   ├── AdvancedFilters.tsx             # 🆕 Filtres avancés prospects
│   │   └── RDVHistorySection.tsx           # 🆕 Historique RDV
│   ├── crm/
│   │   ├── PipelineKanban.tsx              # Utilise /api/crm/* (à migrer)
│   │   ├── ProspectForm.tsx
│   │   ├── ProspectCard.tsx
│   │   ├── DealProductSelector.tsx         # 🆕 Sélecteur produits
│   │   ├── SaleClosureForm.tsx             # 🆕 Formulaire clôture vente
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
│   │   ├── PromptEditor.tsx                # 🆕 Éditeur prompt individuel
│   │   ├── ProductsManager.tsx             # 🆕 Gestionnaire produits
│   │   ├── ScoringConfig.tsx               # 🆕 Configuration scoring
│   │   ├── ThresholdConfigForm.tsx         # 🆕 Configuration seuils
│   │   ├── EmailRecapConfig.tsx            # 🆕 Configuration récap emails
│   │   ├── PasswordChangeForm.tsx          # 🆕 Changement mot de passe
│   │   ├── PlaquetteConfig.tsx
│   │   ├── TeamManager.tsx
│   │   ├── GmailTestButton.tsx
│   │   └── ThemeSelector.tsx
│   ├── features/
│   │   ├── InterestCalculator.tsx
│   │   └── FiscalCalculator.tsx            # 🆕 Calculateur défiscalisation
│   ├── letters/                            # 🆕 Composants génération lettres
│   │   ├── LetterGeneratorModal.tsx
│   │   ├── RachatLetterForm.tsx
│   │   └── StopPrelevementForm.tsx
│   ├── debug/                              # 🆕 Composants debug/admin
│   │   ├── AdminApiTest.tsx
│   │   ├── AdminNavTest.tsx
│   │   └── UserDebug.tsx
│   ├── providers/                          # 🆕 Providers React
│   │   └── ThemeProvider.tsx
│   └── auth/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── admin.ts
│   │   └── middleware.ts               # 🆕 Middleware Supabase
│   ├── supabase-admin.ts               # createAdminClient() bypass RLS
│   ├── services/                       # ARCHITECTURE CRM
│   │   ├── interfaces/
│   │   │   └── index.ts                # IProspectService, IPlanningService
│   │   ├── crm/
│   │   │   ├── prospect-service.ts     # CrmProspectService
│   │   │   └── planning-service.ts     # CrmPlanningService
│   │   ├── admin/
│   │   │   └── admin-stats-service.ts  # 🆕 Service statistiques admin
│   │   ├── workflows/                  # 🆕 Services workflows
│   │   │   ├── index.ts
│   │   │   └── crm-workflow-service.ts
│   │   ├── commission-service.ts       # 🆕 Service commissions
│   │   ├── scheduled-email-service.ts  # 🆕 Service emails programmés
│   │   ├── transcription-service.ts    # 🆕 Service transcription
│   │   ├── twilio-service.ts           # 🆕 Service Twilio WebRTC
│   │   ├── vapi-service.ts             # 🆕 Service Vapi.ai Agent IA
│   │   └── get-organization.ts         # getCurrentUserAndOrganization()
│   ├── assistant/                      # 🆕 Services IA Assistant
│   │   ├── result-formatter.ts
│   │   ├── schema-context.ts
│   │   ├── sql-generator.ts
│   │   └── sql-validator.ts
│   ├── validation/                     # 🆕 Services validation sécurité
│   │   ├── email-rate-limiting.ts
│   │   ├── email-security.ts
│   │   ├── prompt-injection-protection.ts
│   │   └── sql-injection-protection.ts
│   ├── security/                       # 🆕 Middleware sécurité
│   │   └── security-middleware.ts
│   ├── pagination/                     # 🆕 Helpers pagination
│   │   └── pagination-helper.ts
│   ├── engines/                        # 🆕 Moteurs calcul fiscal
│   │   ├── income-tax-engine.ts
│   │   └── product-tax-engine.ts
│   ├── gdpr/                           # 🆕 Services GDPR
│   │   ├── email-footer.ts
│   │   └── unsubscribe-token.ts
│   ├── utils/                          # 🆕 Utilitaires
│   │   └── replace-placeholders.ts
│   ├── google.ts
│   ├── google-calendar.ts              # 🆕 Intégration Google Calendar
│   ├── gmail.ts
│   ├── calendar.ts                     # 🆕 Service calendrier
│   ├── anthropic.ts
│   ├── deepgram.ts                     # 🆕 Service transcription Deepgram
│   ├── qstash.ts
│   ├── telegram.ts                     # 🆕 Service Telegram
│   ├── cors.ts                         # 🆕 Configuration CORS extension
│   ├── extension-auth.ts               # 🆕 Auth extension Chrome
│   ├── pdf-generator.ts                # 🆕 Générateur PDF
│   ├── logger.ts                       # 🆕 Logger système
│   ├── errors.ts                       # 🆕 Gestion erreurs
│   └── utils.ts
├── hooks/
├── types/
│   ├── index.ts                        # Types généraux
│   ├── crm.ts                          # Types CRM (CrmProspect, PipelineStage...)
│   ├── products.ts                     # 🆕 Types produits et commissions
│   ├── meeting.ts                      # 🆕 Types transcriptions et meetings
│   ├── pipeline.ts                     # 🆕 Types pipeline bi-mode
│   ├── voice.ts                        # 🆕 Types Agent IA vocal et WebRTC
│   ├── leads.ts                        # 🆕 Types Lead Finder et scraping
│   ├── assistant.ts                    # 🆕 Types IA Assistant
│   ├── database.ts                     # 🆕 Types base de données
│   ├── email.ts                        # 🆕 Types système email
│   └── fiscalite.ts                    # 🆕 Types calculs fiscaux
└── middleware.ts
```

---

## 🗄️ STRUCTURE RÉELLE BASE DE DONNÉES SUPABASE

> **Analyse Export Réel :** Structure basée sur l'export Supabase du projet en production

### 📊 Vue d'ensemble Architecture Multi-Tenant (32+ Tables)

```
🏢 ORGANIZATIONS (Multi-tenant)
├── 👥 USERS (Admins + Conseillers)
├── 🛍️ PRODUCTS & COMMISSIONS System
├── 🎯 CRM Complete (Prospects + Pipeline + Activities + Events + Tasks)
├── 📹 MEETINGS & Transcription IA
├── 📧 EMAIL System (Templates + Logs + Scheduled)
├── 🗣️ VOICE System (Calls + Config + Webhooks + Scripts)
├── 🔍 LEAD FINDER (Credits + Searches + Results + Stats)
├── 🔗 LINKEDIN Agent (Config + Posts)
├── 📊 ADMIN Analytics & Thresholds
├── 🤖 AGENT Automation (Ideas + Tasks + Runs)
├── 🚨 PROMPTS System
└── ⚙️ SYSTEM Configuration
```

### 🗃️ **TABLES RÉELLES IDENTIFIÉES (32 Tables)**

**🏢 Core Multi-Tenant :**
- `organizations` - Organisations clientes
- `users` - Utilisateurs (admin/conseillers)
- `pipeline_stages` - Étapes pipeline configurables

**🎯 CRM Complet :**
- `crm_prospects` - Prospects avec qualification IA
- `crm_activities` - Historique interactions
- `crm_events` - Planning et événements
- `crm_tasks` - Tâches CRM
- `crm_email_templates` - Templates emails
- `crm_saved_filters` - Filtres sauvegardés

**🛍️ Produits & Commissions :**
- `products` - Catalogue produits
- `advisor_commissions` - Commissions conseillers
- `deal_products` - Deals/ventes

**📧 Système Email :**
- `scheduled_emails` - Emails programmés
- `email_logs` - Historique emails envoyés

**🗣️ Système Voice :**
- `voice_config` - Configuration agents vocaux
- `voice_calls` - Appels WebRTC Twilio
- `voice_scripts` - Scripts conversation
- `voice_webhooks` - Webhooks formulaires
- `phone_calls` - Appels Vapi.ai

**🔍 Lead Finder :**
- `lead_credits` - Crédits recherche
- `lead_searches` - Historique recherches
- `lead_results` - Prospects trouvés
- `lead_stats` - Statistiques

**🔗 LinkedIn Agent :**
- `linkedin_config` - Configuration cabinet
- `linkedin_posts` - Posts générés IA

**📹 Meetings :**
- `meeting_transcripts` - Transcriptions IA

**📊 Analytics :**
- `daily_stats` - Statistiques quotidiennes
- `activity_logs` - Logs d'activité

**🤖 Agent System :**
- `agent_ideas` - Idées automatiques
- `agent_tasks` - Tâches agents
- `agent_runs` - Exécutions

**🚨 Configuration :**
- `prompts` - Prompts configurables

### 📋 **STRUCTURE DÉTAILLÉE DES TABLES PRINCIPALES**

**🎯 crm_prospects** - Prospects avec qualification IA avancée
*Structure réelle (39 colonnes) :*
```sql
CREATE TABLE crm_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),

  -- Identité complète
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  job_title VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'France',

  -- Profil financier CGP
  patrimoine_estime NUMERIC,
  revenus_annuels NUMERIC,
  situation_familiale VARCHAR(50),
  nb_enfants INTEGER,
  age INTEGER,
  profession VARCHAR(100),

  -- Pipeline management
  stage_id UUID REFERENCES pipeline_stages(id),
  stage_slug VARCHAR(50) DEFAULT 'nouveau',
  deal_value NUMERIC,
  close_probability INTEGER DEFAULT 50,
  expected_close_date DATE,

  -- Qualification IA ⭐
  qualification VARCHAR(20) DEFAULT 'non_qualifie',
  score_ia INTEGER,
  analyse_ia TEXT,
  derniere_qualification TIMESTAMPTZ,

  -- Source & Attribution
  source VARCHAR(100),
  source_detail VARCHAR(255),
  assigned_to UUID REFERENCES users(id),
  tags TEXT[],
  notes TEXT,

  -- Statut final
  lost_reason VARCHAR(255),
  won_date TIMESTAMPTZ,
  lost_date TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,

  -- Emails automatiques (nouveaux)
  mail_plaquette_sent BOOLEAN DEFAULT false,
  mail_synthese_sent BOOLEAN DEFAULT false,
  mail_rappel_sent BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**🗣️ voice_calls** - Appels WebRTC avec Twilio
*Structure réelle (18 colonnes) :*
```sql
CREATE TABLE voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  prospect_id UUID REFERENCES crm_prospects(id),

  -- Identifiant Twilio
  twilio_call_sid VARCHAR(100) UNIQUE,

  -- Détails appel
  phone_number VARCHAR(20) NOT NULL,
  prospect_name VARCHAR(200),
  direction VARCHAR(20) DEFAULT 'outbound',

  -- Statut et timing
  status VARCHAR(20) DEFAULT 'initiated',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Résultats
  outcome VARCHAR(50),
  notes TEXT,
  next_action VARCHAR(100),

  -- Enregistrement et coûts
  recording_url VARCHAR(500),
  cost_cents INTEGER DEFAULT 0,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**📞 phone_calls** - Appels Vapi.ai automatiques
*Structure réelle (20+ colonnes) :*
```sql
CREATE TABLE phone_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  prospect_id UUID REFERENCES crm_prospects(id),

  -- Informations appel
  to_number VARCHAR NOT NULL,
  from_number VARCHAR,

  -- Intégrations
  vapi_call_id VARCHAR UNIQUE,
  vapi_assistant_id VARCHAR,
  twilio_call_sid VARCHAR UNIQUE,

  -- Statut et timing
  status VARCHAR DEFAULT 'queued',
  outcome VARCHAR,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Programmation
  scheduled_call_at TIMESTAMPTZ,

  -- Transcription et analyse IA
  transcript TEXT,
  transcript_confidence NUMERIC,
  ai_analysis JSONB,

  -- Métadonnées
  source VARCHAR DEFAULT 'manual',
  processing_notes TEXT,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**📧 scheduled_emails** - Emails programmés avec délai
*Structure réelle (12 colonnes) :*
```sql
CREATE TABLE scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  prospect_id UUID REFERENCES crm_prospects(id),
  advisor_id UUID REFERENCES users(id),

  -- Type et timing
  email_type VARCHAR(50) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,

  -- Status
  status VARCHAR(20) DEFAULT 'pending',

  -- Contenu flexible
  email_data JSONB NOT NULL,

  -- Gestion erreurs
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**🔍 lead_searches** - Historique recherches prospects
*Structure réelle (11 colonnes) :*
```sql
CREATE TABLE lead_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),

  search_type VARCHAR(20) NOT NULL,
  profession VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  postal_code VARCHAR(10),
  leads_requested INTEGER NOT NULL,
  leads_found INTEGER DEFAULT 0,
  credits_consumed INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  api_source VARCHAR(50),

  created_at TIMESTAMPTZ DEFAULT now()
);
```

**🤖 agent_runs** - Exécutions agents automatisés
*Structure réelle (9 colonnes) :*
```sql
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID,
  agent VARCHAR(50),
  status VARCHAR(50),
  logs TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**👥 users** - Utilisateurs (Admins + Conseillers)
*Structure réelle (12+ colonnes) :*
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

**crm_events** - Planning CRM
```sql
CREATE TABLE crm_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Liaison prospect
  prospect_id UUID REFERENCES crm_prospects(id) ON DELETE CASCADE,
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

### 🔍 Lead Finder Module

**lead_credits** - Gestion crédits recherche prospects
```sql
CREATE TABLE lead_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  credits_total INTEGER DEFAULT 0 CHECK (credits_total >= 0),
  credits_used INTEGER DEFAULT 0 CHECK (credits_used >= 0),
  last_purchase_date TIMESTAMPTZ,
  last_usage_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_credits CHECK (credits_used <= credits_total),
  UNIQUE(organization_id)
);
```

**lead_searches** - Historique recherches prospects
```sql
CREATE TABLE lead_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  search_type VARCHAR(20) NOT NULL CHECK (search_type IN ('particulier', 'entreprise')),
  profession VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  postal_code VARCHAR(10),
  leads_requested INTEGER NOT NULL CHECK (leads_requested > 0),
  leads_found INTEGER DEFAULT 0 CHECK (leads_found >= 0),
  credits_consumed INTEGER DEFAULT 0 CHECK (credits_consumed >= 0),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  api_source VARCHAR(50), -- 'outscraper', 'google_places', 'demo'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**lead_results** - Prospects trouvés avant import CRM
```sql
CREATE TABLE lead_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID NOT NULL REFERENCES lead_searches(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255),
  company_name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(500),
  address TEXT,
  city VARCHAR(255),
  postal_code VARCHAR(10),
  source VARCHAR(100) NOT NULL,
  imported_to_crm BOOLEAN DEFAULT FALSE,
  prospect_id UUID,
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 🔗 LinkedIn Agent Module

**linkedin_config** - Configuration cabinet LinkedIn
```sql
CREATE TABLE linkedin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  cabinet_name VARCHAR(255),
  cabinet_description TEXT,
  cabinet_specialties TEXT[], -- ['PER', 'Immobilier', 'Succession']
  years_experience INTEGER,
  clients_count INTEGER,
  average_return DECIMAL(5,2), -- Rendement moyen en %
  website_url VARCHAR(500),
  booking_url VARCHAR(500),
  tone VARCHAR(50) DEFAULT 'professionnel',
  target_audience TEXT,
  topics_to_avoid TEXT,
  preferred_hashtags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**linkedin_posts** - Historique posts générés
```sql
CREATE TABLE linkedin_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  hook TEXT, -- L'accroche du post
  topic VARCHAR(255), -- Thème principal
  news_source VARCHAR(500),
  suggested_image_description TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'published', 'rejected')),
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 🤖 Agent Vocal IA Module

**voice_config** - Configuration Agent IA par organisation
```sql
CREATE TABLE voice_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vapi_api_key TEXT NOT NULL, -- Chiffré
    vapi_phone_number VARCHAR(20),
    agent_name VARCHAR(100) DEFAULT 'Assistant Ultron',
    agent_voice VARCHAR(50) DEFAULT 'jennifer',
    working_hours_start TIME DEFAULT '09:00',
    working_hours_end TIME DEFAULT '18:00',
    working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
    system_prompt TEXT DEFAULT 'Vous êtes un assistant commercial pour un cabinet de gestion de patrimoine.',
    max_call_duration_seconds INTEGER DEFAULT 300,
    retry_on_no_answer BOOLEAN DEFAULT true,
    max_retry_attempts INTEGER DEFAULT 2,
    call_delay_minutes INTEGER DEFAULT 5,
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id)
);
```

**phone_calls** - Appels téléphoniques effectués
```sql
CREATE TABLE phone_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    prospect_id UUID REFERENCES crm_prospects(id) ON DELETE SET NULL,
    from_number VARCHAR(20),
    to_number VARCHAR(20) NOT NULL,
    vapi_call_id VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN (
        'queued', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer', 'busy', 'cancelled'
    )),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    transcript_text TEXT,
    transcript_json JSONB,
    qualification_score INTEGER CHECK (qualification_score >= 0 AND qualification_score <= 100),
    qualification_result VARCHAR(20) CHECK (qualification_result IN ('CHAUD', 'TIEDE', 'FROID', 'NON_QUALIFIE')),
    outcome VARCHAR(20) DEFAULT 'unknown' CHECK (outcome IN (
        'appointment_booked', 'callback_requested', 'not_interested', 'wrong_number', 'unknown'
    )),
    appointment_date TIMESTAMPTZ,
    cost_cents INTEGER,
    answered BOOLEAN DEFAULT false,
    source VARCHAR(50),
    recording_url VARCHAR(500),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**voice_webhooks** - Webhooks formulaires déclenchant appels
```sql
CREATE TABLE voice_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL, -- 'contact_form', 'landing_page', 'facebook_lead'
    prospect_data JSONB NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(255),
    name VARCHAR(200),
    processed BOOLEAN DEFAULT false,
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN (
        'pending', 'processing', 'completed', 'failed', 'skipped'
    )),
    prospect_created_id UUID REFERENCES crm_prospects(id),
    call_created_id UUID REFERENCES phone_calls(id),
    scheduled_call_at TIMESTAMPTZ,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
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

### 🔍 Lead Finder - Moteur de Recherche Prospects
**Localisation :** `/leads-finder`, `/src/app/api/leads/*`

Système avancé de scraping et recherche de prospects qualifiés :

**Fonctionnalités principales :**
- **3 catégories de prospects** : Commerçants/Artisans, Professions libérales, Dirigeants d'entreprises
- **Sources multiples** : Google Places API, Outscraper API, Pappers API (dirigeants)
- **Recherche géolocalisée** : Par ville, code postal, rayons personnalisés
- **Système de crédits** : Gestion consommation et facturation par recherche
- **Import CRM automatique** : Intégration directe dans le pipeline prospects
- **Validation qualité** : Score de fiabilité et validation des données

**Types de recherche :**
- **Commerçants & Artisans** : Plombiers, électriciens, restaurants, commerces via Google Maps
- **Professions libérales** : Médecins, avocats, notaires, architectes avec coordonnées
- **Dirigeants d'entreprises** : Gérants, PDG avec données légales (SIREN, capital, effectif)

**APIs Lead Finder :**
- `GET /api/leads/credits` - Consulter crédits disponibles
- `POST /api/leads/search` - Lancer recherche prospects
- `POST /api/leads/import` - Importer leads vers CRM
- `GET /api/leads/stats` - Statistiques recherches et qualité

**Base de données :**
- `lead_credits` : Gestion crédits par organisation
- `lead_searches` : Historique des recherches avec paramètres
- `lead_results` : Leads trouvés avant import CRM
- `lead_stats` : Métriques quotidiennes lead scraping

### 🔗 LinkedIn Agent - Générateur Posts IA
**Localisation :** `/linkedin-agent`, `/src/app/api/linkedin/*`

Agent IA pour création automatique de posts LinkedIn professionnels :

**Fonctionnalités de génération :**
- **8 thèmes spécialisés** : Marchés financiers, épargne, fiscalité, retraite, immobilier, conseils, sujets personnalisés
- **Mode automatique** : IA sélectionne l'actualité la plus pertinente
- **Configuration cabinet** : Personnalisation complète identité, ton, valeurs
- **Historique et réutilisation** : Archive des posts générés avec filtres
- **Preview en temps réel** : Aperçu style LinkedIn avant publication

**Configuration avancée :**
- **Identité cabinet** : Nom, description, années d'expérience, spécialités
- **Chiffres de crédibilité** : Nombre clients, rendement moyen, encours gestion
- **Style de communication** : 4 tons (professionnel, accessible, expert, décontracté)
- **Hashtags favoris** : Personnalisation tags métier
- **Plaquette PDF** : Upload pour inspiration IA (à venir)

**APIs LinkedIn Agent :**
- `GET/POST /api/linkedin/config` - Configuration cabinet
- `POST /api/linkedin/generate` - Génération post IA
- `GET /api/linkedin/posts` - Historique posts générés

**Tables dédiées :**
- `linkedin_config` : Configuration cabinet par organisation
- `linkedin_posts` : Historique posts générés avec métadonnées

### 🤖 Agent Vocal IA - Appels Automatiques
**Localisation :** `/voice/ai-agent`, `/src/app/api/voice/ai-agent/*`

Système complet d'appels automatiques avec IA conversationnelle :

**Fonctionnalités principales :**
- **Appels automatiques** : Déclenchement via formulaires web ou manuel
- **IA conversationnelle** : Qualification intelligente avec Vapi.ai
- **Horaires programmés** : Configuration plages de travail et délais
- **Qualification temps réel** : Score IA et classification CHAUD/TIÈDE/FROID
- **Transcription complète** : Analyse conversation et extraction insights
- **Prise RDV automatique** : Intégration calendrier avec confirmation

**Configuration Agent IA :**
- **Voix personnalisables** : 8 voix disponibles (Jennifer, Alex, Sarah, etc.)
- **Scripts configurables** : Prompts système et questions qualification
- **Horaires de travail** : Jours/heures d'activité avec timezone
- **Paramètres avancés** : Durée max, tentatives, délais entre appels
- **Webhooks Vapi.ai** : Réception événements temps réel

**Webhooks et intégrations :**
- `POST /api/voice/ai-agent/webhook` - Réception formulaires web
- `POST /api/voice/ai-agent/vapi-webhook` - Événements Vapi.ai
- `POST /api/voice/ai-agent/execute-call` - Exécution appel programmé
- `GET/POST /api/voice/ai-agent/config` - Configuration agent
- `POST /api/voice/ai-agent/call` - Lancement appel manuel

**Analytics avancés :**
- **Dashboard temps réel** : Appels effectués, RDV pris, taux réponse
- **ROI tracking** : Coût par appel, conversion, rentabilité
- **Performance hebdo/mensuelle** : Tendances et évolutions

### 📞 Click-to-Call - Appels WebRTC Intégrés
**Localisation :** `/components/voice/CallWidget.tsx`, `/api/voice/click-to-call/*`

Widget d'appels WebRTC intégré directement dans l'interface :

**Fonctionnalités d'appel :**
- **WebRTC natif** : Appels via navigateur sans plugin
- **Intégration Twilio** : Infrastructure téléphonique professionnelle
- **Interface temps réel** : Timer, contrôles mute, raccrochage
- **Notes d'appel** : Saisie notes pendant et après conversation
- **Classification outcome** : RDV pris, callback, pas intéressé, etc.
- **Actions post-appel** : Programmation rappels et suivi automatique

**Gestion des appels :**
- **Historique complet** : Tous les appels avec durées et résultats
- **Intégration CRM** : Mise à jour automatique statut prospect
- **Activités générées** : Création activité CRM pour chaque appel
- **Métriques téléphonie** : Durées, issues, taux de succès

**APIs Click-to-Call :**
- `GET /api/voice/click-to-call/token` - Token Twilio WebRTC
- `POST /api/voice/click-to-call/call` - Initiation appel
- `POST /api/voice/click-to-call/hangup` - Fin appel avec outcome
- `POST /api/voice/click-to-call/save-notes` - Sauvegarde notes

**Base de données voice :**
- `voice_config` : Configuration agents IA par organisation
- `phone_calls` : Historique appels avec transcriptions et résultats
- `voice_calls` : Table WebRTC pour Click-to-Call avec Twilio
- `voice_scripts` : Scripts conversation configurables
- `voice_webhooks` : Webhooks formulaires déclenchant appels
- `voice_daily_stats` : Statistiques quotidiennes performance

### 🆕 Nouvelles Fonctionnalités Développées (Non Documentées)

**🧮 Calculateur de Défiscalisation**
**Localisation :** `/features/defiscalisation`, `/api/fiscal/*`

Moteur avancé de calculs fiscaux et optimisation :

**Fonctionnalités :**
- **Simulations fiscales** : PER, loi Pinel, défiscalisation immobilière
- **Optimisation automatique** : IA suggère meilleures stratégies
- **Comparaisons scenarios** : Multiple stratégies en parallèle
- **Export rapports** : PDF détaillés avec recommandations
- **Mise à jour réglementaire** : Barèmes fiscaux actualisés

**📄 Générateur de Lettres Automatisées**
**Localisation :** `/letters`, `/api/letters/*`

Système de génération de courriers professionnels :

**Types de lettres :**
- **Lettres de rachat** : Contrats d'assurance vie
- **Arrêt prélèvements** : Résiliation automatique
- **Courriers commerciaux** : Personnalisés par client
- **Templates configurables** : Modifiables par organisation
- **Génération PDF** : Export professionnel automatique

**🔒 Système GDPR Avancé**
**Localisation :** `/api/gdpr/*`, `/unsubscribe`

Conformité complète protection des données :

**Fonctionnalités GDPR :**
- **Droit à l'oubli** : Suppression complète données client
- **Export données** : Extraction format JSON/PDF
- **Rectification** : Modification données personnelles
- **Consentement** : Gestion opt-in/opt-out granulaire
- **Audit trails** : Logs complets accès données

**🛡️ Système de Sécurité Renforcé**
**Localisation :** `/lib/security/*`, `/api/security/*`

Protection multi-niveaux contre les attaques :

**Protections implémentées :**
- **Injection SQL** : Validation requêtes assistant IA
- **Injection prompts** : Protection contre prompt hacking
- **Rate limiting** : Limitation appels API par utilisateur
- **Monitoring attaques** : Détection tentatives malveillantes
- **Audit sécurité** : Tests automatisés vulnérabilités

**📊 Pagination Avancée**
**Localisation :** `/lib/pagination/*`, `/api/pagination/*`

Système de pagination optimisé pour gros volumes :

**Caractéristiques :**
- **Performance** : Pagination cursor-based pour scalabilité
- **UI components** : Contrôles pagination réutilisables
- **Filtres avancés** : Compatible avec recherches complexes
- **Infinite scroll** : Support chargement progressif
- **Analytics** : Métriques utilisation pagination

**🔧 Système de Debug et Monitoring**
**Localisation :** `/components/debug/*`, `/api/debug/*`

Outils avancés de développement et monitoring :

**Outils debug :**
- **User Debug** : Informations utilisateur temps réel
- **API Tester** : Interface test endpoints admin
- **Navigation Tester** : Vérification routes protégées
- **Plaquette Debug** : Diagnostics génération PDF
- **Performance Monitor** : Métriques temps réponse

**📱 Pages Légales et Conformité**
**Localisation :** `/(legal)/*`

Pages conformité juridique :

**Pages disponibles :**
- **Mentions légales** : Informations société et contact
- **Politique confidentialité** : Traitement données GDPR
- **CGU/CGV** : Conditions générales service
- **Cookies** : Politique utilisation cookies
- **Accessibilité** : Conformité standards web

### 🗃️ Tables de Base de Données Supplémentaires

En plus du schéma principal documenté, le projet contient ces tables additionnelles :

```sql
-- Table appels WebRTC (Click-to-Call)
CREATE TABLE voice_calls (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    prospect_id UUID REFERENCES crm_prospects(id),
    twilio_call_sid VARCHAR(100) UNIQUE,
    phone_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'initiated',
    outcome VARCHAR(50),
    notes TEXT,
    duration_seconds INTEGER,
    cost_cents INTEGER DEFAULT 0,
    recording_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Récap emails système
CREATE TABLE email_recap_settings (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id),
    daily_recap_enabled BOOLEAN DEFAULT false,
    weekly_recap_enabled BOOLEAN DEFAULT true,
    monthly_recap_enabled BOOLEAN DEFAULT false,
    recap_time TIME DEFAULT '09:00:00',
    recipients TEXT[],
    last_daily_sent TIMESTAMPTZ,
    last_weekly_sent TIMESTAMPTZ,
    last_monthly_sent TIMESTAMPTZ
);

-- Logs emails envoyés
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    prospect_id UUID REFERENCES crm_prospects(id),
    email_type VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject TEXT,
    status VARCHAR(20) DEFAULT 'sent',
    provider_message_id VARCHAR(255),
    sent_at TIMESTAMPTZ DEFAULT now(),
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    error_message TEXT
);
```

---

## 🔌 SERVICES CRM

### APIs CRM Complètes

| Endpoint | Méthodes | Description |
|----------|----------|-------------|
| `/api/prospects/unified` | GET, POST | Liste/Créer prospects |
| `/api/prospects/unified/stats` | GET | Statistiques prospects |
| `/api/prospects/unified/by-stage` | GET | Prospects groupés par stage |
| `/api/prospects/unified/[id]` | GET, PATCH, DELETE | CRUD prospect |
| `/api/prospects/unified/[id]/stage` | PATCH | Update stage (drag&drop) |
| `/api/planning` | GET, POST | Liste/Créer événements |
| `/api/planning/[id]` | GET, PATCH, DELETE | CRUD événement |
| `/api/planning/[id]/complete` | POST | Marquer complété |

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

### 🔄 Architecture CRM
- **Mode CRM** : CRUD complet + fonctionnalités avancées
- **Base Supabase** : PostgreSQL avec RLS pour multi-tenancy
- **Services optimisés** : CrmProspectService et CrmPlanningService

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
✅ **Architecture CRM Complète**
✅ **Workflow Commissions Automatisé**

Le projet Ultron est maintenant une plateforme SaaS complète et avancée pour la gestion de patrimoine, avec des fonctionnalités enterprise et une architecture scalable prête pour la production.