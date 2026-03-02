---
name: audit-ultron
description: "Audit complet du projet Ultron CRM. Lance un scan systématique du code, des routes API, de la sécurité, des types TypeScript, et produit un rapport détaillé. Utilise cette skill quand l'utilisateur mentionne : audit, scan, vérification, contrôle qualité, QA, beta test, review code, pré-démo, health check, ou toute demande de vérification globale du projet Ultron."
---

# Audit Ultron - Skill de Contrôle Qualité

Cette skill effectue un audit complet du projet Ultron CRM et produit un rapport structuré dans `cowork-workspace/tests/`.

## Quand utiliser cette skill

- Avant une démo client
- Après un déploiement majeur
- Pour un contrôle qualité régulier
- Quand l'utilisateur dit "audit", "scan", "vérifie le code", "QA", "health check"

## Étapes de l'audit

### Étape 1 : Vérifier les dernières modifications

```bash
cd /sessions/eager-blissful-hopper/mnt/ultron
git log --oneline -20 --format="%h %ad %s" --date=short
```

Note les 20 derniers commits pour contextualiser l'audit.

### Étape 2 : Vérifier le build

```bash
cd /sessions/eager-blissful-hopper/mnt/ultron
npm run build 2>&1 | tail -50
```

Capture les erreurs de build. Si le build échoue, c'est un bug CRITIQUE.

### Étape 3 : Scanner les routes API

Pour CHAQUE fichier `route.ts` dans `src/app/api/`, vérifie :

1. **Try-catch** : La route est-elle enveloppée dans un try-catch ?
2. **Authentification** : Y a-t-il un appel à `getCurrentUserAndOrganization()` ou équivalent ?
3. **Multi-tenancy** : Les requêtes Supabase filtrent-elles par `organization_id` ?
4. **Erreurs utiles** : Les réponses d'erreur contiennent-elles un message descriptif ?
5. **Console.log sensibles** : Y a-t-il des logs qui exposent des tokens, mots de passe, credentials ?

Utilise grep pour scanner rapidement :
```bash
# Routes sans try-catch
grep -rL "try" src/app/api/*/route.ts src/app/api/*/*/route.ts 2>/dev/null

# Routes sans auth
grep -rL "getCurrentUserAndOrganization\|getUser\|createServerClient" src/app/api/*/route.ts 2>/dev/null

# Console.log sensibles
grep -rn "console.log.*token\|console.log.*password\|console.log.*secret\|console.log.*credential" src/app/api/ 2>/dev/null
```

### Étape 4 : Scanner les composants frontend

Pour les composants dans `src/components/`, vérifie :

```bash
# Textes placeholder restants
grep -rn "TODO\|FIXME\|Lorem\|placeholder\|{{" src/components/ --include="*.tsx" 2>/dev/null

# Potentiels crash sur null/undefined (accès sans optional chaining)
grep -rn "\\.map(" src/components/ --include="*.tsx" | head -20
```

Vérifie que les `.map()` sont protégés par des null checks (`data?.map` ou `data && data.map`).

### Étape 5 : Audit sécurité rapide

```bash
# Secrets en dur
grep -rn "sk-\|Bearer \|apikey.*=.*['\"]" src/ --include="*.ts" --include="*.tsx" | grep -v "process.env\|\.env" 2>/dev/null

# .gitignore vérifie .env
grep "\.env" .gitignore

# SQL brut non protégé
grep -rn "\.rpc\|\.sql\|raw.*query" src/ --include="*.ts" 2>/dev/null
```

### Étape 6 : Produire le rapport

Compile tous les résultats dans un fichier markdown :

```
cowork-workspace/tests/audit-YYYY-MM-DD.md
```

Format du rapport :

```markdown
# 🔍 Audit Ultron - [DATE]

## Contexte
- Derniers commits : [liste]
- Build status : ✅/❌

## Routes API
- Total scanné : X routes
- Sans try-catch : X
- Sans auth : X
- Logs sensibles : X

## Composants Frontend
- TODOs restants : X
- Null safety issues : X

## Sécurité
- Secrets en dur : X
- SQL non protégé : X

## Score Global : X/100

## Bugs Critiques
[liste détaillée]

## Bugs Importants
[liste détaillée]

## Améliorations
[liste détaillée]
```

## Notes importantes

- Ne JAMAIS modifier le code source pendant l'audit
- Prioriser les bugs par impact sur la démo client
- Inclure un "Prompt Claude Code" prêt à copier pour les corrections
