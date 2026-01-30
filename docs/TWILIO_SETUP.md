# Configuration Twilio pour Click-to-Call

Ce guide explique comment configurer Twilio pour utiliser la fonctionnalité d'appels WebRTC dans Ultron.

## Prérequis

1. Un compte Twilio actif : [https://www.twilio.com/](https://www.twilio.com/)
2. Un numéro de téléphone Twilio configuré

## Étapes de configuration

### 1. Récupérer les identifiants Twilio

Connectez-vous à votre [Console Twilio](https://console.twilio.com/) et récupérez :

- **Account SID** : Sur la page d'accueil de la console
- **Auth Token** : Sur la page d'accueil de la console (cliquez sur "Show" pour l'afficher)

### 2. Créer une API Key

1. Allez dans **Settings > API Keys**
2. Cliquez sur "Create API Key"
3. Donnez-lui un nom : `ultron-voice-api`
4. Récupérez l'**API Key SID** et l'**API Secret**

### 3. Configurer TwiML Application

1. Allez dans **Develop > TwiML > TwiML Apps**
2. Créez une nouvelle TwiML App nommée `ultron-voice`
3. Configurez les URLs :
   - **Voice URL** : `https://votre-domaine.com/api/voice/click-to-call/twiml`
   - **Status Callback URL** : `https://votre-domaine.com/api/voice/click-to-call/webhook`
4. Récupérez l'**Application SID**

### 4. Acheter et configurer un numéro de téléphone

1. Allez dans **Phone Numbers > Manage > Buy a number**
2. Achetez un numéro français (+33)
3. Configurez le webhook pour ce numéro vers votre TwiML App

### 5. Variables d'environnement

Ajoutez ces variables à votre fichier `.env.local` :

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+33123456789
```

## Coûts Twilio

- **Numéro français** : ~1€/mois
- **Appels sortants** : ~0.05€/minute vers numéros français
- **Appels entrants** : ~0.01€/minute
- **Enregistrements** : ~0.0025€/minute

## Test de la configuration

1. Redémarrez votre serveur Next.js après avoir configuré les variables
2. Allez dans le pipeline CRM
3. Cliquez sur "Appeler" sur un prospect avec un numéro valide
4. Vérifiez les logs de la console pour les erreurs

## Résolution des problèmes

### Erreur "Missing Twilio credentials"

- Vérifiez que toutes les variables d'environnement sont correctement configurées
- Redémarrez le serveur après modification des variables

### Erreur de Content Security Policy

- Cette erreur a été corrigée dans `next.config.ts`
- Assurez-vous que le domaine Twilio est autorisé dans la CSP

### Erreur 500 "voice_calls table does not exist"

- Exécutez la migration SQL dans `/database/migrations/voice_calls_table.sql`
- Ou utilisez le dashboard Supabase pour créer la table

## Documentation Twilio

- [Twilio Voice WebRTC](https://www.twilio.com/docs/voice/sdks/javascript)
- [TwiML Apps](https://www.twilio.com/docs/usage/api/applications)
- [API Keys](https://www.twilio.com/docs/iam/api-keys)