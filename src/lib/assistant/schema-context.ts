/**
 * Database schema context for the AI Assistant
 * This provides Claude with the necessary information to generate accurate SQL queries
 */

export const DATABASE_SCHEMA = `
## TABLES DISPONIBLES

### crm_prospects (Table principale des prospects)
Colonnes:
- id: UUID (cle primaire)
- organization_id: UUID (OBLIGATOIRE dans WHERE)
- first_name: VARCHAR (prenom)
- last_name: VARCHAR (nom)
- email: VARCHAR
- phone: VARCHAR (telephone)
- company: VARCHAR (entreprise)
- job_title: VARCHAR (poste)
- address: TEXT (adresse)
- city: VARCHAR (ville)
- postal_code: VARCHAR (code postal)
- country: VARCHAR DEFAULT 'France'
- patrimoine_estime: NUMERIC (patrimoine estime en euros)
- revenus_annuels: NUMERIC (revenus annuels en euros)
- situation_familiale: VARCHAR (marie, celibataire, divorce, veuf)
- nb_enfants: INTEGER (nombre d'enfants)
- age: INTEGER
- profession: VARCHAR
- stage_id: UUID (FK vers pipeline_stages)
- stage_slug: VARCHAR (slug de l'etape: nouveau, en_attente, rdv_pris, rdv_effectue, negociation, gagne, perdu)
- deal_value: NUMERIC (valeur potentielle du deal)
- close_probability: INTEGER (probabilite de closing 0-100)
- expected_close_date: DATE
- qualification: VARCHAR (CHAUD, TIEDE, FROID, NON_QUALIFIE) - IMPORTANT: utiliser UPPER() pour comparaison ou 'chaud', 'tiede', 'froid', 'non_qualifie' en minuscules
- score_ia: INTEGER (score 0-100 calcule par l'IA)
- analyse_ia: TEXT (justification du score)
- derniere_qualification: TIMESTAMPTZ
- source: VARCHAR (origine du lead: linkedin, referral, site_web, etc.)
- source_detail: VARCHAR
- assigned_to: UUID (FK vers users - conseiller assigne)
- tags: TEXT[] (tableau de tags)
- notes: TEXT
- lost_reason: VARCHAR (raison de la perte)
- won_date: TIMESTAMPTZ (date de gain)
- lost_date: TIMESTAMPTZ (date de perte)
- last_activity_at: TIMESTAMPTZ (derniere interaction)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

### pipeline_stages (Etapes du pipeline)
Colonnes:
- id: UUID
- organization_id: UUID
- name: VARCHAR (nom affiche: Nouveau, En attente, RDV Pris, etc.)
- slug: VARCHAR (identifiant: nouveau, en_attente, rdv_pris, rdv_effectue, negociation, gagne, perdu)
- color: VARCHAR (couleur hex)
- position: INTEGER (ordre d'affichage)
- is_won: BOOLEAN (true si etape gagnee)
- is_lost: BOOLEAN (true si etape perdue)
- default_probability: INTEGER

### users (Conseillers/Utilisateurs)
Colonnes:
- id: UUID
- organization_id: UUID
- email: VARCHAR
- full_name: VARCHAR (nom complet)
- role: VARCHAR (admin, conseiller)
- is_active: BOOLEAN
- created_at: TIMESTAMPTZ

### crm_events (Evenements et taches)
Colonnes:
- id: UUID
- organization_id: UUID
- prospect_id: UUID (FK vers crm_prospects)
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
- created_at: TIMESTAMPTZ

### crm_activities (Historique des interactions)
Colonnes:
- id: UUID
- organization_id: UUID
- prospect_id: UUID (FK vers crm_prospects)
- user_id: UUID (FK vers users)
- type: VARCHAR (email, call, meeting, note, task_completed, stage_change, qualification)
- direction: VARCHAR (inbound, outbound)
- subject: VARCHAR
- content: TEXT
- email_status: VARCHAR (sent, opened, clicked, replied, bounced)
- duration_minutes: INTEGER
- outcome: VARCHAR (positive, neutral, negative, no_answer, voicemail)
- created_at: TIMESTAMPTZ
`;

export const SQL_RULES = `
## REGLES OBLIGATOIRES

1. UNIQUEMENT des requetes SELECT (pas de INSERT, UPDATE, DELETE, DROP)
2. TOUJOURS inclure: WHERE organization_id = $1 (le parametre sera injecte automatiquement)
3. TOUJOURS ajouter LIMIT (maximum 50)
4. Utiliser des ALIAS en francais pour les colonnes dans le SELECT
5. Pour les comparaisons textuelles insensibles a la casse, utiliser LOWER()
6. Pour les dates relatives, utiliser NOW(), CURRENT_DATE, INTERVAL

## EXEMPLES DE MAPPING LANGAGE NATUREL -> SQL

| Expression | SQL |
|------------|-----|
| "prospects chauds" | qualification = 'chaud' OU LOWER(qualification) = 'chaud' |
| "prospects tiedes" | qualification = 'tiede' |
| "prospects froids" | qualification = 'froid' |
| "non qualifies" ou "nouveaux" | qualification = 'non_qualifie' |
| "sans conseiller" | assigned_to IS NULL |
| "avec conseiller" | assigned_to IS NOT NULL |
| "cette semaine" | >= date_trunc('week', CURRENT_DATE) AND < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days' |
| "ce mois" | >= date_trunc('month', CURRENT_DATE) |
| "les 30 derniers jours" | >= NOW() - INTERVAL '30 days' |
| "pas contactes depuis X jours" | last_activity_at < NOW() - INTERVAL 'X days' OU last_activity_at IS NULL |
| "patrimoine eleve" ou "gros patrimoine" | patrimoine_estime > 100000 (adapter selon contexte) |
| "RDV" ou "rendez-vous" | type = 'meeting' dans crm_events |
| "taches" | type = 'task' dans crm_events |
| "appels" | type = 'call' dans crm_events ou crm_activities |
| "etape X" ou "stage X" | stage_slug = 'x' |

## EXEMPLES DE REQUETES COMPLETES

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
  AND LOWER(qualification) = 'chaud'
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

3. "Combien de RDV cette semaine?":
SELECT COUNT(*) AS total_rdv
FROM crm_events
WHERE organization_id = $1
  AND type = 'meeting'
  AND start_date >= date_trunc('week', CURRENT_DATE)
  AND start_date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
LIMIT 1

4. "Prospects pas contactes depuis 30 jours":
SELECT
  first_name AS prenom,
  last_name AS nom,
  email,
  phone AS telephone,
  last_activity_at AS dernier_contact,
  qualification
FROM crm_prospects
WHERE organization_id = $1
  AND (last_activity_at IS NULL OR last_activity_at < NOW() - INTERVAL '30 days')
ORDER BY last_activity_at ASC NULLS FIRST
LIMIT 50

5. "Top 10 par patrimoine":
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
  return `Tables: crm_prospects (prospects), pipeline_stages (etapes), users (conseillers), crm_events (evenements/taches), crm_activities (historique)`;
}
