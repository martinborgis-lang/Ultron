# 🚀 ULTRON EXTENSION - DÉPLOIEMENT ET TESTS

## 📋 CHECKLIST PRÉ-DÉPLOIEMENT

### ✅ Modifications validées :
- [x] Background script simplifié
- [x] Content script unifié (une seule méthode de capture)
- [x] Manifest nettoyé (audio-capture.js retiré)
- [x] Validation diagnostique ajoutée
- [x] Documentation technique complète

## 🔧 INSTALLATION ET TEST

### 1. Rechargement de l'extension

1. Ouvrir Chrome et aller à `chrome://extensions/`
2. Activer le "Mode développeur"
3. Cliquer sur "Recharger" sur l'extension Ultron
4. Vérifier qu'aucune erreur n'apparaît dans la console

### 2. Test sur Google Meet

#### Pré-requis :
- **2 participants minimum** (conseiller + prospect)
- **Permissions accordées** : Microphone + Extension
- **Chrome récent** : Version 90+

#### Procédure de test :

1. **Rejoindre un appel Google Meet**
   ```
   https://meet.google.com/xxx-xxxx-xxx
   ```

2. **Ouvrir la console Chrome** (F12 → Console)

3. **Coller et exécuter le script de test** :
   ```javascript
   // Copier le contenu de test-audio-capture.js
   ```

4. **Vérifier les logs attendus** :
   ```
   ✅ StreamId reçu: [stream-id]
   ✅ Stream obtenu: MediaStream
   ✅ Pistes audio: 1 (minimum)
   ✅ Test terminé avec succès - Capture audio fonctionnelle!
   ```

### 3. Test transcription complète

#### Via Side Panel :
1. Cliquer sur le bouton "Ultron" (en bas à droite)
2. Ouvrir le Side Panel
3. Démarrer la transcription
4. **Parler alternativement** (conseiller puis prospect)
5. **Vérifier que les 2 voix** sont transcrites

#### Via Panel intégré (legacy) :
1. Attendre l'ouverture automatique du panel
2. Cliquer sur "Démarrer transcription"
3. Tester avec les 2 voix

## 📊 INDICATEURS DE SUCCÈS

### ✅ Logs de validation :
```
Ultron Content: ✅ Tab audio capture SUCCESS (source: tab = COMPLETE MIXED AUDIO - Advisor + Prospect)
Ultron Content: Audio tracks: 1
Ultron Content: MediaRecorder started, state: recording
```

### ✅ Transcription bidirectionnelle :
- Voix conseiller → Texte visible
- Voix prospect → Texte visible
- Speaker detection fonctionnel

### ❌ Signaux d'alerte :
```
❌ No stream ID returned
❌ Failed to capture tab audio
❌ Empty audio chunk
❌ Aucune piste audio detectee
```

## 🐛 DÉPANNAGE

### Problème : "No stream ID returned"

**Solution** :
1. Vérifier permissions extension
2. Recharger la page Google Meet
3. Redémarrer Chrome si nécessaire

### Problème : "getUserMedia failed"

**Solutions** :
1. Accorder permissions microphone à `meet.google.com`
2. Vérifier que l'extension a bien les permissions `tabCapture`
3. S'assurer d'être dans un onglet Google Meet actif

### Problème : "Only advisor voice captured"

**Diagnostic** :
```javascript
// Dans la console de l'extension
validateAudioCapture();
// Vérifier que currentAudioSource === 'tab'
```

## 📈 MÉTRIQUES DE PERFORMANCE

### Temps de réponse attendus :
- **StreamId acquisition** : < 100ms
- **Stream setup** : < 500ms
- **Premier chunk audio** : < 1s

### Utilisation ressources :
- **CPU** : Impact minimal (<5%)
- **Mémoire** : ~10-20MB par onglet Meet
- **Bande passante** : Négligeable (audio local)

## 🔄 ROLLBACK SI PROBLÈME

En cas de régression, revenir aux versions précédentes :

1. **Git checkout** vers commit précédent
2. **Restaurer** `lib/audio-capture.js` dans manifest
3. **Recharger** l'extension

## 📞 VALIDATION FINALE

### Test avec utilisateurs réels :
1. **Conseiller** + **Prospect** réel
2. **Appel de 5 minutes minimum**
3. **Transcription exportée** en PDF
4. **Vérification** présence des 2 voix dans le transcript

### Critères de validation :
- ✅ 100% des phrases du conseiller transcrites
- ✅ 80%+ des phrases du prospect transcrites
- ✅ Speaker detection correct (>70%)
- ✅ Aucune interruption de service
- ✅ Qualité audio preserved

---

**Version testée** : v2.3.0+fix
**Date de déploiement** : 13/02/2026
**Responsable** : Claude Code Assistant
**Status** : ✅ Prêt pour tests utilisateurs