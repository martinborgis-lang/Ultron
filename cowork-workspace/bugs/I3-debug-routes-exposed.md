# I3 - Routes Debug/Test Exposées en Production

**Sévérité :** IMPORTANT (certaines sont CRITIQUES individuellement)
**Fichiers :** 12 fichiers de routes dans `src/app/api/`
**Date :** 3 mars 2026

---

## Description Détaillée

Le projet contient **12 routes de debug/test** (hors voice/Twilio/Vapi) qui sont accessibles en production sans aucune authentification. Certaines utilisent `createAdminClient()` qui bypass le Row Level Security de Supabase, ce qui donne un accès total à la base de données.

### Inventaire Complet des Routes Exposées

#### DANGER EXTRÊME (accès admin sans auth)

| Route | Méthode | Risque | Détail |
|-------|---------|--------|--------|
| `/api/debug/fix-user` | POST | **CRITIQUE** | Peut créer des organisations + des utilisateurs admin. Utilise `createAdminClient()`. Liste tous les users auth. |
| `/api/debug/user-check` | POST | **CRITIQUE** | Donne le profil complet d'un utilisateur par email, ses données auth (dates connexion), stats de son organisation. Utilise `createAdminClient()`. |
| `/api/debug/plaquette` | GET/POST | **ÉLEVÉ** | GET liste TOUTES les organisations avec leurs configs de prompts. POST génère des emails test pour n'importe quelle org. Utilise `createAdminClient()`. |

#### DANGER MOYEN (information disclosure)

| Route | Méthode | Risque | Détail |
|-------|---------|--------|--------|
| `/api/security/test/attack` | GET/POST | **MOYEN** | GET expose les vecteurs d'attaque documentés. POST retourne un message "SECURITY BREACH". Utile à un attaquant pour comprendre les protections. |
| `/api/security/test` | GET/POST/PUT/PATCH | **MOYEN** | Renvoie (echo) les headers et body de la requête. Information disclosure. |
| `/api/security-test` | GET/POST/PUT/PATCH | **MOYEN** | Même pattern que ci-dessus. Echo des headers et body. |
| `/api/pagination/test` | GET/POST | **FAIBLE** | GET génère 1000 items de test, POST accepte des données custom. Pas de données réelles mais consomme des ressources. |

#### AVEC AUTH (sécurisées — ne pas supprimer)

| Route | Méthode | Auth | Détail |
|-------|---------|------|--------|
| `/api/test-db` | GET | `getCurrentUserAndOrganization()` + role admin | Sécurisée. Garde-la. |
| `/api/gmail/test` | GET | `supabase.auth.getUser()` | Sécurisée (mais CORS `*` — mineur). |
| `/api/team/[id]/gmail/test` | GET/POST | À vérifier | Probablement sécurisée via context parent. |

#### NON VÉRIFIÉES (à auditer)

| Route | Méthode | Risque |
|-------|---------|--------|
| `/api/prompts/test` | ? | À vérifier |
| `/api/security/test-email-templates` | ? | À vérifier |
| `/api/admin/test-email-scheduling` | ? | Probablement sécurisée (admin/) |

---

## Détail des Routes les Plus Dangereuses

### `/api/debug/fix-user` — Backdoor Complète

Ce endpoint permet à **n'importe qui** sans authentification de :
1. Lister TOUS les utilisateurs Supabase Auth (`adminClient.auth.admin.listUsers()`)
2. Créer une nouvelle organisation avec des configs par défaut
3. Créer un profil utilisateur avec le rôle `admin`
4. Insérer des pipeline stages par défaut
5. Configurer des prompts IA par défaut

**Payload d'attaque :**
```json
POST /api/debug/fix-user
{
  "email": "attacker@email.com",
  "full_name": "Attaquant",
  "company_name": "Fake Corp"
}
```

### `/api/debug/user-check` — Espionnage Utilisateurs

Ce endpoint permet à **n'importe qui** de :
1. Obtenir le profil complet d'un utilisateur par email
2. Voir ses données auth (dernière connexion, date création)
3. Voir les stats de son organisation (nombre prospects, stages)

**Payload d'attaque :**
```json
POST /api/debug/user-check
{ "email": "martin.borgis@gmail.com" }
```

---

## Prompt Claude Code (copier-coller)

```
Sécurisation URGENTE : Supprimer ou protéger les routes de debug/test exposées en production.

OPTION RECOMMANDÉE : Supprimer complètement les fichiers de debug dangereux.
Ces routes étaient utiles en développement mais sont un risque majeur en production.

FICHIERS À SUPPRIMER (rm) :

1. src/app/api/debug/fix-user/route.ts
   → Backdoor : crée des orgs + users admin sans auth

2. src/app/api/debug/user-check/route.ts
   → Expose les données utilisateur sans auth

3. src/app/api/debug/plaquette/route.ts
   → Liste toutes les orgs et leurs configs sans auth

4. src/app/api/security/test/attack/route.ts
   → Expose les vecteurs d'attaque, inutile en prod

5. src/app/api/security/test/route.ts
   → Echo de headers/body, information disclosure

6. src/app/api/security-test/route.ts
   → Même pattern, echo headers/body

7. src/app/api/pagination/test/route.ts
   → Route de test pagination, inutile en prod

Commandes exactes :
rm -rf src/app/api/debug/fix-user/
rm -rf src/app/api/debug/user-check/
rm -rf src/app/api/debug/plaquette/
rm -rf src/app/api/security/test/attack/
rm -rf src/app/api/security/test/
rm -rf src/app/api/security-test/
rm -rf src/app/api/pagination/test/

IMPORTANT :
- NE PAS supprimer src/app/api/test-db/route.ts (il a une vraie auth)
- NE PAS supprimer src/app/api/gmail/test/route.ts (il a une auth)
- Vérifier que le build passe après suppression (npm run build)
- Si un fichier est importé ailleurs, vérifier les dépendances avant suppression

OPTIONNEL mais recommandé :
Si tu préfères garder ces routes pour le développement futur,
ajoute au MINIMUM cette protection en haut de chaque route :

if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
}

Mais la suppression est préférable pour la démo client.
```

---

## Vérifications Post-Fix (pour Martin)

### 1. Vérifier que les fichiers sont supprimés

```bash
# Aucun de ces chemins ne devrait exister :
ls src/app/api/debug/fix-user/
ls src/app/api/debug/user-check/
ls src/app/api/debug/plaquette/
ls src/app/api/security/test/attack/
ls src/app/api/security/test/
ls src/app/api/security-test/
ls src/app/api/pagination/test/
```

Chaque commande devrait retourner "No such file or directory".

### 2. Vérifier que le build passe

```bash
npm run build
```

Le build doit passer sans erreur. Si un fichier supprimé était importé quelque part, le build échouera et indiquera l'import à corriger.

### 3. Tester en production après déploiement

Après le deploy sur Vercel, vérifier que ces URLs renvoient toutes **404** :

- [ ] `https://ultron-ai.pro/api/debug/fix-user` → 404
- [ ] `https://ultron-ai.pro/api/debug/user-check` → 404
- [ ] `https://ultron-ai.pro/api/debug/plaquette` → 404
- [ ] `https://ultron-ai.pro/api/security/test/attack` → 404
- [ ] `https://ultron-ai.pro/api/security/test` → 404
- [ ] `https://ultron-ai.pro/api/security-test` → 404
- [ ] `https://ultron-ai.pro/api/pagination/test` → 404

### 4. Vérifier que les routes protégées fonctionnent toujours

- [ ] `/api/test-db` → Renvoie 401 sans auth, fonctionne avec auth admin
- [ ] `/api/gmail/test` → Renvoie 401 sans auth
- [ ] L'application complète fonctionne normalement (dashboard, prospects, pipeline)

### 5. Vérifier dans le dossier debug/

S'il reste un dossier `src/app/api/debug/`, vérifier qu'il est **vide** ou qu'il ne contient aucune route non protégée.

---

## Risque si Non Corrigé

| Scénario | Probabilité | Impact |
|----------|-------------|--------|
| Attaquant crée un compte admin via `/debug/fix-user` | Moyenne | **Accès total à la plateforme** |
| Concurrent espionne les données via `/debug/user-check` | Moyenne | **Fuite données clients** |
| Google (pendant review OAuth) découvre ces routes | Faible | **Refus de la vérification OAuth** |
| Client de la démo découvre ces routes | Faible | **Perte de crédibilité et du deal** |
