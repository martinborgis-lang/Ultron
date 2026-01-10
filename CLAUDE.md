# CLAUDE.md - Instructions pour Claude Code

## 🎯 PROJET ULTRON

**Ultron** est une application SaaS multi-tenant pour automatiser la gestion de prospects pour des cabinets de gestion de patrimoine.

### Fonctionnalités principales
- Dashboard avec statistiques en temps réel depuis Google Sheets
- Connexion OAuth Google par entreprise
- Workflows automatisés (qualification, emails, rappels)
- Personnalisation des prompts IA par entreprise
- Gestion multi-conseillers par entreprise

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
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── prompts/page.tsx
│   │       └── team/page.tsx
│   ├── api/
│   │   ├── google/
│   │   │   ├── auth/route.ts          # Initie OAuth Google
│   │   │   └── callback/route.ts      # Callback OAuth
│   │   ├── sheets/
│   │   │   ├── prospects/route.ts     # Lit les prospects
│   │   │   ├── stats/route.ts         # Calcule les stats
│   │   │   └── test/route.ts          # Teste la connexion
│   │   ├── webhooks/
│   │   │   ├── qualification/route.ts # Qualifie un prospect
│   │   │   ├── rdv-valide/route.ts    # Mail synthèse + rappel 24h
│   │   │   └── plaquette/route.ts     # Mail + PDF plaquette
│   │   ├── cron/
│   │   │   └── rappel-24h/route.ts    # Envoie les rappels programmés
│   │   ├── organization/
│   │   │   └── sheet/route.ts         # Update sheet_id
│   │   └── prompts/route.ts           # CRUD prompts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                            # shadcn components
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
│   │   ├── PromptEditor.tsx
│   │   └── TeamManager.tsx
│   └── prospects/
│       └── ProspectsContent.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── google.ts                      # OAuth + Sheets API
│   ├── gmail.ts                       # Envoi d'emails
│   ├── anthropic.ts                   # Claude API
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
- id, auth_id, organization_id, email, full_name, role, gmail_credentials, is_active

**prompts** - Prompts IA personnalisables (legacy, utiliser colonnes organizations)
- id, organization_id, type, name, system_prompt, user_prompt

**scheduled_emails** - Emails programmés (rappels 24h)
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

# CRON Secret (optionnel)
CRON_SECRET=xxx
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
- Génère et envoie un mail de synthèse personnalisé
- Programme un rappel 24h avant le RDV (table scheduled_emails)
- Update colonne X (Mail Synthèse = Oui)

### 3. Plaquette (/api/webhooks/plaquette)
- Déclenché quand statut = "À rappeler - Plaquette"
- Génère un mail sobre
- Envoie avec la plaquette PDF en pièce jointe
- Update colonne W (Mail Plaquette = Oui)

### 4. Rappel 24h (/api/cron/rappel-24h)
- CRON quotidien (9h)
- Vérifie les rappels programmés à envoyer
- Génère et envoie le mail de rappel
- Update colonne Y (Mail Rappel = Oui)

---

## 📊 STRUCTURE GOOGLE SHEET ATTENDUE

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

---

## 📝 APPS SCRIPT TEMPLATE (pour les clients)
```javascript
const WEBHOOK_BASE = "https://ultron-murex.vercel.app/api/webhooks";

function installedOnEdit(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() !== "prospect") return;

  const range = e.range;
  if (range.getColumn() !== 14) return; // Colonne N (Statut)

  const row = range.getRow();
  if (row === 1) return;

  const sheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
  const data = sheet.getRange(row, 1, 1, 25).getValues()[0];
  const statut = String(data[13]).trim();

  const payload = {
    sheet_id: sheetId,
    row_number: row,
    data: {
      id: data[0], nom: data[2], prenom: data[3], email: data[4],
      telephone: data[5], age: data[7], situation_pro: data[8],
      revenus: data[9], patrimoine: data[10], besoins: data[11],
      notes_appel: data[12], statut: data[13], date_rdv: data[14],
      qualification: data[16], score: data[17], priorite: data[18]
    }
  };

  let endpoint = "";
  if (statut === "RDV Validé") endpoint = "/rdv-valide";
  else if (statut === "À rappeler - Plaquette") endpoint = "/plaquette";
  else if (["RDV Validé", "À rappeler - Plaquette", "À rappeler - RDV"].includes(statut)) {
    endpoint = "/qualification";
  }

  if (endpoint) {
    UrlFetchApp.fetch(WEBHOOK_BASE + endpoint, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  }
}
```

---

## ⚠️ NOTES IMPORTANTES

1. **Multi-tenant** : Chaque org a ses propres credentials Google et prompts
2. **RLS désactivé** sur certaines tables pour le dev - à sécuriser en prod
3. **CRON Vercel** : Configuré dans vercel.json, tourne à 9h chaque jour
4. **Google OAuth** : App en mode test, ajouter utilisateurs de confiance dans Google Cloud Console ensuite commit et push
