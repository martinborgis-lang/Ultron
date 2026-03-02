# 📧 Brouillon Réponse à Google OAuth Verification
**À envoyer à :** api-oauth-dev-verification-reply+3jug7wztosy2u1d@google.com
**Objet :** Re: [Action Needed] OAuth Verification Request Acknowledgement
**CC :** dannycharaf@outlook.com, danny.charaf@outlook.fr, xsworldy@gmail.com

---

## Email (EN ANGLAIS) :

Subject: Re: [Action Needed] OAuth Verification Request Acknowledgement

---

Hello Google Verification Team,

Thank you for your continued review of our project **patrimoine-ai-agent** (Project ID: 1045016359890). We apologize for the delay in responding and appreciate your patience.

We understand you encountered an error when trying to access the OAuth consent process and were unable to find the "Connect Google Account" option. We'd like to provide clear step-by-step instructions to help you test our application.

---

### Test Account Credentials

To test the application, please use the following demo account:

- **Application URL:** https://ultron-ai.pro (or https://ultron-murex.vercel.app)
- **Email:** [MARTIN: INSÉRER EMAIL DU COMPTE TEST - ex: moneypot.store@gmail.com]
- **Password:** [MARTIN: INSÉRER MOT DE PASSE DU COMPTE TEST]

---

### Step-by-Step Testing Instructions

**Step 1: Login to the Application**
1. Navigate to https://ultron-ai.pro/login
2. Enter the test account email and password provided above
3. Click "Se connecter" (Log in)
4. You will be redirected to the main Dashboard

**Step 2: Access the Google Integration Settings**
1. In the left sidebar, click on **"Paramètres"** (Settings) — the gear icon at the bottom
2. Navigate to the **"Intégrations"** or **"Google"** tab
3. You will see the option to **"Connecter Google"** (Connect Google Account)

**Step 3: Initiate the OAuth Consent Flow**
1. Click on **"Connecter Google"** button
2. This will redirect you to the Google OAuth consent screen
3. Select a Google account to authorize
4. Review the requested permissions and click "Allow"
5. You will be redirected back to the application

**Step 4: Verify Each Scope Functionality**

After connecting a Google account, you can test each scope as follows:

| Scope | How to Test | Where in the App |
|-------|------------|------------------|
| **gmail.send** | Navigate to a prospect's detail page → Click "Envoyer email" → Compose and send an email to the prospect | Dashboard → Prospects → [Any Prospect] → Actions → Email |
| **gmail.readonly** | On a prospect's detail page, the "Emails" tab displays received emails from that prospect | Dashboard → Prospects → [Any Prospect] → Tab "Emails" |
| **userinfo.email** | Automatically used during OAuth to identify the user. Visible in the top-right profile icon showing the connected email | Settings → Profile section |
| **drive.readonly** | Used to download PDF brochures from Google Drive. Navigate to Settings → Plaquette to configure a Drive file | Settings → Plaquette → Sélectionner un fichier Drive |
| **calendar** | Navigate to the Planning page to see synchronized Google Calendar events | Dashboard → Planning (calendar icon in sidebar) |
| **calendar.events** | Create a new meeting/appointment from a prospect page. The event will appear in Google Calendar | Prospects → [Any Prospect] → "Planifier RDV" |
| **spreadsheets** | Used in legacy mode for organizations that store data in Google Sheets. Available in Settings → Mode Google Sheets | Settings → Mode de données → Google Sheets |

---

### OAuth Configuration Details

- **Authorized Redirect URIs:**
  - `https://ultron-ai.pro/api/google/callback`
  - `https://ultron-murex.vercel.app/api/google/callback`

- **Access Type:** `offline` (to receive refresh tokens)
- **Prompt:** `consent` (always shows the consent screen)

- **Privacy Policy:** https://ultron-ai.pro/privacy
- **Terms of Service / Legal Notices:** https://ultron-ai.pro/legal

---

### Additional Notes

- Our application serves as a **CRM platform for French financial advisors** (wealth management consultants). The Google integrations allow advisors to:
  - Send professional emails to prospects directly from the CRM
  - Synchronize their calendar for appointment management
  - Access PDF brochures stored in Google Drive
  - Track email correspondence history

- All user data is handled in compliance with **GDPR** (EU General Data Protection Regulation) and **CNIL** (French Data Protection Authority) guidelines, as detailed in our privacy policy.

- We would be happy to provide a **video demonstration** of the complete OAuth flow and scope usage if that would be helpful for your review.

---

Please let us know if you need any additional information or if you encounter any issues with the test account. We are committed to completing the verification process promptly.

Best regards,
Martin Borgis
Founder & Lead Developer — Ultron
martin.borgis@gmail.com

---

## ⚠️ ACTIONS MARTIN AVANT ENVOI :

1. **COMPLÉTER** les credentials du compte de test (email + mot de passe)
2. **VÉRIFIER** que le compte de test fonctionne en faisant le parcours toi-même
3. **VÉRIFIER** que les URLs dans Google Cloud Console sont correctes (privacy policy, homepage, redirect URIs)
4. **TESTER** le flow OAuth complet : login → settings → connecter Google → consentement → retour
5. **OPTIONNEL** : Si le scope `spreadsheets` n'est plus utilisé, le retirer de la config et mettre à jour Google Cloud Console AVANT de répondre
6. **OPTIONNEL** : Enregistrer une vidéo screencast de 3-5 min montrant tout le flow
7. **ANALYSER** le screenshot joint par Google (fichier 92NG4qX7kFFAiEg.png) pour comprendre l'erreur exacte
