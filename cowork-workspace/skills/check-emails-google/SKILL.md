---
name: check-emails-google
description: "Vérifie les emails de Google concernant la vérification OAuth du projet Ultron. Cherche les derniers emails de Google API OAuth Verification, analyse les points bloquants, propose des corrections et rédige un brouillon de réponse. Utilise cette skill quand l'utilisateur mentionne : emails Google, vérification OAuth, OAuth verification, répondre à Google, Google review, consent screen, Third Party Data Safety, api-oauth-dev-verification."
---

# Check Emails Google - Skill de Suivi OAuth

Cette skill analyse les emails de Google OAuth verification et prépare les réponses.

## Quand utiliser cette skill

- L'utilisateur veut vérifier s'il y a des emails de Google
- L'utilisateur veut savoir le statut de la vérification OAuth
- L'utilisateur veut rédiger une réponse à Google
- Toute mention de "Google verification", "OAuth review", "Third Party Data Safety"

## Étapes

### Étape 1 : Rechercher les emails

Via le connecteur Gmail, lancer ces recherches :

```
from:api-oauth-dev-verification-reply@google.com
from:oauth-coe@google.com
from:google.com subject:OAuth
from:google.com subject:verification
from:google.com subject:"your app"
```

Pour chaque email trouvé, extraire :
- Date
- Expéditeur exact
- Objet
- Corps du message (résumé des demandes)
- Pièces jointes éventuelles

### Étape 2 : Analyser les demandes

Pour chaque email contenant une demande d'action :

1. **Identifier le problème exact** : Que dit Google exactement ?
2. **Vérifier dans le code** : Le problème existe-t-il vraiment ?
3. **Proposer une solution** : Que faut-il corriger/fournir ?

Points courants vérifiés par Google :
- Scopes demandés vs utilisés
- Privacy policy accessible et complète
- Écran de consentement conforme
- Homepage URL correcte
- Compte de test disponible
- Vidéo de démonstration

### Étape 3 : Audit code si nécessaire

Vérifier dans le code du projet Ultron :

```bash
# Scopes configurés
grep -n "SCOPES\|scope" src/lib/google.ts

# OAuth config
grep -n "access_type\|prompt.*consent" src/lib/google.ts

# Pages légales
ls src/app/\(legal\)/*/page.tsx
```

### Étape 4 : Rédiger la réponse

Créer un brouillon de réponse en anglais dans :
```
cowork-workspace/drafts/reponse-google-oauth.md
```

Le brouillon doit :
- Être professionnel et coopératif
- Adresser CHAQUE point individuellement
- Fournir des instructions de test étape par étape
- Inclure les URLs pertinentes
- Mentionner le compte de test (laisser placeholder pour credentials)
- Proposer une vidéo de démo si pertinent

### Étape 5 : Sauvegarder l'analyse

Créer le rapport dans :
```
cowork-workspace/reports/google-oauth-emails-analysis.md
```

## Notes importantes

- NE JAMAIS envoyer l'email directement - toujours créer un brouillon pour validation
- Toujours vérifier les dates pour détecter les urgences (tickets expirés)
- Les emails à Google doivent être en ANGLAIS
- Les rapports internes en FRANÇAIS
