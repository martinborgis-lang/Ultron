# 🧪 Guide de Test Local - Agent IA avec Délai

## ✅ Testable en Local

Avec les modifications apportées, vous pouvez maintenant tester TOUT le workflow en local :

### 1. **Préparation Base de Données**

Exécutez ce SQL dans votre Supabase :

```sql
-- Ajouter la colonne pour le délai
ALTER TABLE voice_config ADD COLUMN IF NOT EXISTS call_delay_minutes INTEGER DEFAULT 5;

-- Vérifier que la colonne existe
SELECT agent_name, call_delay_minutes, is_enabled
FROM voice_config
WHERE organization_id = '2740ed23-bffe-423e-a038-abaa231525b3';
```

### 2. **Mode de Test Local**

En développement (`NODE_ENV=development`), le système utilise une **simulation** :

- ✅ **Interface UI** : Champ délai fonctionnel
- ✅ **Logique complète** : Calcul horaires, validation
- ✅ **Simulation délai** : 30 secondes au lieu des minutes réelles
- ✅ **Appel VAPI** : Exécution réelle après simulation
- ✅ **Logs détaillés** : Toutes les étapes visibles

### 3. **Workflow de Test**

```
1. 📝 Configurer agent (délai = 2 minutes)
2. 🧪 Formulaire test → Prospect créé
3. ⏱️ Simulation : "Délai de 2 minutes = 30 secondes"
4. 📞 Après 30s : Appel VAPI exécuté
5. ✅ Vérification logs + base de données
```

### 4. **Logs à Observer**

```bash
🧪 MODE DEV: Simulation délai de 2 minutes
📅 En production, l'appel serait programmé via QStash pour: 2026-01-29T14:35:00Z
🚀 SIMULATION: Exécution de l'appel après délai simulé
✅ SIMULATION: Appel exécuté avec succès
```

### 5. **Test Complet des Scénarios**

**Scénario A - Délai = 0 :**
- Appel immédiat (pas de simulation)

**Scénario B - Délai = 2 minutes (dans horaires) :**
- Simulation 30 secondes → Appel VAPI

**Scénario C - Délai = 2 minutes (hors horaires) :**
- Reprogrammation automatique au prochain créneau

**Scénario D - Heure calculée hors horaires :**
- Reprogrammation pour prochain jour ouvrable

### 6. **Vérifications Base de Données**

Après test, vérifiez dans Supabase :

```sql
-- Voir les appels créés
SELECT id, status, to_number, scheduled_at, metadata
FROM phone_calls
WHERE organization_id = 'votre-org-id'
ORDER BY created_at DESC LIMIT 5;

-- Voir les prospects créés
SELECT id, first_name, last_name, phone, source
FROM crm_prospects
WHERE organization_id = 'votre-org-id'
ORDER BY created_at DESC LIMIT 5;
```

## 🚀 En Production

Quand vous déployez en production :
- QStash prend le relais automatiquement
- Délais réels respectés
- Webhooks VAPI fonctionnels

## 🎯 Avantages du Mode Test

- **Feedback immédiat** : Pas besoin d'attendre les vraies minutes
- **Tests rapides** : Plusieurs scénarios en quelques minutes
- **Debugging facile** : Logs détaillés de chaque étape
- **Sécurité** : Aucun risque d'appels non voulus en masse

## 📱 Test d'Appel Réel

Si vous voulez tester un appel VAPI réel en local :
1. Configurez délai = 0 (appel immédiat)
2. Remplissez le formulaire avec VOTRE numéro
3. L'appel sera lancé immédiatement via VAPI

⚠️ **Attention** : Les appels coûtent de l'argent, testez avec parcimonie !