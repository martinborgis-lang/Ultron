# 🔧 Corrections OAuth - Prêtes pour Claude Code
**Date :** 2 mars 2026

---

## Fix 1 : Retirer le scope `spreadsheets` si mode legacy inactif (OPTIONNEL)

**Fichier :** `src/lib/google.ts`
**Lignes :** 10-17

**Code actuel :**
```typescript
const ORGANIZATION_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];
```

**Code corrigé (si mode Sheets confirmé inactif) :**
```typescript
const ORGANIZATION_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];
```

**⚠️ ATTENTION :** Ne faire ce changement QUE si Martin confirme que le mode Google Sheets n'est plus utilisé. Sinon, garder le scope et le justifier dans la réponse à Google.

---

## Fix 2 : Extension Auth - Empêcher fallback sur clé publique (CRITIQUE SÉCURITÉ)

**Fichier :** `src/lib/extension-auth.ts`
**Lignes :** ~37-38

**Code actuel :**
```typescript
const secret = process.env.SUPABASE_JWT_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
```

**Code corrigé :**
```typescript
const secret = process.env.SUPABASE_JWT_SECRET;
if (!secret) {
  throw new Error('SUPABASE_JWT_SECRET is required for token validation');
}
```

**Impact :** Si `SUPABASE_JWT_SECRET` n'est pas défini, le fallback utilise la clé publique (NEXT_PUBLIC_*), ce qui permet à quiconque de forger des tokens JWT valides.

---

## Fix 3 : Implémenter validation signature Vapi webhook (CRITIQUE)

**Fichier :** `src/app/api/voice/ai-agent/vapi-webhook/route.ts`
**Lignes :** ~613-620

**Code actuel :**
```typescript
async function validateVapiSignature(
  request: NextRequest,
  secret: string
): Promise<boolean> {
  // Implémenter la validation HMAC selon la doc Vapi
  // Pour l'instant, on retourne true
  return true;
}
```

**Code corrigé :**
```typescript
import crypto from 'crypto';

async function validateVapiSignature(
  request: NextRequest,
  secret: string
): Promise<boolean> {
  const signature = request.headers.get('x-vapi-signature');
  if (!signature) return false;

  const body = await request.text();
  const computed = crypto.createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computed)
  );
}
```

**⚠️ NOTE :** Vérifier la doc Vapi récente pour le nom exact du header de signature. Le format peut avoir changé.

---

## Fix 4 : Compléter les TODOs dans vapi-webhook (FONCTIONNEL)

**Fichier :** `src/app/api/voice/ai-agent/vapi-webhook/route.ts`
**Lignes :** ~588, ~594

**Code actuel :**
```typescript
console.log('📧 TODO: Envoyer email confirmation RDV');
console.log('🔥 TODO: Notifier conseiller - prospect chaud');
```

**Action :** Implémenter l'envoi d'email de confirmation RDV et la notification au conseiller. Ces fonctionnalités sont attendues pour la démo client.

---

## Prompt Claude Code (copier-coller)

```
Corrections prioritaires pour Ultron - OAuth & Sécurité :

1. CRITIQUE - Dans src/lib/extension-auth.ts, remplace le fallback
   `process.env.SUPABASE_JWT_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!`
   par une vérification stricte qui throw une erreur si SUPABASE_JWT_SECRET n'est pas défini.
   La clé publique NEXT_PUBLIC ne doit JAMAIS servir de secret JWT.

2. CRITIQUE - Dans src/app/api/voice/ai-agent/vapi-webhook/route.ts,
   la fonction validateVapiSignature() retourne toujours true.
   Implémente une vraie validation HMAC-SHA256. MAIS vérifie d'abord
   la doc Vapi récente pour le nom exact du header de signature.

3. FONCTIONNEL - Dans le même fichier vapi-webhook, il y a des
   console.log('TODO: ...') pour l'envoi d'email confirmation RDV
   et la notification conseiller prospect chaud. Implémente ces 2 features.

4. OPTIONNEL - Dans src/lib/google.ts, demande-moi si le mode
   Google Sheets legacy est encore utilisé. Si non, retire le scope
   spreadsheets du tableau ORGANIZATION_SCOPES.
```
