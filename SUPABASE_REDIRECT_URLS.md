# URLs de Redirection Supabase

## 📋 Configuration Requise dans Supabase Dashboard

Aller dans **Supabase Dashboard → Authentication → URL Configuration**

### Site URLs
```
https://ultron-ai.pro
```

### Redirect URLs (ajouter TOUTES ces URLs)
```
https://ultron-ai.pro/auth/callback
https://www.ultron-ai.pro/auth/callback
https://ultron-ai.pro/auth/set-password
https://www.ultron-ai.pro/auth/set-password
https://ultron-murex.vercel.app/auth/callback
https://ultron-murex.vercel.app/auth/set-password
http://localhost:3000/auth/callback
http://localhost:3000/auth/set-password
```

### ⚠️ Points Importants

1. **www ET sans www** : Les deux doivent être présents car l'erreur montre `www.ultron-ai.pro`
2. **Environnements multiples** : Production (ultron-ai.pro), Vercel (ultron-murex), Local (localhost)
3. **Pages spécifiques** : callback ET set-password pour couvrir tout le flow
4. **HTTPS obligatoire** en production (Supabase l'exige)

### 🔧 Variables d'Environnement

#### Production (Vercel)
```
NEXT_PUBLIC_APP_URL=https://ultron-ai.pro
```

#### Local (.env.local)
```
NEXT_PUBLIC_APP_URL=https://ultron-ai.pro
```

### 🧪 Test après Configuration

1. Admin invite un conseiller
2. Email reçu avec lien : `https://lfieylacuznqqhaobobt.supabase.co/auth/v1/verify?token=...&type=invite&redirect_to=https://ultron-ai.pro/auth/callback`
3. Clic → Redirection vers `https://ultron-ai.pro/auth/callback`
4. Callback détecte `type=invite` → Redirection vers `/auth/set-password`
5. Conseiller définit mot de passe → Redirection vers `/dashboard`