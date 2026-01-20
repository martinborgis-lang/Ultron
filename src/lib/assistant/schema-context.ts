/**
 * Database schema context for the AI Assistant
 * This provides Claude with the necessary information to generate accurate SQL queries
 */

export const DATABASE_SCHEMA = `
## TABLES DISPONIBLES

### crm_prospects (Table principale des prospects)

#### COLONNES PRINCIPALES (les plus utilisees):
- id: UUID (cle primaire)
- organization_id: UUID (OBLIGATOIRE dans WHERE)
- first_name: VARCHAR (prenom du prospect)
- last_name: VARCHAR (nom du prospect)
- email: VARCHAR
- phone: VARCHAR (telephone)

#### DONNEES FINANCIERES DU CLIENT (IMPORTANT - ne pas confondre):
- patrimoine_estime: NUMERIC - LE PATRIMOINE REEL DU CLIENT en euros (ses actifs, biens, epargne). Utiliser quand on parle de "patrimoine", "fortune", "richesse", "actifs" du prospect
- revenus_annuels: NUMERIC - les revenus annuels du client en euros

#### QUALIFICATION IA:
- qualification: VARCHAR - valeurs: 'chaud', 'tiede', 'froid', 'non_qualifie' (en minuscules)
- score_ia: INTEGER (score 0-100 calcule par l'IA)
- analyse_ia: TEXT (justification du score)
- derniere_qualification: TIMESTAMPTZ

#### PIPELINE:
- stage_slug: VARCHAR (etape: nouveau, en_attente, rdv_pris, rdv_effectue, negociation, gagne, perdu)
- assigned_to: UUID (FK vers users - conseiller assigne, NULL si pas assigne)

#### PROFIL CLIENT:
- situation_familiale: VARCHAR (marie, celibataire, divorce, veuf)
- nb_enfants: INTEGER
- age: INTEGER
- profession: VARCHAR
- company: VARCHAR (entreprise)
- job_title: VARCHAR (poste)
- city: VARCHAR (ville)

#### AUTRES COLONNES:
- source: VARCHAR (origine du lead)
- tags: TEXT[] (tableau de tags)
- notes: TEXT
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

## IMPORTANT - PATRIMOINE vs DEAL VALUE
- Quand l'utilisateur parle de "patrimoine", "fortune", "richesse", "actifs", "plus riches" -> utiliser patrimoine_estime
- patrimoine_estime = les biens/actifs reels du client (ce qu'il possede)
- NE PAS utiliser deal_value pour les questions sur le patrimoine

## EXEMPLES DE MAPPING LANGAGE NATUREL -> SQL

| Expression | SQL |
|------------|-----|
| "prospects chauds" | qualification = 'chaud' |
| "prospects tiedes" | qualification = 'tiede' |
| "prospects froids" | qualification = 'froid' |
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

5. "Top 10 par patrimoine" ou "les plus riches" ou "plus gros patrimoine":
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

6. "3 prospects avec le plus de patrimoine":
SELECT
  first_name AS prenom,
  last_name AS nom,
  patrimoine_estime AS patrimoine,
  qualification
FROM crm_prospects
WHERE organization_id = $1
  AND patrimoine_estime IS NOT NULL
ORDER BY patrimoine_estime DESC
LIMIT 3
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
