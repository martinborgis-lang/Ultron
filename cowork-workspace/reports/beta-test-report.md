# 🧪 Rapport Beta Test Ultron - 2 Mars 2026

---

## Résumé Exécutif

- **4 bugs critiques** (bloquants pour la démo)
- **6 bugs importants** (visibles mais contournables)
- **8 améliorations** (nice-to-have)
- **127 routes API auditées** — architecture globalement solide
- **0 secret hardcodé trouvé** — bonne pratique .env

---

## Score de Confiance Démo

| Parcours | Score | Détails |
|----------|-------|---------|
| Login | 🟡 MOYEN | Code OK, mais Google ne peut pas tester → vérifier flow OAuth |
| Dashboard | 🟢 BON | Stats cards, graphiques, activité feed — tous protégés et authentifiés |
| Pipeline Kanban | 🟢 BON | Drag & drop, stages, cards — code robuste avec DnD-kit |
| Prospects | 🟢 BON | CRUD complet, filtres avancés, vue 360° — bien implémenté |
| Planning | 🟢 BON | Google Calendar sync, tâches, événements — fonctionnel |
| Extension Chrome | 🟡 MOYEN | APIs OK, mais dépend de l'auth extension (JWT secret critique) |
| Emails | 🟡 MOYEN | Envoi OK, mais TODOs non implémentés dans webhooks vocaux |
| Agent Vocal | 🔴 CRITIQUE | Webhook signature non validée (toujours `return true`) |
| Click-to-Call | 🟢 BON | WebRTC Twilio bien intégré, notes d'appel fonctionnelles |
| Admin Dashboard | 🟢 BON | KPIs, performance, alertes — complet et protégé admin-only |
| Lead Finder | 🟢 BON | Crédits, recherche, import CRM — bien structuré |
| LinkedIn Agent | 🟢 BON | Config cabinet, génération IA, historique — fonctionnel |
| Pages Légales | 🟢 BON | Privacy 261 lignes, Legal 198 lignes — RGPD complet |

---

## Bugs Détaillés

### 🔴 Critiques (4) — Bloquants pour la démo

#### C1. Validation webhook Vapi.ai désactivée
- **Fichier :** `src/app/api/voice/ai-agent/vapi-webhook/route.ts` (~ligne 613-620)
- **Description :** La fonction `validateVapiSignature()` retourne toujours `true`. N'importe qui peut envoyer de faux événements webhook et déclencher des appels, modifier des prospects, ou manipuler le système.
- **Impact :** Faille de sécurité majeure sur le module Agent Vocal IA
- **Fix proposé :** Implémenter validation HMAC-SHA256 (voir `cowork-workspace/bugs/oauth-fixes.md` Fix #3)

#### C2. Extension Auth — Fallback sur clé publique
- **Fichier :** `src/lib/extension-auth.ts` (~ligne 37-38)
- **Description :** `SUPABASE_JWT_SECRET || NEXT_PUBLIC_SUPABASE_ANON_KEY` — si le JWT secret n'est pas défini en variable d'env, le fallback utilise la clé PUBLIQUE. Quiconque peut forger des tokens JWT valides.
- **Impact :** Contournement complet de l'authentification extension Chrome
- **Fix proposé :** Voir `cowork-workspace/bugs/oauth-fixes.md` Fix #2

#### C3. Google ne peut pas tester le flow OAuth
- **Fichier :** N/A (configuration + UX)
- **Description :** L'email du 17 février de Google indique qu'ils ne peuvent ni accéder au flow OAuth ni trouver le bouton "Connect Google Account". La vérification est BLOQUÉE depuis 13 jours.
- **Impact :** Sans vérification OAuth, les scopes sensibles (gmail, calendar, drive) resteront en mode "test" limité à 100 utilisateurs.
- **Fix proposé :** Répondre à Google avec instructions + compte test (voir `cowork-workspace/drafts/reponse-google-oauth.md`)

#### C4. TODOs non implémentés dans le webhook vocal
- **Fichier :** `src/app/api/voice/ai-agent/vapi-webhook/route.ts` (~lignes 588, 594)
- **Description :** Deux fonctionnalités critiques sont des stubs :
  - `console.log('📧 TODO: Envoyer email confirmation RDV')` — pas d'email de confirmation RDV
  - `console.log('🔥 TODO: Notifier conseiller - prospect chaud')` — pas de notification prospect chaud
- **Impact :** Si un prospect prend RDV via l'agent vocal, ni le prospect ni le conseiller ne reçoivent de confirmation
- **Fix proposé :** Implémenter l'envoi d'email et la notification

---

### 🟠 Importants (6) — Visibles mais contournables

#### I1. 265+ console.log de données sensibles en production
- **Fichiers :** Multiples routes API (extension, meeting, voice, etc.)
- **Description :** Logs exposant longueurs de tokens, données d'événements complets, clés d'objets
- **Exemples :**
  - `console.log('[Extension Calendar] 🔑 Token présent (longueur:', token.length, ')')`
  - `console.log('🔍 Event complet:', JSON.stringify(event, null, 2))`
- **Impact :** Fuite d'informations dans les logs Vercel (lisibles par quiconque a accès au dashboard)
- **Fix :** Remplacer par le logger structuré existant avec niveaux (debug en dev, error en prod)

#### I2. Webhooks publics sans validation d'origine
- **Fichiers :**
  - `/voice/ai-agent/webhook/route.ts` (form submissions)
  - `/voice/click-to-call/twilio-webhook/route.ts`
  - `/voice/click-to-call/recording-webhook/route.ts`
  - `/webhooks/qualification/route.ts`
  - `/webhooks/plaquette/route.ts`, `rdv-valide/route.ts`, `send-rappel/route.ts`
- **Description :** Ces endpoints acceptent des POST sans authentification ni validation de signature. L'organization_id vient du header `X-Organization-Id` (contrôlable par l'attaquant).
- **Impact :** Un attaquant pourrait créer des prospects, déclencher des emails, ou manipuler des données dans n'importe quelle organisation
- **Fix :** Ajouter validation Twilio signature pour les webhooks Twilio, tokens secrets pour les webhooks internes, rate limiting pour tous

#### I3. Routes de debug/test exposées en production
- **Fichiers :**
  - `/api/security/test/attack/route.ts` — complètement ouvert, pas d'auth
  - `/api/security-test/route.ts` — public
  - `/api/test-db/route.ts` — debug DB
  - `/api/pagination/test/route.ts` — test pagination
  - `/api/gmail/test/route.ts` — test Gmail
  - `/api/debug/plaquette/route.ts` — debug plaquettes
  - 6+ routes `/voice/test-*` — tests vocaux
- **Impact :** Exposent la structure interne, peuvent consommer des ressources, et `/security/test/attack` est un vecteur d'attaque potentiel
- **Fix :** Supprimer ou protéger avec un flag `NODE_ENV === 'development'`

#### I4. Table whitelist SQL incomplète dans l'Assistant IA
- **Fichier :** `src/lib/assistant/sql-validator.ts` (lignes 4-10)
- **Description :** Seulement 5 tables dans `ALLOWED_TABLES` : crm_prospects, pipeline_stages, users, crm_events, crm_activities. Il manque : products, deal_products, advisor_commissions, meeting_transcripts, phone_calls, voice_calls, etc.
- **Impact :** L'Assistant IA ne peut pas répondre aux questions sur les produits, commissions, meetings, appels
- **Fix :** Ajouter les tables manquantes à la whitelist

#### I5. Absence de rate limiting sur les API publiques
- **Fichiers :** Tous les webhooks + routes API en général
- **Description :** Aucune limitation de débit implémentée
- **Impact :** Vulnérable au DoS, spam webhook, et surcoût APIs externes (Vapi, Anthropic, Outscraper)
- **Fix :** Implémenter `@upstash/ratelimit` sur les routes critiques

#### I6. Incohérence casse qualification dans les types
- **Fichier :** `src/types/crm.ts` (~ligne 50)
- **Description :** Le type utilise `'chaud' | 'tiede' | 'froid'` en minuscule, mais la base de données utilise `'CHAUD' | 'TIEDE' | 'FROID'` en majuscule
- **Impact :** Risque de bugs de comparaison silencieux et d'affichage incohérent
- **Fix :** Uniformiser en majuscule pour correspondre au schéma DB

---

### 🟡 Mineurs / Améliorations (8)

#### M1. Champs manquants dans les types TypeScript
- `CrmProspect` manque : `mail_plaquette_sent`, `mail_synthese_sent`, `mail_rappel_sent`, `total_commission_earned`, `products_sold`
- `PhoneCall` manque : `direction`, `next_action`, `metadata`
- `VoiceCall` (WebRTC) manque : `recording_sid`, `recording_channels`, `transcription_status`, `ip_address`, `user_agent`

#### M2. CORS wildcard sur les webhooks
- `/api/voice/ai-agent/vapi-webhook/route.ts` utilise `Access-Control-Allow-Origin: '*'`
- Acceptable pour les webhooks externes, mais à surveiller

#### M3. Duplication types CrmProspect / CrmProspectDbRecord
- `src/types/crm.ts` et `src/types/database.ts` définissent des types similaires
- Risque de drift entre les deux

#### M4. Scope `spreadsheets` potentiellement inutile
- Utilisé uniquement pour le mode Google Sheets legacy
- Si ce mode n'est plus actif, le retirer simplifie la vérification OAuth

#### M5. Admin client bypass RLS sans audit trail
- `createAdminClient()` utilisé dans les webhooks et certaines routes
- Pas de logging supplémentaire pour tracer les opérations admin

#### M6. Textes TODO/FIXME restants dans le code
- Quelques `TODO` et commentaires de développement encore présents
- Non visibles par l'utilisateur mais indicatifs de fonctionnalités incomplètes

#### M7. Organisation ID via header non validé (webhook form)
- Le webhook `/voice/ai-agent/webhook` accepte `X-Organization-Id` du header
- Devrait être validé contre une liste d'organisations autorisées

#### M8. Test visuel non effectué (Chrome disconnected)
- Le test visuel via Claude in Chrome n'a pas pu être complété (extension déconnectée)
- Recommandation : tester manuellement les parcours login, dashboard, pipeline, prospect

---

## Analyse par Module

### ✅ Points Forts du Code

1. **Authentification cohérente** : 90%+ des routes utilisent `getCurrentUserAndOrganization()` — excellent pattern
2. **Try-catch systématique** : 482 try-catch sur 127 routes — couverture quasi totale
3. **Multi-tenancy** : Filtrage `organization_id` sur toutes les routes CRM — bien implémenté
4. **Pages légales complètes** : RGPD, CNIL, mentions légales — conformité solide
5. **OAuth bien configuré** : `access_type: 'offline'`, `prompt: 'consent'`, validation refresh token
6. **Pas de secrets en dur** : Aucune API key, token ou mot de passe trouvé dans le code source
7. **`.gitignore` correct** : `.env*` bien exclu

### ⚠️ Points d'Attention

1. **Webhooks = maillon faible** : 7+ endpoints publics sans validation de signature
2. **Logs verbeux** : 265+ console.log dont certains exposent des données sensibles
3. **Routes de debug en prod** : 7+ endpoints de test/debug accessibles publiquement
4. **Types TypeScript en retard** : Plusieurs champs DB non reflétés dans les types

---

## Prompt Claude Code — Corrections Prioritaires

```
CORRECTIONS PRIORITAIRES ULTRON — PRÉ-DÉMO

1. CRITIQUE SÉCURITÉ — src/lib/extension-auth.ts
   Remplace :
   `const secret = process.env.SUPABASE_JWT_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;`
   Par :
   ```
   const secret = process.env.SUPABASE_JWT_SECRET;
   if (!secret) throw new Error('SUPABASE_JWT_SECRET required');
   ```

2. CRITIQUE SÉCURITÉ — src/app/api/voice/ai-agent/vapi-webhook/route.ts
   La fonction validateVapiSignature() retourne toujours true.
   Implémente une vraie validation HMAC-SHA256.
   VÉRIFIE D'ABORD la doc Vapi pour le nom du header de signature.

3. FONCTIONNEL — Même fichier vapi-webhook/route.ts
   Implémente les 2 TODOs :
   - Ligne ~588 : Envoi email confirmation RDV au prospect
   - Ligne ~594 : Notification au conseiller quand prospect CHAUD détecté

4. SÉCURITÉ — Routes de debug en production
   Protège ou supprime ces routes :
   - /api/security/test/attack/route.ts (AUCUNE AUTH)
   - /api/security-test/route.ts
   - /api/test-db/route.ts
   - /api/pagination/test/route.ts
   Ajoute : if (process.env.NODE_ENV !== 'development') return 404

5. FONCTIONNEL — src/lib/assistant/sql-validator.ts
   Ajoute les tables manquantes dans ALLOWED_TABLES :
   products, deal_products, advisor_commissions, meeting_transcripts,
   phone_calls, voice_calls, lead_searches, lead_results, linkedin_posts

6. TYPES — src/types/crm.ts
   Ajoute les champs manquants à CrmProspect :
   mail_plaquette_sent?: boolean;
   mail_synthese_sent?: boolean;
   mail_rappel_sent?: boolean;
   total_commission_earned?: number;
   products_sold?: number;

   Corrige qualification de 'chaud'|'tiede'|'froid' en 'CHAUD'|'TIEDE'|'FROID'

7. LOGS — Nettoie les console.log sensibles dans les routes API :
   Remplace les console.log qui affichent des longueurs de token,
   des événements complets JSON.stringify, ou des données prospect
   par des appels au logger avec niveau approprié.
```

---

## Recommandations Finales

### Pour la démo dans 10 jours :
1. ✅ **Immédiat (24h)** : Répondre à Google OAuth (email prêt dans `drafts/`)
2. ✅ **Jour 1-2** : Corriger les 4 bugs critiques (C1-C4)
3. ✅ **Jour 3-5** : Corriger les 6 bugs importants (I1-I6)
4. ✅ **Jour 6-8** : Test end-to-end complet avec compte client
5. ✅ **Jour 9** : Dry run de la démo
6. ✅ **Jour 10** : Démo client

### Points à valider avec Martin :
- [ ] Le scope `spreadsheets` est-il encore utilisé ?
- [ ] Quel compte de test fournir à Google ?
- [ ] Le screenshot d'erreur de Google (pièce jointe) — à analyser
- [ ] Les routes de debug doivent-elles rester en prod ?
