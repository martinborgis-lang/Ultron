# I4 - Whitelist SQL Incomplète dans l'Assistant IA

**Sévérité :** IMPORTANT (fonctionnel)
**Fichier principal :** `src/lib/assistant/sql-validator.ts`
**Fichier lié :** `src/lib/assistant/schema-context.ts`
**Date :** 3 mars 2026

---

## Description Détaillée

L'Assistant IA conversationnel (`/assistant`) utilise Claude pour convertir des questions en langage naturel en requêtes SQL. Le flow est :

1. L'utilisateur pose une question ("Combien de prospects chauds ce mois ?")
2. `sql-generator.ts` envoie la question à Claude avec le **schéma complet** de la DB (25+ tables via `schema-context.ts`)
3. Claude génère une requête SQL
4. `sql-validator.ts` **valide** la requête avant exécution
5. La requête est exécutée sur Supabase

### Le Problème

**`sql-validator.ts` n'autorise que 5 tables** (ligne 4-10) :

```typescript
const ALLOWED_TABLES = [
  'crm_prospects',
  'pipeline_stages',
  'users',
  'crm_events',
  'crm_activities',
];
```

**Mais `schema-context.ts` décrit 25+ tables à Claude**, incluant :
- `products` — catalogue produits
- `deal_products` — ventes réalisées
- `advisor_commissions` — commissions conseillers
- `meeting_transcripts` — transcriptions meetings
- `daily_stats` — statistiques quotidiennes
- `email_logs` — historique emails
- `lead_searches`, `lead_results` — données Lead Finder
- `linkedin_posts` — posts LinkedIn générés
- `activity_logs` — logs d'activité
- Et d'autres...

### Conséquence Directe

Quand un utilisateur demande : *"Quel est mon chiffre d'affaires ce mois ?"*

1. Claude génère : `SELECT SUM(company_revenue) FROM deal_products WHERE organization_id = $1 LIMIT 50`
2. Le validateur rejette : **"Table non autorisée : deal_products"**
3. L'utilisateur voit une erreur incompréhensible

Cela rend l'Assistant IA **inutile** pour toute question concernant : les produits, les ventes, les commissions, les meetings, les emails, les leads, LinkedIn, les stats quotidiennes — soit la majorité des fonctionnalités Ultron.

### Tables Manquantes à Ajouter

| Table | Justification | Sensibilité |
|-------|---------------|-------------|
| `products` | Consultation catalogue produits | Faible |
| `deal_products` | CA et ventes par prospect | Moyenne |
| `advisor_commissions` | Commissions par conseiller | Moyenne |
| `meeting_transcripts` | Recherche dans les meetings | Moyenne |
| `daily_stats` | Statistiques et KPIs | Faible |
| `email_logs` | Historique emails envoyés | Moyenne |
| `scheduled_emails` | Emails programmés | Faible |
| `lead_searches` | Historique recherches leads | Faible |
| `lead_results` | Prospects trouvés | Faible |
| `linkedin_posts` | Posts LinkedIn générés | Faible |
| `activity_logs` | Logs d'activité | Faible |
| `crm_email_templates` | Templates emails | Faible |
| `crm_saved_filters` | Filtres sauvegardés | Faible |
| `organizations` | Info organisation (attention RLS) | **Élevée** |
| `prompts` | Prompts configurés | Moyenne |

### Tables à NE PAS Ajouter (données sensibles)

| Table | Raison |
|-------|--------|
| `voice_config` | Contient des clés API Vapi chiffrées |
| `phone_calls` | Données appels (exclu de la démo) |
| `voice_calls` | Données appels WebRTC (exclu de la démo) |
| `voice_webhooks` | Config webhooks (exclu de la démo) |
| `voice_scripts` | Scripts voix (exclu de la démo) |

---

## Prompt Claude Code (copier-coller)

```
Correction fonctionnelle dans src/lib/assistant/sql-validator.ts :

Le tableau ALLOWED_TABLES ne contient que 5 tables mais le schema-context.ts
en décrit 25+. L'assistant IA ne peut répondre à aucune question sur les produits,
ventes, meetings, emails, leads, etc.

REMPLACER le tableau ALLOWED_TABLES (lignes 4-10) par :

const ALLOWED_TABLES = [
  // CRM Core
  'crm_prospects',
  'pipeline_stages',
  'users',
  'crm_events',
  'crm_activities',
  'crm_email_templates',
  'crm_saved_filters',

  // Produits & Commissions
  'products',
  'deal_products',
  'advisor_commissions',

  // Meetings
  'meeting_transcripts',

  // Emails
  'email_logs',
  'scheduled_emails',

  // Lead Finder
  'lead_searches',
  'lead_results',
  'lead_credits',

  // LinkedIn
  'linkedin_posts',
  'linkedin_config',

  // Analytics
  'daily_stats',
  'activity_logs',

  // Config (lecture seule)
  'organizations',
  'prompts',
];

IMPORTANT :
- NE PAS ajouter voice_config, phone_calls, voice_calls, voice_webhooks, voice_scripts
  (ces tables contiennent des données sensibles ou sont hors scope pour la démo)
- La sécurité reste assurée par le filtre organization_id obligatoire (ligne 71-81)
  et par les requêtes SELECT uniquement (ligne 52-57)
- Vérifier que le build passe après modification
```

---

## Vérifications Post-Fix (pour Martin)

### 1. Vérifier le fichier modifié

Ouvre `src/lib/assistant/sql-validator.ts` et vérifie que :

- [ ] Le tableau `ALLOWED_TABLES` contient maintenant **~25 tables** (au lieu de 5)
- [ ] Les tables `products`, `deal_products`, `advisor_commissions` sont présentes
- [ ] Les tables `meeting_transcripts`, `daily_stats` sont présentes
- [ ] Les tables `lead_searches`, `lead_results`, `linkedin_posts` sont présentes
- [ ] Les tables `voice_config`, `phone_calls`, `voice_calls` ne sont **PAS** dans la liste
- [ ] Le reste du fichier (forbidden keywords, injection checks) n'a PAS été modifié

### 2. Vérifier le build

```bash
npm run build
```

Le build doit passer sans erreur.

### 3. Test fonctionnel via l'Assistant IA

Connecte-toi sur Ultron et va dans l'Assistant IA (`/assistant`). Teste ces questions :

- [ ] **"Combien de prospects chauds ai-je ?"** → Doit fonctionner (table `crm_prospects`, déjà dans la whitelist)
- [ ] **"Quel est mon chiffre d'affaires ce mois ?"** → Doit **maintenant** fonctionner (table `deal_products`, nouvellement ajoutée)
- [ ] **"Quels produits sont configurés ?"** → Doit **maintenant** fonctionner (table `products`)
- [ ] **"Combien d'emails ai-je envoyé cette semaine ?"** → Doit **maintenant** fonctionner (table `email_logs`)
- [ ] **"Montre-moi mes derniers meetings"** → Doit **maintenant** fonctionner (table `meeting_transcripts`)
- [ ] **"Quelles recherches de leads ai-je faites ?"** → Doit **maintenant** fonctionner (table `lead_searches`)

### 4. Test de sécurité (vérifier que les protections sont toujours actives)

Dans l'Assistant IA, essayer :

- [ ] **"DELETE FROM crm_prospects"** → Doit être bloqué ("Opération non autorisée")
- [ ] **"SELECT * FROM voice_config"** → Doit être bloqué ("Table non autorisée")
- [ ] Toute requête sans LIMIT → Doit être bloquée
- [ ] Toute requête sans filtre organization_id → Doit être bloquée

### 5. Vérifier la cohérence schema-context / sql-validator

Pour éviter que ce problème ne se reproduise, vérifier que :

- [ ] Chaque table listée dans `schema-context.ts` (section DATABASE_SCHEMA) est aussi dans `ALLOWED_TABLES` de `sql-validator.ts` — sauf les tables sensibles volontairement exclues

---

## Risque si Non Corrigé

| Scénario | Probabilité | Impact |
|----------|-------------|--------|
| Client de la démo demande des stats via l'Assistant | **Très élevée** | L'assistant renvoie une erreur — **mauvaise impression** |
| L'assistant semble "cassé" car 80% des questions échouent | **Très élevée** | Le client pense que le produit ne fonctionne pas |
| Questions sur CA/commissions/produits impossibles | **Certaine** | Fonctionnalité phare inutilisable |
