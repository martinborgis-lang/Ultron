# CLAUDE.md - Instructions pour Claude Code

## 🎯 PROJET ULTRON

**Ultron** est une application SaaS multi-tenant pour automatiser la gestion de prospects pour des cabinets de gestion de patrimoine.

### Fonctionnalités principales
- Dashboard avec statistiques en temps réel depuis Google Sheets
- Connexion OAuth Google par entreprise (Sheets) + par conseiller (Gmail)
- Workflows automatisés (qualification, emails, rappels)
- Personnalisation des prompts IA par entreprise
- Gestion multi-conseillers avec Gmail individuel
- Rappels programmés via QStash (pas de CRON)
- Calculateur d'intérêts composés

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
│   │   ├── prospects/page.tsx
│   │   ├── features/
│   │   │   └── calculateur/page.tsx    # Calculateur intérêts composés
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── prompts/page.tsx
│   │       └── team/page.tsx
│   ├── auth/
│   │   ├── callback/page.tsx           # Callback OAuth + invitations
│   │   └── set-password/page.tsx       # Création mot de passe invités
│   ├── api/
│   │   ├── google/
│   │   │   ├── auth/route.ts           # OAuth Google (?type=organization|gmail)
│   │   │   └── callback/route.ts       # Callback OAuth
│   │   ├── sheets/
│   │   │   ├── prospects/route.ts      # Lit les prospects
│   │   │   ├── stats/route.ts          # Calcule les stats
│   │   │   └── test/route.ts           # Teste la connexion
│   │   ├── webhooks/
│   │   │   ├── qualification/route.ts  # Qualifie un prospect
│   │   │   ├── rdv-valide/route.ts     # Mail synthèse + programme rappel QStash
│   │   │   ├── plaquette/route.ts      # Mail + PDF plaquette
│   │   │   └── send-rappel/route.ts    # Reçoit appel QStash, envoie rappel
│   │   ├── organization/
│   │   │   ├── sheet/route.ts          # Update sheet_id
│   │   │   └── plaquette/route.ts      # Update plaquette_url
│   │   ├── team/
│   │   │   ├── route.ts                # GET/POST conseillers
│   │   │   └── [id]/
│   │   │       ├── route.ts            # PATCH/DELETE conseiller
│   │   │       └── gmail/route.ts      # DELETE gmail credentials
│   │   ├── user/
│   │   │   └── me/route.ts             # GET current user
│   │   └── prompts/route.ts            # CRUD prompts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                             # shadcn components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MobileNav.tsx
│   ├── dashboard/
│   │   ├── DashboardContent.tsx
│   │   ├── StatsCards.tsx
│   │   ├── ProspectsChart.tsx
│   │   ├── RecentProspects.tsx
│   │   └── ActivityFeed.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── settings/
│   │   ├── GoogleSheetsConfig.tsx
│   │   ├── PlaquetteConfig.tsx
│   │   ├── PromptEditor.tsx
│   │   └── TeamManager.tsx
│   ├── prospects/
│   │   └── ProspectsContent.tsx
│   └── features/
│       └── InterestCalculator.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts                    # Client avec SERVICE_ROLE_KEY
│   ├── google.ts                       # OAuth + Sheets API + Drive API
│   ├── gmail.ts                        # Envoi d'emails
│   ├── anthropic.ts                    # Claude API
│   ├── qstash.ts                       # Programmation rappels
│   └── utils.ts
├── hooks/
│   ├── useUser.ts
│   └── useOrganization.ts
├── types/
│   └── index.ts
└── middleware.ts
```

---

## 🗄️ STRUCTURE BASE DE DONNÉES SUPABASE

### Tables

**organizations** - Entreprises clientes
- id, name, slug, google_sheet_id, google_credentials (JSONB)
- prompt_qualification, prompt_synthese, prompt_rappel, prompt_plaquette (JSONB)
- plaquette_url, plan, created_at

**users** - Utilisateurs (conseillers)
- id, auth_id, organization_id, email, full_name, role ('admin'|'conseiller')
- gmail_credentials (JSONB) - credentials Gmail individuels
- is_active, created_at

**prompts** - Prompts IA personnalisables (legacy)
- id, organization_id, type, name, system_prompt, user_prompt

**scheduled_emails** - Emails programmés (legacy, remplacé par QStash)
- id, organization_id, prospect_data (JSONB), email_type, scheduled_for, status, sent_at, error_message

**email_logs** - Historique des emails envoyés
- id, organization_id, prospect_email, prospect_name, email_type, subject, body, gmail_message_id, has_attachment, sent_at

**daily_stats** - Stats quotidiennes
- id, organization_id, date, total_prospects, prospects_chaud/tiede/froid, mails_envoyes, rdv_pris

---

## 🔐 VARIABLES D'ENVIRONNEMENT
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Google OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # ou https://ultron-murex.vercel.app en prod

# Anthropic (Claude AI)
ANTHROPIC_API_KEY=sk-ant-xxx

# Upstash QStash (pour rappels programmés)
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
│  Google Credentials (Sheets + Drive)                            │
│  ↓                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Conseiller A│  │ Conseiller B│  │ Conseiller C│             │
│  │ Gmail A     │  │ Gmail B     │  │ Gmail C     │             │
│  │ (admin)     │  │ (conseiller)│  │ (conseiller)│             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  Google Sheet partagée (colonne Z = Email Conseiller)           │
└─────────────────────────────────────────────────────────────────┘
```

### Flux d'invitation conseiller

1. Admin ajoute conseiller (Settings → Team)
2. Supabase envoie email d'invitation
3. Conseiller clique le lien → /auth/callback
4. Redirection vers /auth/set-password
5. Conseiller crée son mot de passe
6. Conseiller se connecte → connecte son Gmail

### OAuth Google - Deux types

| Type | URL | Stockage | Usage |
|------|-----|----------|-------|
| Organization | `/api/google/auth?type=organization` | organizations.google_credentials | Sheets, Drive |
| Gmail | `/api/google/auth?type=gmail` | users.gmail_credentials | Envoi emails |

### Logique d'envoi d'emails
```typescript
// Priorité : Gmail conseiller > Gmail organisation
const gmailCredentials = conseiller?.gmail_credentials || org.google_credentials;
```

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
- Génère et envoie mail de synthèse (Gmail du conseiller si disponible)
- Programme rappel 24h via QStash
- Update colonne X (Mail Synthèse = Oui)

### 3. Plaquette (/api/webhooks/plaquette)
- Déclenché quand statut = "À rappeler - Plaquette"
- Génère mail sobre
- Télécharge PDF depuis Google Drive
- Envoie avec pièce jointe
- Update colonne W (Mail Plaquette = Oui)

### 4. Rappel 24h (/api/webhooks/send-rappel)
- Appelé par QStash exactement 24h avant le RDV
- Génère et envoie mail de rappel
- Update colonne Y (Mail Rappel = Oui)

### Programmation des rappels (QStash)
```typescript
// Dans rdv-valide, après envoi mail synthèse
import { scheduleRappelEmail } from '@/lib/qstash';

const scheduledFor = new Date(dateRdv.getTime() - 24 * 60 * 60 * 1000);
await scheduleRappelEmail(scheduledFor, {
  organizationId: org.id,
  prospectData: { ... },
  rowNumber: payload.row_number,
});
```

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

## 📝 APPS SCRIPT COMPLET
```javascript
// ===== CONFIGURATION ULTRON =====
const WEBHOOK_BASE = "https://ultron-murex.vercel.app/api/webhooks";

// ===== TRIGGER PRINCIPAL =====
function installedOnEdit(e) {
  try {
    if (!e || !e.source) return;

    const sheet = e.source.getActiveSheet();
    if (sheet.getName() !== "prospect") return;

    const range = e.range;
    const col = range.getColumn();
    const row = range.getRow();

    if (row === 1) return;

    // Colonne P (Rappel Souhaité) = 16 → Lien Calendar
    if (col === 16) {
      checkRappelCalendar(e);
      return;
    }

    // Colonne N (Statut Appel) = 14 → Webhooks
    if (col !== 14) return;

    const sheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
    const data = sheet.getRange(row, 1, 1, 26).getValues()[0];
    const statut = String(data[13]).trim();

    Logger.log("Statut détecté: " + statut + " pour ligne " + row);

    const conseillerEmail = String(data[25] || "").trim();
    Logger.log("Conseiller: " + (conseillerEmail || "Non spécifié"));

    const payload = {
      sheet_id: sheetId,
      row_number: row,
      conseiller_email: conseillerEmail,
      data: {
        id: data[0], date_lead: data[1], nom: data[2], prenom: data[3],
        email: data[4], telephone: data[5], source: data[6], age: data[7],
        situation_pro: data[8], revenus: data[9], patrimoine: data[10],
        besoins: data[11], notes_appel: data[12], statut: data[13],
        date_rdv: data[14], rappel_souhaite: data[15], qualification: data[16],
        score: data[17], priorite: data[18], justification: data[19],
        conseiller_email: conseillerEmail
      }
    };

    if (statut === "RDV Validé") {
      if (String(data[23]).trim().toLowerCase() !== "oui") {
        Logger.log("→ Appel rdv-valide...");
        sendWebhook("/rdv-valide", payload);
      }
    } else if (statut === "À rappeler - Plaquette") {
      if (String(data[22]).trim().toLowerCase() !== "oui") {
        Logger.log("→ Appel plaquette...");
        sendWebhook("/plaquette", payload);
      }
    }

  } catch (error) {
    Logger.log("❌ Erreur installedOnEdit: " + error.toString());
  }
}

function sendWebhook(endpoint, payload) {
  try {
    const url = WEBHOOK_BASE + endpoint;
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    const body = response.getContentText();

    Logger.log("📤 Webhook " + endpoint + " envoyé. Code: " + code);
    Logger.log("📥 Réponse: " + body);

  } catch (error) {
    Logger.log("❌ Erreur sendWebhook: " + error.toString());
  }
}

function checkRappelCalendar(e) {
  try {
    if (!e || !e.source) return;

    const sheet = e.source.getActiveSheet();
    if (sheet.getName() !== "prospect") return;
    if (e.range.getColumn() !== 16) return;

    const row = e.range.getRow();
    if (row === 1) return;

    const value = String(e.range.getValue()).trim().toLowerCase();
    if (value !== "oui") return;

    const data = sheet.getRange(row, 1, 1, 22).getValues()[0];

    const prenom = data[3] || "";
    const nom = data[2] || "";
    const telephone = data[5] || "";
    const besoins = data[11] || "";

    const titre = encodeURIComponent("Rappel - " + prenom + " " + nom);
    const description = encodeURIComponent(
      "Prospect : " + prenom + " " + nom + "\n" +
      "Téléphone : " + telephone + "\n" +
      "Besoins : " + besoins
    );

    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    demain.setHours(10, 0, 0, 0);

    const dateStart = formatDateForCalendar(demain);
    const dateFin = new Date(demain.getTime() + 30 * 60 * 1000);
    const dateEnd = formatDateForCalendar(dateFin);

    const calendarUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + titre +
      "&dates=" + dateStart + "/" + dateEnd +
      "&details=" + description;

    const cell = sheet.getRange(row, 22);
    const richText = SpreadsheetApp.newRichTextValue()
      .setText("📅 Créer rappel")
      .setLinkUrl(calendarUrl)
      .build();
    cell.setRichTextValue(richText);

    Logger.log("✅ Lien Calendar généré pour ligne " + row);

  } catch (error) {
    Logger.log("❌ Erreur checkRappelCalendar: " + error.toString());
  }
}

function formatDateForCalendar(date) {
  return date.toISOString().replace(/-|:|\.\d{3}/g, "").slice(0, 15) + "Z";
}
```

---

## 🎨 CONVENTIONS DE CODE

### Style
- Composants shadcn/ui au maximum
- Tailwind CSS (pas de CSS custom)
- Couleur primaire : Indigo (#6366f1)
- Cards : rounded-xl + shadow-sm

### TypeScript
- Toujours typer les props
- Types dans src/types/index.ts
- Éviter `any`

### Fichiers
- Composants : PascalCase (StatsCards.tsx)
- Hooks : camelCase avec `use` (useUser.ts)
- Utilitaires : camelCase (utils.ts)

### Imports
- Alias `@/` pour imports absolus
- Exemple : `import { Button } from "@/components/ui/button"`

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

1. **Multi-tenant** : Chaque org a ses propres credentials Google (Sheets) et chaque conseiller a son Gmail
2. **QStash** : Remplace le CRON Vercel (limité sur plan gratuit) pour les rappels 24h
3. **RLS** : Désactivé sur certaines tables pour le dev - à sécuriser en prod
4. **Google OAuth** : App en mode test, ajouter utilisateurs dans Google Cloud Console
5. **Invitations** : Supabase envoie les emails, callback sur /auth/callback
6. **Colonne Z** : Email du conseiller dans la Sheet pour identifier qui envoie le mail
