\# CLAUDE.md - Instructions pour Claude Code



\## 🎯 PROJET ULTRON



\*\*Ultron\*\* est une application SaaS pour automatiser la gestion de prospects pour des cabinets de gestion de patrimoine.



\### Fonctionnalités principales

\- Dashboard avec statistiques en temps réel

\- Connexion à Google Sheets pour récupérer les prospects

\- Envoi automatique d'emails personnalisés via IA (Claude API)

\- Gestion multi-entreprises (multi-tenant)

\- Gestion des conseillers par entreprise

\- Personnalisation des prompts IA



---



\## 🛠️ STACK TECHNIQUE



| Composant | Technologie |

|-----------|-------------|

| Framework | Next.js 14 (App Router) |

| Langage | TypeScript |

| Styling | Tailwind CSS + shadcn/ui |

| Database | Supabase (PostgreSQL) |

| Auth | Supabase Auth |

| Icons | Lucide React |

| Charts | Recharts |

| Hosting | Vercel |



---



\## 📁 STRUCTURE DU PROJET

```

src/

├── app/                    # Pages (App Router)

│   ├── (auth)/            # Pages auth (login, register)

│   ├── (dashboard)/       # Pages protégées (dashboard, settings)

│   ├── api/               # API Routes

│   ├── layout.tsx         # Layout racine

│   └── page.tsx           # Landing page

├── components/            # Composants React

│   ├── ui/               # Composants shadcn/ui

│   ├── layout/           # Sidebar, Header, etc.

│   ├── dashboard/        # Composants du dashboard

│   ├── auth/             # Formulaires auth

│   └── settings/         # Composants settings

├── lib/                   # Utilitaires

│   ├── supabase/         # Client Supabase

│   └── utils.ts          # Fonctions utilitaires

├── hooks/                 # Custom hooks React

├── types/                 # Types TypeScript

└── middleware.ts          # Middleware Next.js (auth)

```



---



\## 🔐 VARIABLES D'ENVIRONNEMENT



Fichier `.env.local` (NE JAMAIS COMMIT) :

```

NEXT\_PUBLIC\_SUPABASE\_URL=https://xxx.supabase.co

NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=eyJxxx

SUPABASE\_SERVICE\_ROLE\_KEY=eyJxxx

```



---



\## 🗄️ STRUCTURE BASE DE DONNÉES



\### Tables Supabase



\*\*organizations\*\* - Entreprises clientes

\- id, name, slug, google\_sheet\_id, google\_credentials, plan, created\_at



\*\*users\*\* - Utilisateurs (conseillers)

\- id, auth\_id, organization\_id, email, full\_name, role, gmail\_credentials



\*\*prompts\*\* - Prompts IA personnalisables

\- id, organization\_id, type, name, system\_prompt, user\_prompt



\*\*daily\_stats\*\* - Statistiques quotidiennes

\- id, organization\_id, date, total\_prospects, prospects\_chaud, tiede, froid, mails\_envoyes, rdv\_pris



\*\*activity\_logs\*\* - Logs d'activité

\- id, organization\_id, user\_id, action, details, created\_at



---



\## 🎨 CONVENTIONS DE CODE



\### Style

\- Utiliser les composants shadcn/ui au maximum

\- Tailwind CSS pour le styling (pas de CSS custom)

\- Couleur primaire : Indigo (#6366f1)

\- Coins arrondis : rounded-xl sur les cards

\- Ombres : shadow-sm



\### TypeScript

\- Toujours typer les props des composants

\- Utiliser les types dans `src/types/index.ts`

\- Éviter `any`, préférer `unknown` si nécessaire



\### Fichiers

\- Composants : PascalCase (ex: `StatsCards.tsx`)

\- Hooks : camelCase avec prefix `use` (ex: `useUser.ts`)

\- Utilitaires : camelCase (ex: `utils.ts`)



\### Imports

\- Utiliser l'alias `@/` pour les imports absolus

\- Exemple : `import { Button } from "@/components/ui/button"`



---



\## 🚀 COMMANDES



\### Développement

```bash

npm run dev          # Lancer le serveur de dev (localhost:3000)

npm run build        # Build de production

npm run lint         # Vérifier le code

```



\### Git

```bash

git add .

git commit -m "description"

git push origin main

```



\### Déploiement

Le déploiement sur Vercel est automatique à chaque push sur `main`.



---



\## 📋 GIT WORKFLOW



\### Convention de commits

```

feat: nouvelle fonctionnalité

fix: correction de bug

style: changement de style (CSS, UI)

refactor: refactoring de code

docs: documentation

chore: maintenance, dépendances

```



\### Exemples

```

feat: add prospects table with filtering

fix: resolve auth redirect issue

style: improve dashboard cards design

refactor: extract stats logic into custom hook

```



\### Processus de commit

1\. `git add .` - Ajouter les fichiers modifiés

2\. `git commit -m "type: description"` - Commit avec message descriptif

3\. `git push origin main` - Pusher vers GitHub (déclenche le déploiement Vercel)



---



\## 🔗 LIENS UTILES



\- \*\*Repo GitHub\*\* : https://github.com/\[USERNAME]/ultron

\- \*\*Vercel\*\* : https://ultron-xxx.vercel.app (après déploiement)

\- \*\*Supabase\*\* : https://supabase.com/dashboard/project/lfieylacuznqqhaobobt

\- \*\*shadcn/ui docs\*\* : https://ui.shadcn.com

\- \*\*Tailwind docs\*\* : https://tailwindcss.com/docs



---



\## 📝 TODO / ROADMAP



\### Phase 1 ✅

\- \[x] Setup Next.js + Tailwind + shadcn

\- \[x] Auth Supabase (login/register)

\- \[x] Dashboard avec données mock

\- \[x] Layout avec sidebar



\### Phase 2 (En cours)

\- \[ ] Déploiement Vercel

\- \[ ] Connexion Google Sheets API

\- \[ ] Affichage des vrais prospects

\- \[ ] Stats en temps réel



\### Phase 3

\- \[ ] Éditeur de prompts IA

\- \[ ] Gestion des conseillers

\- \[ ] Envoi d'emails via Gmail API

\- \[ ] Webhooks pour les workflows



\### Phase 4

\- \[ ] Réactiver RLS avec bonnes policies

\- \[ ] Multi-tenant complet

\- \[ ] Billing / Plans

\- \[ ] Documentation utilisateur



---



\## ⚠️ NOTES IMPORTANTES



1\. \*\*RLS désactivé\*\* : Les Row Level Security policies sont actuellement désactivées pour le développement. À réactiver avant la mise en production.



2\. \*\*Données mock\*\* : Le dashboard utilise actuellement des données mock. La connexion à la vraie Google Sheet est à implémenter.



3\. \*\*Secrets\*\* : Ne jamais commit les fichiers `.env.local` ou les clés API.



4\. \*\*Supabase\*\* : Le projet Supabase s'appelle "ultron" et est sur la région West EU.

```





Repository : https://github.com/martinborgis-lang/Ultron

