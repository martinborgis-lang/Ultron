# 🧪 GUIDE DE TEST ULTRON - Manuel Complet

## 📋 Table des Matières

1. [Prérequis & Configuration](#-prérequis--configuration)
2. [Authentification & Setup Initial](#-authentification--setup-initial)
3. [Module CRM & Prospects](#-module-crm--prospects)
4. [Module Voice & Téléphonie](#-module-voice--téléphonie)
5. [IA Assistant Conversationnel](#-ia-assistant-conversationnel)
6. [Dashboard Admin & Analytics](#-dashboard-admin--analytics)
7. [Planning & Meetings](#-planning--meetings)
8. [Extension Chrome](#-extension-chrome)
9. [APIs & Intégrations](#-apis--intégrations)
10. [Dépannage & Debug](#-dépannage--debug)

---

## 🛠️ Prérequis & Configuration

### Variables d'environnement requises

Créez un fichier `.env.local` avec les variables suivantes :

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic Claude (IA)
ANTHROPIC_API_KEY=your_anthropic_key

# Google (Gmail, Sheets, Calendar)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Twilio (Voice - Optionnel)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_API_KEY=your_twilio_api_key
TWILIO_API_SECRET=your_twilio_secret
TWILIO_TWIML_APP_SID=your_twiml_app_sid
TWILIO_PHONE_NUMBER=your_twilio_phone

# Deepgram (Transcription - Optionnel)
DEEPGRAM_API_KEY=your_deepgram_key

# QStash (Tâches - Optionnel)
QSTASH_URL=your_qstash_url
QSTASH_TOKEN=your_qstash_token
```

### Installation et démarrage

```bash
# Installation
npm install

# Démarrage
npm run dev

# URL : http://localhost:3000
```

### Configuration initiale base de données

1. **Importer le schéma** : Exécutez `/database/ultron-complete-schema.sql` dans Supabase
2. **Créer une organisation** : Première inscription crée automatiquement une organisation
3. **Configurer les permissions RLS** : Vérifiez que Row Level Security est activé

---

## 🔐 Authentification & Setup Initial

### Test 1: Inscription et Connexion

1. **Aller sur** `/register`
2. **Remplir le formulaire** :
   - Email: `test@example.com`
   - Mot de passe: `Test123456!`
   - Nom d'organisation: `Test Corp`
3. **Vérifier** :
   - ✅ Redirection vers `/dashboard`
   - ✅ Organisation créée dans Supabase
   - ✅ User avec role 'admin' créé

### Test 2: Configuration Google (Optionnel)

1. **Aller sur** `/settings`
2. **Section "Intégrations Google"**
3. **Cliquer** "Connecter Google"
4. **Vérifier** :
   - ✅ Redirection OAuth Google
   - ✅ Permissions Gmail, Sheets, Calendar
   - ✅ Credentials stockés en base

---

## 🎯 Module CRM & Prospects

### Test 3: Gestion des Prospects

#### 3.1 Création de prospect

1. **Aller sur** `/prospects`
2. **Cliquer** "Nouveau Prospect"
3. **Remplir le formulaire** :
   ```
   Prénom: Jean
   Nom: Dupont
   Email: jean.dupont@email.com
   Téléphone: +33123456789
   Entreprise: SARL Dupont
   Patrimoine estimé: 150000
   Revenus annuels: 60000
   ```
4. **Vérifier** :
   - ✅ Prospect créé avec stage "nouveau"
   - ✅ Score IA calculé automatiquement
   - ✅ Qualification (CHAUD/TIEDE/FROID) assignée

#### 3.2 Pipeline Kanban

1. **Aller sur** `/pipeline`
2. **Vérifier colonnes** :
   - Nouveau
   - Qualifié
   - RDV Pris
   - Proposition
   - Négociation
   - Fermé Gagné
   - Fermé Perdu
3. **Tester drag & drop** :
   - Déplacer prospect entre colonnes
   - ✅ Stage mis à jour en temps réel
   - ✅ API call vers `/api/prospects/unified/[id]/stage`

#### 3.3 Vue 360° Prospect

1. **Cliquer sur un prospect** dans la liste
2. **URL** : `/prospects/[id]`
3. **Vérifier sections** :
   - ✅ Informations personnelles
   - ✅ Historique activités
   - ✅ Tâches assignées
   - ✅ Notes et commentaires
   - ✅ Produits vendus (si applicable)

### Test 4: Système de Scoring IA

#### 4.1 Configuration du scoring

1. **Aller sur** `/settings/scoring`
2. **Modifier les seuils** :
   ```
   Seuil CHAUD: 70
   Seuil TIÈDE: 40
   Pondération Revenus: 25%
   Pondération IA: 50%
   Pondération Patrimoine: 25%
   ```
3. **Sauvegarder**
4. **Vérifier** : Configuration stockée dans `organizations.scoring_config`

#### 4.2 Test qualification automatique

1. **Créer prospect avec revenus élevés** (>80000€) et patrimoine important (>200000€)
2. **Vérifier** :
   - ✅ Score IA > 70 → Qualification "CHAUD"
   - ✅ Badge vert dans l'interface
3. **Créer prospect avec revenus faibles** (<30000€)
4. **Vérifier** :
   - ✅ Score IA < 40 → Qualification "FROID"
   - ✅ Badge rouge dans l'interface

---

## 📞 Module Voice & Téléphonie

### Test 5: Configuration Voice (avec Twilio)

#### 5.1 Configuration

1. **Aller sur** `/settings/voice`
2. **Vérifier statut Twilio** :
   - ✅ Credentials détectés
   - ✅ Numéro Twilio affiché
3. **Configurer agent IA** :
   ```
   Nom agent: Assistant CGP
   Prompt: Vous êtes un assistant pour cabinet de gestion de patrimoine...
   Voix: alloy
   Langue: fr
   ```

#### 5.2 Test Click-to-Call

1. **Aller sur** `/prospects`
2. **Cliquer icône téléphone** sur un prospect
3. **Widget d'appel s'ouvre** :
   - ✅ Token Twilio généré
   - ✅ WebRTC Device initialisé
   - ✅ Numéro prospect affiché
4. **Tester appel** :
   - ✅ Connexion établie
   - ✅ Timer démarre
   - ✅ Contrôles mute/unmute fonctionnels

#### 5.3 Agent IA Vocal

1. **Aller sur** `/voice/ai-agent`
2. **Créer campagne** :
   ```
   Nom: Test Prospection
   Script: Bonjour, nous vous contactons...
   Prospects: Sélectionner 2-3 prospects
   ```
3. **Lancer campagne**
4. **Vérifier** :
   - ✅ Appels automatiques lancés
   - ✅ IA agent utilise le script configuré
   - ✅ Réponses adaptées aux interactions

### Test 6: Transcription et Analyse

#### 6.1 Transcription automatique (avec Deepgram)

1. **Effectuer un appel** via Click-to-Call
2. **Laisser enregistrement actif**
3. **Terminer appel**
4. **Vérifier** :
   - ✅ Webhook Twilio déclenché
   - ✅ Transcription générée automatiquement
   - ✅ Texte accessible dans l'historique

#### 6.2 Analyse IA post-appel

1. **Aller sur** `/voice/calls`
2. **Sélectionner appel avec transcription**
3. **Vérifier analyse automatique** :
   - ✅ Résumé intelligent généré
   - ✅ Points clés extraits
   - ✅ Objections détectées
   - ✅ Prochaines actions suggérées
   - ✅ Sentiment overall (positif/négatif/neutre)

---

## 🤖 IA Assistant Conversationnel

### Test 7: Assistant IA

#### 7.1 Interface Chat

1. **Aller sur** `/assistant`
2. **Vérifier interface** :
   - ✅ Zone de chat claire
   - ✅ Suggestions d'exemple
   - ✅ Indicateur de frappe

#### 7.2 Requêtes SQL Naturelles

**Test requêtes simples** :
```
"Combien de prospects ai-je ?"
"Quels sont mes prospects CHAUDS ?"
"Quel est mon taux de conversion ce mois ?"
```

**Vérifier** :
- ✅ Requête convertie en SQL sécurisé
- ✅ Résultats affichés en tableau
- ✅ Respect des permissions RLS

**Test requêtes complexes** :
```
"Montre-moi l'évolution de mes prospects par semaine depuis 30 jours"
"Quel conseiller a le meilleur taux de conversion ?"
"Combien de CA j'ai généré par produit ?"
```

**Vérifier** :
- ✅ Jointures multiples gérées
- ✅ Groupement et agrégation corrects
- ✅ Formatage lisible des résultats

#### 7.3 Aide Conversationnelle

**Tester questions métier** :
```
"Comment améliorer mon taux de conversion ?"
"Quelle stratégie pour mes prospects froids ?"
"Comment optimiser ma prospection ?"
```

**Vérifier** :
- ✅ Réponses contextuelles et pertinentes
- ✅ Suggestions actionables
- ✅ Références aux données de l'organisation

---

## 📊 Dashboard Admin & Analytics

### Test 8: Dashboard Admin

#### 8.1 Accès Admin

1. **S'assurer d'avoir role 'admin'** en base
2. **Aller sur** `/admin`
3. **Vérifier accès** :
   - ✅ Page accessible uniquement aux admins
   - ✅ Redirection si pas admin

#### 8.2 Métriques Principales

**Vérifier cards de stats** :
- ✅ Total prospects
- ✅ Taux de conversion
- ✅ CA généré ce mois
- ✅ Nombre d'appels

**Tester période de données** :
- Changer filtres temporels
- ✅ Données mises à jour automatiquement

#### 8.3 Graphiques Avancés

**Revenue Chart** :
- ✅ Évolution CA par mois
- ✅ Comparaison année précédente
- ✅ Tendance claire

**Conversion Funnel** :
- ✅ Entonnoir par étape pipeline
- ✅ Pourcentages de conversion
- ✅ Identification des blocages

**Performance Advisors** :
- ✅ Classement conseillers
- ✅ CA par conseiller
- ✅ Nombre de deals fermés

#### 8.4 Alertes Configurables

1. **Aller sur** `/settings/thresholds`
2. **Configurer seuils** :
   ```
   Taux conversion WARNING: < 15%
   Taux conversion CRITICAL: < 10%
   Activité WARNING: < 5 appels/semaine
   ```
3. **Vérifier alertes** dans dashboard admin :
   - ✅ Alertes remontées si seuils dépassés
   - ✅ Actions correctives suggérées

---

## 📅 Planning & Meetings

### Test 9: Gestion Planning

#### 9.1 Événements et Tâches

1. **Aller sur** `/planning`
2. **Créer tâche** :
   ```
   Titre: Relancer prospects froids
   Type: Task
   Priorité: High
   Date limite: Demain
   Assigné à: Moi
   ```
3. **Créer RDV** :
   ```
   Titre: RDV M. Dupont
   Type: Meeting
   Date: Demain 14h
   Prospect: Jean Dupont
   Lien Meet: Auto-généré
   ```

**Vérifier** :
- ✅ Événements visibles dans planning
- ✅ Notifications programmées
- ✅ Synchronisation Google Calendar (si configuré)

#### 9.2 Vue Agenda

1. **Aller sur** `/agenda`
2. **Tester vues** :
   - ✅ Vue jour
   - ✅ Vue semaine
   - ✅ Vue mois
   - ✅ Vue liste
3. **Tester interactions** :
   - ✅ Drag & drop événements
   - ✅ Redimensionnement
   - ✅ Édition en place

### Test 10: Meetings & Transcription

#### 10.1 Préparation Meeting

1. **Aller sur** `/meeting/prepare/[prospectId]`
2. **Vérifier brief IA** :
   - ✅ Historique interactions
   - ✅ Informations prospect
   - ✅ Points à aborder suggérés
   - ✅ Objections possibles

#### 10.2 Transcription Meeting

1. **Aller sur** `/meetings`
2. **Uploader fichier audio** (format MP3/WAV)
3. **Lancer transcription**
4. **Vérifier** :
   - ✅ Transcription temps réel
   - ✅ Détection speakers multiples
   - ✅ Ponctuation automatique

#### 10.3 Analyse Meeting

**Après transcription** :
- ✅ Résumé intelligent généré
- ✅ Points clés extraits
- ✅ Objections client détectées
- ✅ Prochaines actions suggérées
- ✅ Export PDF disponible

---

## 🔌 Extension Chrome

### Test 11: Extension Chrome (Side Panel)

#### 11.1 Installation

1. **Activer mode développeur** dans Chrome
2. **Charger extension** depuis dossier projet
3. **Vérifier** :
   - ✅ Icône extension visible
   - ✅ Side panel activable

#### 11.2 Authentification

1. **Cliquer icône extension**
2. **Se connecter** avec credentials Ultron
3. **Vérifier** :
   - ✅ Token stocké localement
   - ✅ Accès aux données organisation

#### 11.3 Fonctionnalités

**Recherche prospect** :
- Saisir nom/email dans search
- ✅ Résultats instantanés
- ✅ Détails prospect affichés

**Analyse temps réel** :
- Activer pendant appel/meeting
- ✅ Suggestions contextuelles
- ✅ Objections détectées en live
- ✅ Réponses suggérées

**Qualification rapide** :
- Modifier statut prospect depuis extension
- ✅ Synchronisation immédiate avec webapp

---

## 🔗 APIs & Intégrations

### Test 12: APIs Unifiées

#### 12.1 Mode CRM vs Sheet

**Test Mode CRM** :
```bash
# GET prospects
curl "http://localhost:3000/api/prospects/unified" \
  -H "Authorization: Bearer $TOKEN"

# POST nouveau prospect
curl "http://localhost:3000/api/prospects/unified" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"first_name":"Test","last_name":"API","email":"test@api.com"}'
```

**Test Mode Sheet** :
1. **Configurer mode** dans `/settings/data-source`
2. **Lier Google Sheet**
3. **Tester mêmes APIs** :
   - ✅ Lecture prospects depuis Sheet
   - ✅ Écriture limitée (statuts)

#### 12.2 APIs Spécialisées

**Extension APIs** :
```bash
# Authentification extension
curl "http://localhost:3000/api/auth/extension-login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Analyse temps réel
curl "http://localhost:3000/api/extension/analyze-realtime" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"text":"Le client semble intéressé par l'\''assurance vie"}'
```

**Meeting APIs** :
```bash
# Transcription
curl "http://localhost:3000/api/meeting/transcribe" \
  -H "Authorization: Bearer $TOKEN" \
  -F "audio=@recording.mp3"

# Analyse meeting
curl "http://localhost:3000/api/meeting/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"transcript":"Conversation transcript...","prospectName":"Jean Dupont"}'
```

### Test 13: Webhooks & Automation

#### 13.1 Webhooks Twilio

**Configurer webhook URL** dans Twilio Console :
```
https://yourdomain.com/api/voice/click-to-call/twilio-webhook
```

**Tester** :
- Effectuer appel
- ✅ Webhook reçu automatiquement
- ✅ Statut appel mis à jour en base
- ✅ Transcription déclenchée si recording

#### 13.2 QStash Automation

**Tâches programmées** :
- Emails de relance automatiques
- Rappels RDV
- Notifications équipe

**Vérifier** :
- ✅ Jobs programmés correctement
- ✅ Exécution aux bonnes dates
- ✅ Logs d'exécution disponibles

---

## 🐛 Dépannage & Debug

### Problèmes Courants

#### Problème 1: Erreurs de build
```bash
# Vérifier TypeScript
npm run typecheck

# Build local
npm run build

# Logs détaillés
npm run build -- --debug
```

#### Problème 2: APIs qui échouent
```bash
# Vérifier variables d'environnement
echo $ANTHROPIC_API_KEY
echo $NEXT_PUBLIC_SUPABASE_URL

# Tester connexion Supabase
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

#### Problème 3: Authentification
1. **Vérifier RLS activé** dans Supabase
2. **Vérifier policies** pour chaque table
3. **Vérifier JWT** dans localStorage
4. **Tester** `/api/user/me` pour validation session

#### Problème 4: Intégrations externes

**Google** :
- Vérifier scopes OAuth
- Refresh tokens si nécessaire
- Tester `/api/google/check-scopes`

**Twilio** :
- Vérifier credentials dans `.env.local`
- Tester génération token : `/api/voice/click-to-call/token`
- Vérifier webhooks configurés

**Deepgram** :
- Vérifier API key valide
- Tester transcription simple
- Vérifier quotas utilisés

### Logs & Monitoring

#### Logs Application
```bash
# Logs Next.js
tail -f .next/trace

# Logs Supabase
# Via dashboard Supabase > Logs

# Logs Vercel (production)
# Via dashboard Vercel > Functions > Logs
```

#### Debug Mode
```bash
# Activer debug
DEBUG=ultron:* npm run dev

# Debug spécifique
DEBUG=ultron:api npm run dev
DEBUG=ultron:auth npm run dev
```

#### Health Checks

**Endpoints de diagnostic** :
- `/api/test-db` - Test connexion base
- `/api/gmail/test` - Test Gmail API
- `/api/sheets/test` - Test Google Sheets
- `/api/prompts/test` - Test IA Claude

---

## ✅ Checklist de Tests Complète

### Tests Fonctionnels de Base
- [ ] Inscription/Connexion utilisateur
- [ ] Création/Édition prospect
- [ ] Pipeline drag & drop
- [ ] Scoring IA automatique
- [ ] Dashboard métriques
- [ ] Planning événements

### Tests Fonctionnels Avancés
- [ ] Click-to-call Twilio
- [ ] Agent IA vocal
- [ ] Transcription meeting
- [ ] IA Assistant chat
- [ ] Extension Chrome
- [ ] Dashboard admin complet

### Tests APIs
- [ ] CRUD prospects (mode CRM + Sheet)
- [ ] Authentification JWT
- [ ] Webhooks Twilio
- [ ] APIs extension sécurisées
- [ ] Upload/transcription audio

### Tests Intégrations
- [ ] Google OAuth complet
- [ ] Synchronisation Google Calendar
- [ ] Gmail API envoi emails
- [ ] Google Sheets lecture/écriture
- [ ] Deepgram transcription
- [ ] QStash tâches programmées

### Tests Performance
- [ ] Temps chargement < 3s
- [ ] APIs répondent < 1s
- [ ] Upload fichiers < 30s
- [ ] Build réussi < 2min
- [ ] Pas de memory leaks

### Tests Sécurité
- [ ] RLS Supabase actif
- [ ] JWT validation correcte
- [ ] CORS configuré extension
- [ ] Variables sensibles protégées
- [ ] SQL injection impossible

---

**✨ Ce guide vous permet de tester exhaustivement toutes les fonctionnalités d'Ultron et de vérifier que l'application fonctionne comme prévu dans tous les scenarios d'usage.**