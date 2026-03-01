/**
 * Database schema context for the AI Assistant
 * This provides Claude with the necessary information to generate accurate SQL queries
 */

export const DATABASE_SCHEMA = `
## TABLES DISPONIBLES

### 🎯 PROSPECTS ET CRM

#### crm_prospects (Table principale des prospects)

##### COLONNES PRINCIPALES (les plus utilisees):
- id: UUID (cle primaire)
- organization_id: UUID (OBLIGATOIRE dans WHERE)
- first_name: VARCHAR (prenom du prospect)
- last_name: VARCHAR (nom du prospect)
- email: VARCHAR
- phone: VARCHAR (telephone)

##### DONNEES FINANCIERES DU CLIENT (IMPORTANT - ne pas confondre):
- patrimoine_estime: NUMERIC - LE PATRIMOINE REEL DU CLIENT en euros (ses actifs, biens, epargne). Utiliser quand on parle de "patrimoine", "fortune", "richesse", "actifs" du prospect
- revenus_annuels: NUMERIC - les revenus annuels du client en euros

##### QUALIFICATION IA:
- qualification: VARCHAR - valeurs: 'CHAUD', 'TIEDE', 'FROID', 'non_qualifie' (attention: CHAUD/TIEDE/FROID en majuscules)
- score_ia: INTEGER (score 0-100 calcule par l'IA)
- analyse_ia: TEXT (justification du score)
- derniere_qualification: TIMESTAMPTZ

##### PIPELINE:
- stage_slug: VARCHAR (etape: nouveau, rdv_pris, rdv_effectue, negociation, gagne, perdu)
- assigned_to: UUID (FK vers users - conseiller assigne, NULL si pas assigne)

##### PROFIL CLIENT:
- situation_familiale: VARCHAR (marie, celibataire, divorce, veuf)
- nb_enfants: INTEGER
- age: INTEGER
- profession: VARCHAR
- company: VARCHAR (entreprise)
- job_title: VARCHAR (poste)
- city: VARCHAR (ville)
- postal_code: VARCHAR
- country: VARCHAR
- address: TEXT

##### METRIQUES PRODUITS:
- total_commission_earned: NUMERIC (total commissions gagnees sur ce prospect)
- products_sold: INTEGER (nombre de produits vendus a ce prospect)

##### AUTRES COLONNES:
- source: VARCHAR (origine du lead)
- source_detail: VARCHAR
- tags: TEXT[] (tableau de tags)
- notes: TEXT
- lost_reason: VARCHAR
- won_date: TIMESTAMPTZ
- lost_date: TIMESTAMPTZ
- last_activity_at: TIMESTAMPTZ (derniere interaction)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

#### pipeline_stages (Etapes du pipeline)
Colonnes:
- id: UUID
- organization_id: UUID
- name: VARCHAR (nom affiche: Nouveau, RDV Pris, etc.)
- slug: VARCHAR (identifiant: nouveau, rdv_pris, rdv_effectue, negociation, gagne, perdu)
- color: VARCHAR (couleur hex)
- position: INTEGER (ordre d'affichage)
- is_won: BOOLEAN (true si etape gagnee)
- is_lost: BOOLEAN (true si etape perdue)
- default_probability: INTEGER

#### crm_activities (Historique des interactions)
Colonnes:
- id: UUID
- organization_id: UUID
- prospect_id: UUID (FK vers crm_prospects)
- user_id: UUID (FK vers users)
- type: VARCHAR (note, call, email, meeting, task)
- direction: VARCHAR (inbound, outbound)
- subject: VARCHAR
- content: TEXT
- email_status: VARCHAR (sent, delivered, opened, clicked, replied, bounced, failed)
- email_opened_at: TIMESTAMPTZ
- email_opened_count: INTEGER
- duration_minutes: INTEGER
- outcome: VARCHAR
- metadata: JSONB
- created_at: TIMESTAMPTZ

#### crm_events (Evenements et taches)
Colonnes:
- id: UUID
- organization_id: UUID
- prospect_id: UUID (FK vers crm_prospects)
- prospect_sheet_id: VARCHAR (pour mode bi-mode)
- prospect_name: VARCHAR
- type: VARCHAR (task, call, meeting, reminder, email)
- title: VARCHAR
- description: TEXT
- start_date: TIMESTAMPTZ (debut)
- end_date: TIMESTAMPTZ (fin)
- due_date: TIMESTAMPTZ (echeance)
- all_day: BOOLEAN
- status: VARCHAR (pending, completed, cancelled)
- completed_at: TIMESTAMPTZ
- assigned_to: UUID (FK vers users)
- created_by: UUID (FK vers users)
- priority: VARCHAR (low, medium, high, urgent)
- meet_link: VARCHAR
- calendar_link: VARCHAR
- external_id: VARCHAR (Google Calendar)
- external_source: VARCHAR
- metadata: JSONB
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

### 👥 UTILISATEURS ET ORGANISATION

#### users (Conseillers/Utilisateurs)
Colonnes:
- id: UUID
- auth_id: UUID (lien Supabase Auth)
- organization_id: UUID
- email: VARCHAR
- full_name: VARCHAR (nom complet)
- role: VARCHAR (admin, conseiller)
- gmail_credentials: JSONB
- avatar_url: VARCHAR
- is_active: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

#### organizations (Entreprises clientes)
Colonnes:
- id: UUID
- name: VARCHAR
- slug: VARCHAR
- google_credentials: JSONB
- logo_url: VARCHAR
- primary_color: VARCHAR
- plan: VARCHAR (free, starter, pro, enterprise)
- prompt_qualification: JSONB
- prompt_synthese: JSONB
- prompt_rappel: JSONB
- prompt_plaquette: JSONB
- plaquette_id: VARCHAR
- scoring_config: JSONB
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

### 🛍️ PRODUITS ET COMMISSIONS

#### products (Catalogue produits)
Colonnes:
- id: UUID
- organization_id: UUID
- name: VARCHAR (nom produit: Assurance Vie, PEA, Pompe chaleur)
- description: TEXT
- type: VARCHAR (fixed = benefice fixe, commission = pourcentage)
- category: VARCHAR (assurance_vie, immobilier, energie)
- fixed_value: NUMERIC (montant fixe en euros si type=fixed)
- commission_rate: NUMERIC (pourcentage si type=commission)
- is_active: BOOLEAN
- created_by: UUID
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

#### deal_products (Produits vendus par prospect)
Colonnes:
- id: UUID
- organization_id: UUID
- prospect_id: UUID (FK vers crm_prospects)
- product_id: UUID (FK vers products)
- advisor_id: UUID (FK vers users)
- client_amount: NUMERIC (montant investi/achete par le client)
- company_revenue: NUMERIC (CA genere pour l'entreprise - calcule auto)
- advisor_commission: NUMERIC (commission du conseiller - calcule auto)
- commission_rate_used: NUMERIC
- advisor_commission_rate: NUMERIC
- closed_at: TIMESTAMPTZ
- notes: TEXT
- created_at: TIMESTAMPTZ

#### advisor_commissions (Commissions personnalisees)
Colonnes:
- id: UUID
- organization_id: UUID
- user_id: UUID (FK vers users)
- product_id: UUID (FK vers products, NULL = defaut)
- commission_rate: NUMERIC (pourcentage 0-100)
- is_default: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

### 🎤 VOICE AI ET APPELS

#### voice_config (Configuration agent vocal)
Colonnes:
- id: UUID
- organization_id: UUID
- vapi_assistant_id: VARCHAR
- vapi_api_key: VARCHAR
- phone_number: VARCHAR
- is_enabled: BOOLEAN
- working_days: JSONB (jours travail [1,2,3,4,5])
- working_hours_start: VARCHAR (ex: 09:00)
- working_hours_end: VARCHAR (ex: 18:00)
- call_delay_minutes: INTEGER
- max_call_duration: INTEGER
- voice_settings: JSONB
- greeting_message: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

#### phone_calls (Historique appels)
Colonnes:
- id: UUID
- organization_id: UUID
- prospect_id: UUID
- user_id: UUID
- to_number: VARCHAR
- from_number: VARCHAR
- vapi_call_id: VARCHAR
- vapi_assistant_id: VARCHAR
- status: VARCHAR (queued, ringing, in_progress, completed, failed, cancelled)
- call_type: VARCHAR (outbound_manual, outbound_auto, inbound)
- source: VARCHAR (webhook_auto, manual, scheduled)
- started_at: TIMESTAMPTZ
- ended_at: TIMESTAMPTZ
- duration_seconds: INTEGER
- recording_url: VARCHAR
- transcript: TEXT
- summary: TEXT
- sentiment: VARCHAR (positive, neutral, negative)
- outcome: VARCHAR (rdv_pris, pas_interesse, callback_demande, injoignable)
- scheduled_at: TIMESTAMPTZ
- error_message: TEXT
- metadata: JSONB
- created_at: TIMESTAMPTZ

#### meeting_transcripts (Transcriptions meetings)
Colonnes:
- id: UUID
- organization_id: UUID
- prospect_id: UUID
- user_id: UUID
- meeting_date: TIMESTAMPTZ
- duration_seconds: INTEGER
- google_meet_link: VARCHAR
- transcript_text: TEXT
- transcript_json: JSONB (avec speakers)
- ai_summary: TEXT
- key_points: JSONB (points cles)
- objections_detected: JSONB (objections + reponses)
- next_actions: JSONB (prochaines etapes)
- pdf_url: VARCHAR
- created_at: TIMESTAMPTZ

### 🔍 LEAD FINDER

#### lead_searches (Campagnes recherche leads)
Colonnes:
- id: UUID
- organization_id: UUID
- user_id: UUID
- search_type: VARCHAR (google_places, outscraper, linkedin)
- query: VARCHAR (ex: restaurant Paris)
- location: VARCHAR
- max_results: INTEGER
- filters: JSONB
- status: VARCHAR (pending, running, completed, failed)
- results_count: INTEGER
- credits_used: INTEGER
- api_response: JSONB
- started_at: TIMESTAMPTZ
- completed_at: TIMESTAMPTZ
- error_message: TEXT
- created_at: TIMESTAMPTZ

#### lead_results (Resultats individuels leads)
Colonnes:
- id: UUID
- organization_id: UUID
- search_id: UUID
- name: VARCHAR
- company_name: VARCHAR
- email: VARCHAR
- phone: VARCHAR
- website: VARCHAR
- address: VARCHAR
- city: VARCHAR
- postal_code: VARCHAR
- country: VARCHAR
- profession: VARCHAR
- source: VARCHAR
- quality_score: INTEGER (0-100)
- imported_to_crm: BOOLEAN
- prospect_id: UUID (si importe)
- imported_at: TIMESTAMPTZ
- imported_by: UUID
- created_at: TIMESTAMPTZ

#### lead_stats (Stats quotidiennes leads)
Colonnes:
- id: UUID
- organization_id: UUID
- date: DATE
- leads_found: INTEGER
- leads_imported: INTEGER
- import_rate: NUMERIC
- credits_consumed: INTEGER
- quality_average: NUMERIC
- created_at: TIMESTAMPTZ

### 📱 LINKEDIN AGENT

#### linkedin_agent_config (Config agent LinkedIn)
Colonnes:
- id: UUID
- organization_id: UUID
- is_enabled: BOOLEAN
- linkedin_credentials: JSONB
- cabinet_name: VARCHAR
- cabinet_description: TEXT
- post_frequency: VARCHAR (daily, weekly)
- preferred_themes: JSONB (array themes)
- target_audience: VARCHAR
- post_tone: VARCHAR
- hashtags_default: JSONB
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

#### linkedin_posts (Posts generes)
Colonnes:
- id: UUID
- organization_id: UUID
- config_id: UUID
- theme: VARCHAR (fiscalite, patrimoine, assurance, investissement, immobilier, retraite, epargne, entrepreneuriat)
- content: TEXT
- hashtags: JSONB
- status: VARCHAR (draft, scheduled, published, failed)
- scheduled_at: TIMESTAMPTZ
- published_at: TIMESTAMPTZ
- linkedin_post_id: VARCHAR
- engagement_metrics: JSONB (likes, comments, shares)
- generated_by: UUID
- ai_prompt_used: TEXT
- created_at: TIMESTAMPTZ

### 📊 ANALYTICS ET STATS

#### daily_stats (Statistiques quotidiennes)
Colonnes:
- id: UUID
- organization_id: UUID
- date: DATE
- total_prospects: INTEGER
- prospects_chaud: INTEGER
- prospects_tiede: INTEGER
- prospects_froid: INTEGER
- mails_envoyes: INTEGER
- rdv_pris: INTEGER
- revenue_generated: NUMERIC
- commissions_paid: NUMERIC
- products_sold: INTEGER
- conversion_rate: NUMERIC
- created_at: TIMESTAMPTZ

#### activity_logs (Journal audit)
Colonnes:
- id: UUID
- organization_id: UUID
- user_id: UUID
- action: VARCHAR
- entity_type: VARCHAR (prospect, product, meeting, user)
- entity_id: UUID
- details: JSONB
- ip_address: INET
- user_agent: TEXT
- created_at: TIMESTAMPTZ

#### admin_thresholds (Seuils alertes admin)
Colonnes:
- id: UUID
- organization_id: UUID
- metric_name: VARCHAR (conversion_rate, activity_target, revenue_goal)
- threshold_value: NUMERIC
- threshold_type: VARCHAR (warning, critical)
- description: TEXT
- is_active: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

### 🤖 AGENTS ET AUTOMATION

#### agent_runs (Executions agents IA)
Colonnes:
- id: UUID
- organization_id: UUID
- agent_type: VARCHAR (qualification, email, analysis, linkedin)
- trigger_event: VARCHAR
- input_data: JSONB
- output_data: JSONB
- status: VARCHAR (pending, running, completed, failed)
- tokens_used: INTEGER
- duration_ms: INTEGER
- error_message: TEXT
- created_at: TIMESTAMPTZ

### 📧 EMAILS ET COMMUNICATION

#### email_logs (Journal emails)
Colonnes:
- id: UUID
- organization_id: UUID
- prospect_id: UUID
- user_id: UUID
- email_type: VARCHAR (qualification, rappel, plaquette, suivi, manuel)
- template_id: UUID
- to_email: VARCHAR
- from_email: VARCHAR
- subject: VARCHAR
- content: TEXT
- status: VARCHAR (sent, delivered, opened, clicked, bounced, failed)
- sent_at: TIMESTAMPTZ
- opened_at: TIMESTAMPTZ
- clicked_at: TIMESTAMPTZ
- bounce_reason: TEXT
- tracking_data: JSONB
- created_at: TIMESTAMPTZ

#### emails programmés (QStash)
Note: Avec QStash, les emails programmés ne sont plus stockés en base.
Les emails envoyés sont trackés dans email_logs avec:
- email_type: VARCHAR ('rdv_recap', 'rdv_rappel', etc.)
- status: VARCHAR ('sent', 'failed')
- sent_at: TIMESTAMPTZ (heure effective d'envoi)
- recipient: VARCHAR (email destinataire)
- gmail_message_id: VARCHAR (ID Gmail du message)
- created_at: TIMESTAMPTZ

#### crm_email_templates (Templates emails)
Colonnes:
- id: UUID
- organization_id: UUID
- name: VARCHAR
- subject: VARCHAR (avec variables {{first_name}})
- content: TEXT (HTML avec variables)
- template_type: VARCHAR (qualification, rappel, suivi, commercial)
- variables: JSONB
- is_active: BOOLEAN
- created_by: UUID
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

### ⚙️ SYSTEME ET CONFIGURATION

#### system_settings (Parametres systeme)
Colonnes:
- id: UUID
- organization_id: UUID
- setting_key: VARCHAR (ai_model, email_limits, features_enabled)
- setting_value: JSONB
- is_active: BOOLEAN
- updated_by: UUID
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

#### prompts (Prompts IA configurables)
Colonnes:
- id: UUID
- organization_id: UUID
- prompt_type: VARCHAR (qualification, synthese, rappel, plaquette, linkedin)
- name: VARCHAR
- content: TEXT
- variables: JSONB
- is_active: BOOLEAN
- is_default: BOOLEAN
- created_by: UUID
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

#### crm_saved_filters (Filtres sauvegardes)
Colonnes:
- id: UUID
- organization_id: UUID
- user_id: UUID
- name: VARCHAR
- filter_type: VARCHAR (prospects, activities, deals)
- filter_data: JSONB
- is_shared: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
`;

export const SQL_RULES = `
## REGLES OBLIGATOIRES

1. UNIQUEMENT des requetes SELECT (pas de INSERT, UPDATE, DELETE, DROP)
2. TOUJOURS inclure: WHERE organization_id = $1 (le parametre sera injecte automatiquement)
3. TOUJOURS ajouter LIMIT (maximum 50)
4. Utiliser des ALIAS en francais pour les colonnes dans le SELECT
5. Pour les comparaisons textuelles insensibles a la casse, utiliser LOWER()
6. Pour les dates relatives, utiliser NOW(), CURRENT_DATE, INTERVAL

## IMPORTANT - PATRIMOINE vs DEAL VALUE
- Quand l'utilisateur parle de "patrimoine", "fortune", "richesse", "actifs", "plus riches" -> utiliser patrimoine_estime
- patrimoine_estime = les biens/actifs reels du client (ce qu'il possede)
- NE PAS utiliser deal_value pour les questions sur le patrimoine

## EXEMPLES DE MAPPING LANGAGE NATUREL -> SQL

| Expression | SQL |
|------------|-----|
| "prospects chauds" | qualification = 'CHAUD' |
| "prospects tiedes" | qualification = 'TIEDE' |
| "prospects froids" | qualification = 'FROID' |
| "non qualifies" ou "nouveaux" | qualification = 'non_qualifie' |
| "sans conseiller" | assigned_to IS NULL |
| "avec conseiller" | assigned_to IS NOT NULL |
| "plus gros patrimoine" | ORDER BY patrimoine_estime DESC |
| "plus riches" | ORDER BY patrimoine_estime DESC |
| "patrimoine eleve" | patrimoine_estime > 100000 |
| "gros patrimoine" | patrimoine_estime > 100000 |
| "meilleurs revenus" | ORDER BY revenus_annuels DESC |
| "cette semaine" | >= date_trunc('week', CURRENT_DATE) |
| "ce mois" | >= date_trunc('month', CURRENT_DATE) |
| "les 30 derniers jours" | >= NOW() - INTERVAL '30 days' |
| "RDV" ou "rendez-vous" | type = 'meeting' dans crm_events |
| "appels" ou "telephone" | type = 'call' ou phone_calls |
| "produits vendus" | table deal_products |
| "commissions" | table advisor_commissions ou deal_products |
| "leads" ou "leads finder" | tables lead_searches, lead_results |
| "LinkedIn" ou "posts" | tables linkedin_agent_config, linkedin_posts |
| "emails" ou "mails" | tables email_logs, crm_activities avec type='email' |
| "voice" ou "agent vocal" | tables voice_config, phone_calls |
| "transcriptions" | table meeting_transcripts |

## EXEMPLES DE REQUETES COMPLETES

### PROSPECTS ET QUALIFICATION

1. "Les 5 derniers prospects qualifies en chaud":
SELECT
  first_name AS prenom,
  last_name AS nom,
  email,
  score_ia AS score,
  patrimoine_estime AS patrimoine,
  created_at AS date_creation
FROM crm_prospects
WHERE organization_id = $1
  AND qualification = 'CHAUD'
ORDER BY derniere_qualification DESC NULLS LAST, created_at DESC
LIMIT 5

2. "Prospects sans conseiller avec patrimoine > 100k":
SELECT
  first_name AS prenom,
  last_name AS nom,
  email,
  patrimoine_estime AS patrimoine,
  qualification
FROM crm_prospects
WHERE organization_id = $1
  AND assigned_to IS NULL
  AND patrimoine_estime > 100000
ORDER BY patrimoine_estime DESC
LIMIT 50

3. "Top 10 par patrimoine" ou "les plus riches":
SELECT
  first_name AS prenom,
  last_name AS nom,
  email,
  patrimoine_estime AS patrimoine,
  revenus_annuels AS revenus,
  qualification,
  stage_slug AS etape
FROM crm_prospects
WHERE organization_id = $1
  AND patrimoine_estime IS NOT NULL
ORDER BY patrimoine_estime DESC
LIMIT 10

### EVENEMENTS ET PLANNING

4. "Combien de RDV cette semaine?":
SELECT COUNT(*) AS total_rdv
FROM crm_events
WHERE organization_id = $1
  AND type = 'meeting'
  AND start_date >= date_trunc('week', CURRENT_DATE)
  AND start_date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
LIMIT 1

5. "Taches en cours" ou "taches pendantes":
SELECT
  title AS titre,
  description,
  due_date AS echeance,
  priority AS priorite,
  prospect_name AS prospect
FROM crm_events
WHERE organization_id = $1
  AND type = 'task'
  AND status = 'pending'
ORDER BY due_date ASC NULLS LAST
LIMIT 20

### PRODUITS ET COMMISSIONS

6. "Meilleurs produits vendus":
SELECT
  p.name AS produit,
  p.category AS categorie,
  COUNT(*) AS nombre_ventes,
  SUM(dp.company_revenue) AS ca_total,
  AVG(dp.client_amount) AS montant_moyen
FROM products p
JOIN deal_products dp ON p.id = dp.product_id
WHERE p.organization_id = $1
GROUP BY p.id, p.name, p.category
ORDER BY ca_total DESC
LIMIT 10

7. "Commissions par conseiller ce mois":
SELECT
  u.full_name AS conseiller,
  SUM(dp.advisor_commission) AS total_commissions,
  COUNT(*) AS nombre_ventes
FROM users u
JOIN deal_products dp ON u.id = dp.advisor_id
WHERE u.organization_id = $1
  AND dp.closed_at >= date_trunc('month', CURRENT_DATE)
GROUP BY u.id, u.full_name
ORDER BY total_commissions DESC
LIMIT 20

### APPELS ET VOICE AI

8. "Appels cette semaine":
SELECT
  pc.status AS statut,
  COUNT(*) AS nombre,
  AVG(pc.duration_seconds)/60 AS duree_moyenne_min
FROM phone_calls pc
WHERE pc.organization_id = $1
  AND pc.created_at >= date_trunc('week', CURRENT_DATE)
GROUP BY pc.status
ORDER BY nombre DESC
LIMIT 10

9. "Prospects avec appels reussis":
SELECT
  pr.first_name AS prenom,
  pr.last_name AS nom,
  pc.outcome AS resultat,
  pc.duration_seconds/60 AS duree_min,
  pc.started_at AS date_appel
FROM crm_prospects pr
JOIN phone_calls pc ON pr.id = pc.prospect_id
WHERE pr.organization_id = $1
  AND pc.status = 'completed'
  AND pc.outcome IN ('rdv_pris', 'callback_demande')
ORDER BY pc.started_at DESC
LIMIT 20

### LEAD FINDER

10. "Leads trouves ce mois":
SELECT
  ls.query AS recherche,
  ls.results_count AS resultats,
  ls.credits_used AS credits,
  ls.started_at AS date_recherche
FROM lead_searches ls
WHERE ls.organization_id = $1
  AND ls.started_at >= date_trunc('month', CURRENT_DATE)
  AND ls.status = 'completed'
ORDER BY ls.started_at DESC
LIMIT 20

11. "Meilleurs leads importes":
SELECT
  lr.name AS nom,
  lr.company_name AS entreprise,
  lr.email,
  lr.quality_score AS score,
  lr.imported_at AS date_import
FROM lead_results lr
WHERE lr.organization_id = $1
  AND lr.imported_to_crm = true
  AND lr.quality_score IS NOT NULL
ORDER BY lr.quality_score DESC, lr.imported_at DESC
LIMIT 20

### LINKEDIN AGENT

12. "Posts LinkedIn publies":
SELECT
  lp.theme AS theme,
  lp.published_at AS date_publication,
  lp.engagement_metrics AS engagement,
  LEFT(lp.content, 100) AS apercu_contenu
FROM linkedin_posts lp
WHERE lp.organization_id = $1
  AND lp.status = 'published'
ORDER BY lp.published_at DESC
LIMIT 10

### EMAILS ET COMMUNICATION

13. "Emails envoyes cette semaine":
SELECT
  el.email_type AS type_email,
  el.status AS statut,
  COUNT(*) AS nombre
FROM email_logs el
WHERE el.organization_id = $1
  AND el.sent_at >= date_trunc('week', CURRENT_DATE)
GROUP BY el.email_type, el.status
ORDER BY nombre DESC
LIMIT 15

### ANALYTICS ET PERFORMANCE

14. "Evolution prospects par qualification":
SELECT
  ds.date,
  ds.prospects_chaud AS chauds,
  ds.prospects_tiede AS tiedes,
  ds.prospects_froid AS froids,
  ds.total_prospects AS total
FROM daily_stats ds
WHERE ds.organization_id = $1
  AND ds.date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY ds.date DESC
LIMIT 30

15. "CA et commissions ce mois":
SELECT
  SUM(ds.revenue_generated) AS ca_total,
  SUM(ds.commissions_paid) AS commissions_totales,
  SUM(ds.products_sold) AS produits_vendus,
  AVG(ds.conversion_rate) AS taux_conversion_moyen
FROM daily_stats ds
WHERE ds.organization_id = $1
  AND ds.date >= date_trunc('month', CURRENT_DATE)
LIMIT 1
`;

/**
 * Get the full schema context for SQL generation prompts
 */
export function getSchemaContext(): string {
  return DATABASE_SCHEMA + '\n\n' + SQL_RULES;
}

/**
 * Get a condensed version for response formatting
 */
export function getCondensedSchema(): string {
  return `Tables disponibles:
  🎯 CRM: crm_prospects, pipeline_stages, crm_activities, crm_events
  👥 Users: users, organizations
  🛍️ Produits: products, deal_products, advisor_commissions
  🎤 Voice AI: voice_config, phone_calls, meeting_transcripts
  🔍 Lead Finder: lead_searches, lead_results, lead_stats
  📱 LinkedIn: linkedin_agent_config, linkedin_posts
  📧 Emails: email_logs (includes QStash scheduled), crm_email_templates
  📊 Analytics: daily_stats, activity_logs, admin_thresholds
  🤖 Agents: agent_runs, prompts, system_settings`;
}
