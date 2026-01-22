# 📋 CHECKLIST ADMIN - Configuration Nouvelles Organisations

## ✅ **AUTOMATIQUE** lors de l'inscription

Les éléments suivants sont **automatiquement configurés** quand un utilisateur s'inscrit et crée une nouvelle organisation :

### 🎯 **Configuration Pipeline**
- ✅ **6 stages pipeline** créés automatiquement :
  1. Nouveau
  2. En attente
  3. RDV Pris
  4. Négociation
  5. Gagné
  6. Perdu

### 🤖 **Prompts IA**
- ✅ **4 prompts par défaut** configurés automatiquement :
  - **Qualification** : Analyse des prospects (CHAUD/TIEDE/FROID)
  - **Synthèse** : Email récap après appel + confirmation RDV
  - **Rappel** : Email de rappel 24h avant RDV
  - **Plaquette** : Email sobre avec PDF en pièce jointe

### 📊 **Configuration Scoring IA**
- ✅ **Seuils par défaut** configurés automatiquement :
  - Chaud : ≥70%, Tiède : ≥40%, Froid : <40%
  - Pondération : 50% IA + 25% patrimoine + 25% revenus
  - Seuils patrimoine : 30k€ → 300k€
  - Seuils revenus : 2.5k€ → 10k€

### 🏢 **Organisation**
- ✅ **Mode CRM** par défaut
- ✅ **Compte admin** créé pour le fondateur
- ✅ **Slug unique** généré automatiquement

---

## ⚙️ **CONFIGURATION MANUELLE** requise

Les éléments suivants doivent être **configurés manuellement** par l'admin après inscription :

### 🔑 **1. Credentials Google (REQUIS pour workflows)**
- 🔗 **Organisation** : `/settings/data-source` → Connecter Google (Sheets + Drive)
- 📧 **Gmail conseillers** : `/settings/team` → Ajouter conseiller → Connecter Gmail

### 📄 **2. Plaquette commerciale (REQUIS pour workflow plaquette)**
- 📂 Uploader PDF sur Google Drive
- 🔗 Copier l'ID du fichier Drive
- ⚙️ Coller dans `/settings` → Plaquette URL

### 💰 **3. Produits & Commissions (REQUIS pour CA)**
- 🛍️ Créer produits : `/products` → Ajouter produit
- 💵 Définir prix client et taux de commission
- 📊 Nécessaire pour calcul du CA dans dashboard admin

### 👥 **4. Équipe (OPTIONNEL)**
- 👤 Inviter conseillers : `/settings/team` → Ajouter membre
- 📧 Chaque conseiller doit connecter son Gmail individuel
- 🎯 Assigner prospects aux conseillers

### 🎨 **5. Personnalisation (OPTIONNEL)**
- 🤖 Modifier prompts IA : `/settings/prompts`
- 📊 Ajuster seuils scoring : `/admin` (si admin)
- 🎯 Modifier stages pipeline : **Non recommandé** (uniformité)

---

## 🚀 **WORKFLOW DE MISE EN SERVICE**

### **Phase 1 : Configuration essentielle (15 min)**
1. ✅ Inscription → Organisation créée automatiquement
2. 🔗 Connecter Google organisation `/settings/data-source`
3. 📄 Configurer plaquette `/settings`
4. 💰 Créer 1er produit `/products`

### **Phase 2 : Premier test (10 min)**
5. 🧪 Créer prospect test
6. 📧 Tester workflow plaquette
7. 📊 Vérifier dashboard admin

### **Phase 3 : Équipe (si multi-conseillers)**
8. 👥 Inviter conseillers `/settings/team`
9. 📧 Chaque conseiller connecte son Gmail
10. 🎯 Tester attribution prospects

---

## ⚠️ **PROBLÈMES COURANTS**

### **Workflow plaquette sans objet/corps**
- ❌ **Cause** : Prompts IA manquants
- ✅ **Solution** : Utiliser `/admin/prompts` → "🤖 INITIALISER TOUT"

### **Pipeline incohérent (9 stages au lieu de 6)**
- ❌ **Cause** : Anciennes organisations
- ✅ **Solution** : Utiliser `/admin/sync` → "🧹 NETTOYER TOUT"

### **CA admin à 0€**
- ❌ **Cause** : Aucun produit configuré ou deals sans commission
- ✅ **Solution** : Créer produits avec taux commission

### **Emails non envoyés**
- ❌ **Cause** : Gmail non connecté ou credentials expirés
- ✅ **Solution** : Reconnecter Gmail dans `/settings/team`

---

## 🎯 **RÉSUMÉ : QU'EST-CE QUI EST PRÊT ?**

### ✅ **Prêt immédiatement après inscription :**
- Dashboard fonctionnel
- Pipeline CRM avec 6 stages
- Qualification IA des prospects
- Interface complète

### ⚙️ **Nécessite configuration admin :**
- Workflows emails (Google + plaquette)
- Calcul CA (produits + commissions)
- Multi-conseillers (équipe)

**L'organisation est fonctionnelle à 70% dès l'inscription, 100% après 15min de configuration.**