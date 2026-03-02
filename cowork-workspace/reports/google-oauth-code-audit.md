# 🔍 Audit Conformité Code OAuth - Ultron
**Date d'audit :** 2 mars 2026
**Fichier principal :** `src/lib/google.ts`

---

## 1. Scopes OAuth Utilisés

### Scopes Organisation (google.ts:10-17)
| Scope | Code qui l'utilise | Justification | Verdict |
|-------|-------------------|---------------|---------|
| `gmail.send` | `src/lib/gmail.ts`, webhooks email | Envoi emails prospects (qualification, plaquette, rappels) | ✅ UTILISÉ |
| `userinfo.email` | Auth flow, `src/lib/google.ts` | Identification utilisateur OAuth | ✅ UTILISÉ |
| `drive.readonly` | `src/app/api/organization/plaquette/route.ts` | Téléchargement plaquettes PDF depuis Drive | ✅ UTILISÉ |
| `calendar` | `src/lib/google-calendar.ts` | Synchronisation bidirectionnelle calendrier | ✅ UTILISÉ |
| `calendar.events` | `src/app/api/calendar/events/route.ts` | Création/modification RDV | ✅ UTILISÉ |
| `spreadsheets` | Mode Google Sheets legacy | Accès tableur mode legacy | ⚠️ À VÉRIFIER - Mode legacy encore actif ? |

### Scopes Utilisateur/Gmail (google.ts:20-26)
| Scope | Code qui l'utilise | Justification | Verdict |
|-------|-------------------|---------------|---------|
| `gmail.send` | `src/lib/gmail.ts` | Envoi emails individuels par conseiller | ✅ UTILISÉ |
| `gmail.readonly` | `src/app/api/crm/emails/route.ts` | Lecture historique emails reçus | ✅ UTILISÉ |
| `userinfo.email` | Auth flow | Identification | ✅ UTILISÉ |
| `calendar` | `src/lib/google-calendar.ts` | Accès calendrier conseiller | ✅ UTILISÉ |
| `calendar.events` | `src/app/api/calendar/events/route.ts` | CRUD événements | ✅ UTILISÉ |

### ⚠️ Scope potentiellement à retirer
- **`spreadsheets`** : Si le mode Google Sheets legacy n'est plus utilisé activement, ce scope pourrait être retiré de la configuration Organisation. Cela simplifierait la vérification Google. **→ À confirmer avec Martin.**

---

## 2. Configuration OAuth

### Fichier : `src/lib/google.ts` (lignes 75-86)

| Paramètre | Valeur | Status |
|-----------|--------|--------|
| `access_type` | `'offline'` | ✅ CORRECT - Permet le refresh token |
| `prompt` | `'consent'` | ✅ CORRECT - Force l'écran de consentement |
| `include_granted_scopes` | `true` | ✅ BON - Autorisation incrémentale |
| Sélection scopes par type | `organization` / `gmail` | ✅ CORRECT - Scopes adaptés au contexte |

### Fichier : `src/app/api/google/auth/route.ts`
- ✅ Authentification utilisateur vérifiée avant redirection OAuth
- ✅ State parameter encodé en base64 avec `organization_id` + `user_id` + `type`
- ✅ Try-catch complet

### Fichier : `src/app/api/google/callback/route.ts`
- ✅ Validation du state parameter
- ✅ Vérification que l'organisation correspond à l'utilisateur
- ✅ **Vérification explicite du refresh_token** (CRITIQUE pour le fonctionnement offline)
- ✅ Stockage sécurisé via `createAdminClient()` (bypass RLS pour écriture credentials)
- ✅ 7 scénarios d'erreur gérés

### Fichier : `src/app/api/google/check-scopes/route.ts`
- ✅ Vérifie les scopes Calendar
- ✅ Détecte les erreurs 403 + "scope" pour indiquer reconnexion nécessaire
- ✅ Retourne `hasCalendarScope` + `needsReconnect`

---

## 3. Pages Légales

### Privacy Policy (`/privacy`)
**Fichier :** `src/app/(legal)/privacy/page.tsx` - 261 lignes

| Critère Google | Status | Détail |
|----------------|--------|--------|
| Page accessible publiquement | ✅ | Route publique sans auth |
| Décrit les données collectées | ✅ | Section 3 détaillée (users + prospects) |
| Décrit l'utilisation des données | ✅ | Section 4 avec tableau base légale |
| Mentionne les sous-traitants | ✅ | 5 sub-processors listés (Supabase, Vercel, Google, Anthropic, Upstash) |
| Mentionne les droits RGPD | ✅ | 8 droits listés avec articles |
| Contact DPO/responsable | ✅ | Martin Borgis, SIRET, email, adresse |
| Politique cookies | ✅ | Cookies techniques uniquement |
| Transferts hors UE | ✅ | SCC mentionnées |
| Durées de conservation | ✅ | 3 ans prospects, 10 ans facturation |

**Verdict :** ✅ COMPLÈTE ET CONFORME

### Mentions Légales (`/legal`)
**Fichier :** `src/app/(legal)/legal/page.tsx` - 198 lignes

| Critère | Status | Détail |
|---------|--------|--------|
| Éditeur identifié | ✅ | Martin Borgis, SIRET 93348899100011, APE 6201Z |
| Hébergeur identifié | ✅ | Vercel US + Supabase |
| Propriété intellectuelle | ✅ | Section dédiée |
| Loi applicable | ✅ | Droit français + médiation CEMAP |
| Lien vers privacy policy | ✅ | Cross-linking bidirectionnel |

**Verdict :** ✅ COMPLÈTE

---

## 4. URLs à vérifier dans Google Cloud Console

| Paramètre | Valeur attendue | À vérifier |
|-----------|----------------|------------|
| Homepage URL | `https://ultron-ai.pro` | ⚠️ Vérifier dans la Console |
| Privacy Policy URL | `https://ultron-ai.pro/privacy` | ⚠️ Vérifier dans la Console |
| Terms of Service URL | `https://ultron-ai.pro/legal` | ⚠️ Vérifier dans la Console |
| Authorized redirect URI | `https://ultron-ai.pro/api/google/callback` | ⚠️ Vérifier |
| Authorized redirect URI | `https://ultron-murex.vercel.app/api/google/callback` | ⚠️ Vérifier |

---

## 5. Problème Identifié par Google (Email du 17 Fév)

### Hypothèses sur le problème "Connect Google Account introuvable" :

1. **Le bouton est dans les Settings** : L'équipe Google n'a peut-être pas navigué jusqu'à Settings > Intégrations Google. Il faut leur fournir le chemin exact.

2. **Le bouton n'est visible qu'après login** : Google n'a peut-être pas de compte de test pour se connecter à l'app.

3. **Erreur technique** : Le screenshot joint peut révéler un crash ou une erreur serveur lors du flow OAuth.

### Recommandation :
Fournir à Google :
- Un compte de test (email + mot de passe)
- Des instructions étape par étape avec screenshots
- Optionnellement une vidéo screencast (3-5 min)

---

## 6. Vidéo de Démonstration

**Status :** Google ne demande pas explicitement une vidéo dans les emails, mais mentionne "Learn more" sur comment tester.

**Recommandation :** Préparer une vidéo de 3-5 minutes montrant :
1. Login sur l'app
2. Navigation vers Settings
3. Clic sur "Connecter Google"
4. Écran de consentement Google
5. Retour dans l'app avec accès Gmail + Calendar confirmé
6. Démonstration de chaque scope (envoyer email, voir calendrier, etc.)

---

## 7. Résumé des Corrections Nécessaires

| # | Correction | Priorité | Impact |
|---|-----------|----------|--------|
| 1 | Vérifier URLs dans Google Cloud Console | 🔴 CRITIQUE | Bloque la vérification |
| 2 | Préparer compte de test pour Google | 🔴 CRITIQUE | Google ne peut pas tester |
| 3 | Analyser le screenshot d'erreur joint | 🔴 CRITIQUE | Peut révéler un bug |
| 4 | Évaluer retrait scope `spreadsheets` | 🟡 MOYEN | Simplifie la vérification |
| 5 | Préparer vidéo de démonstration | 🟡 MOYEN | Accélère la review |
