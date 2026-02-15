# Système d'Email Récapitulatif Post-RDV avec Délai Paramétrable

## 📧 Vue d'ensemble

Le système d'emails récapitulatifs permet d'envoyer automatiquement un email de synthèse aux prospects après un RDV, avec un délai configurable par organisation (de 1h à 7 jours).

## 🔧 Architecture

```
RDV Pris (Pipeline) → Workflow RDV → Programmation Email → CRON Job → Envoi Gmail
```

### Composants principaux

1. **Table `scheduled_emails`** - File d'attente des emails programmés
2. **Service `scheduled-email-service.ts`** - Logique métier
3. **Workflow modifié** - Programme au lieu d'envoyer
4. **CRON Job** - Traitement automatique toutes les 15min
5. **UI Settings** - Configuration par l'utilisateur

## 📊 Base de données

### Table `scheduled_emails`
```sql
CREATE TABLE scheduled_emails (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  prospect_id UUID,
  advisor_id UUID NOT NULL,
  email_type VARCHAR(50) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  email_data JSONB NOT NULL,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Colonnes ajoutées à `organizations`
```sql
ALTER TABLE organizations ADD COLUMN email_recap_enabled BOOLEAN DEFAULT true;
ALTER TABLE organizations ADD COLUMN email_recap_delay_hours INTEGER DEFAULT 2;
```

## ⚙️ Configuration

### Variables d'environnement
```env
CRON_SECRET=your-secret-for-cron-auth
```

### Vercel CRON (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/cron/send-scheduled-emails",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

## 🔄 Workflow Modifié

### Avant (envoi immédiat)
```typescript
const result = await sendEmail(credentials, {
  to: prospect.email,
  subject: email.objet,
  body: emailBody
});
```

### Après (programmation avec délai)
```typescript
const orgSettings = await getOrganizationEmailSettings(organization.id);
const scheduledAt = calculateScheduledTime(rdvEndTime, orgSettings.email_recap_delay_hours);

await scheduleRecapEmail({
  organization_id: organization.id,
  prospect_id: prospectId,
  advisor_id: advisorUserId,
  email_type: 'rdv_recap',
  scheduled_at: scheduledAt,
  email_data: { subject, body, prospect_data, rdv_data }
});
```

## 🤖 CRON Job

**Endpoint:** `GET /api/cron/send-scheduled-emails`
**Fréquence:** Toutes les 15 minutes
**Sécurité:** Token Bearer `CRON_SECRET`

### Processus CRON
1. Récupération des emails `pending` avec `scheduled_at <= now()`
2. Traitement par batches de 50 emails maximum
3. Pour chaque email :
   - Vérification org encore activée
   - Récupération credentials Gmail conseiller
   - Envoi email avec adresse du conseiller
   - Mise à jour statut + logging
   - Gestion des erreurs avec retry

### Gestion des erreurs
- **Retry automatique** : 3 tentatives max avec délai de 30min
- **Échec définitif** : Status `failed` après 3 échecs
- **Logging complet** : Toutes les étapes tracées

## 👥 Interface utilisateur

### Page Settings - Onglet "Emails"
- **Activation/désactivation** du système
- **Choix du délai** : 1h, 2h, 4h, 8h, 12h, 24h, 48h, 72h
- **Aperçu temps réel** de la configuration
- **Statistiques** des emails programmés (admin)

### Délais disponibles
- 1 heure après le RDV
- 2 heures après (par défaut)
- 4, 8, 12 heures
- 1, 2, 3 jours après

## 📈 APIs

### Configuration organisation
```typescript
GET  /api/organization/email-settings     // Récupérer config
PATCH /api/organization/email-settings    // Modifier config
```

### Test système (admin uniquement)
```typescript
POST /api/admin/test-email-scheduling     // Programmer email test
GET  /api/admin/test-email-scheduling     // Statut tests
```

### CRON et monitoring
```typescript
GET /api/cron/send-scheduled-emails       // Traitement CRON
POST /api/cron/send-scheduled-emails      // Statut système
```

## ✅ Tests et validation

### Test manuel
1. Aller sur `/settings` → onglet "Emails"
2. Configurer délai (ex: 1h)
3. Créer un prospect et passer en stage "RDV Pris"
4. Vérifier email programmé dans `scheduled_emails`
5. Attendre exécution CRON (max 15min)
6. Vérifier réception email

### Test avec API admin
```bash
curl -X POST /api/admin/test-email-scheduling \
  -H "Content-Type: application/json" \
  -d '{
    "delay_minutes": 1,
    "test_email": "test@example.com",
    "prospect_data": {
      "first_name": "Jean",
      "last_name": "Test"
    }
  }'
```

## 🔍 Monitoring

### Vues SQL utiles
```sql
-- Emails en attente
SELECT * FROM v_scheduled_emails_pending ORDER BY scheduled_at;

-- Statistiques par statut
SELECT status, COUNT(*) FROM scheduled_emails
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Emails en retard (plus de 30min après scheduled_at)
SELECT * FROM scheduled_emails
WHERE status = 'pending'
  AND scheduled_at < NOW() - INTERVAL '30 minutes';
```

### Dashboard admin
- Nombre d'emails `pending`, `sent`, `failed`
- Taux de succès sur 24h
- Emails en retard ou en erreur

## 🚨 Incidents et dépannage

### Email non envoyé
1. Vérifier `scheduled_emails.status` et `error_message`
2. Contrôler credentials Gmail du conseiller
3. Vérifier logs CRON dans Vercel
4. Tester CRON manuellement avec token

### Organisation désactivation
- Emails programmés existants → status `cancelled`
- Nouveaux RDV → pas de programmation

### Conseiller sans Gmail
- Fallback sur credentials organisation
- Message d'erreur si aucun credentials

## 📋 Checklist déploiement

- [ ] Migration SQL appliquée
- [ ] Variable `CRON_SECRET` configurée
- [ ] CRON Vercel configuré (vercel.json)
- [ ] Tests API validés
- [ ] UI settings fonctionnelle
- [ ] Workflow RDV testé
- [ ] Monitoring en place
- [ ] Documentation équipe

## 🔮 Évolutions futures

- **Templates emails personnalisables**
- **Emails multi-langues**
- **Conditions d'envoi avancées** (score IA, type prospect)
- **Intégration calendrier** (rappels avant RDV)
- **Analytics avancés** (taux ouverture, clics)
- **Webhook callbacks** pour systèmes tiers