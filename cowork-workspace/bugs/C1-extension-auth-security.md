# C1 - Faille Critique : Fallback JWT sur Clé Publique

**Sévérité :** CRITIQUE
**Fichier :** `src/lib/extension-auth.ts`
**Ligne :** 37
**Date :** 3 mars 2026

---

## Description Détaillée

La fonction `validateExtensionToken()` dans `extension-auth.ts` utilise un fallback dangereux pour valider les tokens JWT HS256 de l'extension Chrome.

### Code Problématique (ligne 37)

```typescript
const secret = process.env.SUPABASE_JWT_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
```

### Pourquoi c'est critique

1. **Si `SUPABASE_JWT_SECRET` n'est pas défini** dans les variables d'environnement (ce qui peut arriver en cas de mauvaise config Vercel, ou dans un environnement local), le code utilise `NEXT_PUBLIC_SUPABASE_ANON_KEY` comme secret de validation JWT.

2. **`NEXT_PUBLIC_*` est une clé PUBLIQUE** — elle est exposée côté client dans le bundle JavaScript de l'application. N'importe qui peut la voir via le code source du navigateur.

3. **Conséquence directe** : Un attaquant qui connaît la clé publique (tout le monde) peut **forger des tokens JWT valides** avec n'importe quel `sub` (user ID), et donc usurper l'identité de n'importe quel utilisateur de l'extension Chrome.

4. **Impact** : Accès complet à toutes les APIs de l'extension (`/api/extension/*`) en tant que n'importe quel utilisateur — lecture de prospects, analyse en temps réel, données confidentielles client.

### Problème Secondaire (ligne 31)

```typescript
console.log('[Extension Auth] Token algorithm:', header.alg);
```

Ce `console.log` expose l'algorithme du token dans les logs serveur Vercel. C'est une information utile pour un attaquant qui tenterait de forger des tokens.

---

## Prompt Claude Code (copier-coller)

```
Correction CRITIQUE de sécurité dans src/lib/extension-auth.ts :

1. LIGNE 37 - Remplacer le fallback dangereux :

AVANT :
const secret = process.env.SUPABASE_JWT_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

APRÈS :
const secret = process.env.SUPABASE_JWT_SECRET;
if (!secret) {
  console.error('[Extension Auth] CRITICAL: SUPABASE_JWT_SECRET is not configured');
  throw new Error('Server configuration error: JWT secret not available');
}

2. LIGNE 31 - Supprimer le console.log qui expose l'algorithme du token :

SUPPRIMER cette ligne :
console.log('[Extension Auth] Token algorithm:', header.alg);

3. LIGNES 39 et 61 - Supprimer aussi les console.log de succès qui pourraient polluer les logs en production :

SUPPRIMER :
console.log('[Extension Auth] ✅ Token HS256 validé avec jwt.verify');
console.log('[Extension Auth] ✅ Token ES256 validé avec Supabase');

Ne touche PAS au console.error de la ligne 85 (catch block) - celui-là est utile pour le debug.

Important : NE PAS modifier la logique du else (ES256/Supabase validation) qui est correcte.
```

---

## Vérifications Post-Fix (pour Martin)

### 1. Vérifier le code modifié

Ouvre `src/lib/extension-auth.ts` et vérifie que :

- [ ] **Ligne ~37** : Le code dit `const secret = process.env.SUPABASE_JWT_SECRET;` SANS le `||` fallback
- [ ] **Ligne ~38-40** : Il y a un `if (!secret) { throw new Error(...) }` juste après
- [ ] **Aucune mention** de `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans ce fichier (sauf dans le bloc `else` pour créer le client Supabase, ce qui est correct)
- [ ] **Les console.log** de debug ont été supprimés (lignes 31, 39, 61 originales)
- [ ] Le `console.error` dans le catch (ligne 85) est toujours présent

### 2. Vérifier les variables d'environnement Vercel

Va dans Vercel Dashboard > Settings > Environment Variables et vérifie que :

- [ ] `SUPABASE_JWT_SECRET` est bien défini pour **Production**, **Preview**, et **Development**
- [ ] Sa valeur correspond à celle dans Supabase Dashboard > Settings > API > JWT Secret

### 3. Test fonctionnel

Après déploiement :

- [ ] L'extension Chrome peut toujours se connecter et naviguer normalement
- [ ] Les APIs `/api/extension/*` répondent correctement avec un token valide
- [ ] Les APIs `/api/extension/*` renvoient 401 avec un token invalide/forgé

### 4. Test de non-régression

```bash
# Depuis le navigateur ou Postman, essayer d'accéder à une API extension sans token :
curl -X GET https://ultron-ai.pro/api/extension/prospects
# Résultat attendu : 401 "Non authentifié"

# Avec un faux token forgé avec la clé anon :
# (si un attaquant tentait de forger un token avec la clé publique)
# Résultat attendu : 401 "Token invalide"
```

---

## Risque si Non Corrigé

| Scénario | Probabilité | Impact |
|----------|-------------|--------|
| Attaquant forge un token JWT | Moyenne | **Accès complet données prospects** |
| Variable env manquante en prod | Faible (mais possible après re-deploy) | **Même impact** |
| Fuite données client pendant démo | Faible | **Perte du deal 10 000€** |
