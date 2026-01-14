# Ultron Chrome Extension

Extension Chrome pour assister les conseillers pendant leurs RDV Google Meet.

## Installation (Mode developpeur)

1. Ouvrir Chrome et aller a `chrome://extensions/`
2. Activer le "Mode developpeur" (en haut a droite)
3. Cliquer sur "Charger l'extension non empaquetee"
4. Selectionner le dossier `ultron-chrome-extension`

## Fonctionnalites

- Affiche les informations du prospect pendant le meeting
- Suggestions IA de questions a poser
- Transcription en temps reel (beta)
- Detection automatique du prospect

## APIs Ultron requises

L'extension necessite ces endpoints sur Ultron :

- `POST /api/auth/extension-login` - Connexion depuis l'extension
- `GET /api/extension/prospects` - Liste des prospects avec RDV
- `GET /api/extension/search-prospect` - Recherche de prospect par nom
- `GET /api/extension/prospect/[id]` - Details d'un prospect
- `POST /api/extension/analyze` - Analyse IA pour suggestions

## Icones

Vous devez creer les icones suivantes dans le dossier `icons/` :
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

Vous pouvez utiliser un generateur en ligne ou creer des icones simples avec le logo Ultron.

## Configuration

1. Installez l'extension
2. Cliquez sur l'icone de l'extension
3. Connectez-vous avec vos identifiants Ultron
4. Allez sur Google Meet pour un RDV
5. Le panel s'affichera automatiquement

## Permissions requises

- `activeTab` - Acces a l'onglet actif
- `storage` - Stockage des parametres et du token
- `tabs` - Detection des onglets Google Meet
