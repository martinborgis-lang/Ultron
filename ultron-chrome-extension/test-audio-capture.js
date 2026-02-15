/**
 * SCRIPT DE TEST - CAPTURE AUDIO ULTRON
 * À exécuter dans la console Chrome sur meet.google.com
 */

console.log('🎤 ULTRON - Test de capture audio');

// Fonction de test de l'API tabCapture
async function testTabCapture() {
  console.log('1. Test chrome.tabCapture.getMediaStreamId...');

  chrome.runtime.sendMessage({ type: 'GET_TAB_MEDIA_STREAM_ID' }, async (response) => {
    if (chrome.runtime.lastError) {
      console.error('❌ Erreur runtime:', chrome.runtime.lastError.message);
      return;
    }

    if (response.error) {
      console.error('❌ Erreur background:', response.error);
      return;
    }

    if (!response.streamId) {
      console.error('❌ Pas de streamId reçu');
      return;
    }

    console.log('✅ StreamId reçu:', response.streamId);

    // Test getUserMedia avec le streamId
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'tab',
            chromeMediaSourceId: response.streamId,
          },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });

      console.log('✅ Stream obtenu:', stream);
      console.log('✅ Pistes audio:', stream.getAudioTracks().length);

      stream.getAudioTracks().forEach((track, idx) => {
        console.log(`   - Piste ${idx}:`, {
          id: track.id.substring(0, 8) + '...',
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted
        });
      });

      // Test MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      let chunkCount = 0;
      mediaRecorder.ondataavailable = (event) => {
        chunkCount++;
        console.log(`✅ Chunk audio #${chunkCount}, taille: ${event.data.size} bytes`);

        if (chunkCount >= 3) {
          mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
          console.log('✅ Test terminé avec succès - Capture audio fonctionnelle!');
        }
      };

      mediaRecorder.start(250);
      console.log('✅ MediaRecorder démarré, test en cours...');

    } catch (error) {
      console.error('❌ Erreur getUserMedia:', error);
    }
  });
}

// Fonction de test des permissions
async function testPermissions() {
  console.log('2. Test des permissions...');

  try {
    const result = await navigator.permissions.query({ name: 'microphone' });
    console.log('   - Microphone:', result.state);
  } catch (e) {
    console.log('   - Microphone: (non testable)');
  }

  // Test tabCapture via chrome.runtime
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('✅ Chrome runtime disponible');
    console.log('✅ Extension ID:', chrome.runtime.id);
  } else {
    console.error('❌ Chrome runtime non disponible');
  }
}

// Fonction de test de l'état global
function testGlobalState() {
  console.log('3. Test état global Ultron...');

  if (typeof window.ULTRON_CONTENT_LOADED !== 'undefined') {
    console.log('✅ Script Ultron chargé');
  } else {
    console.log('⚠️ Script Ultron pas encore chargé');
  }

  // Vérifier les variables globales
  const vars = ['mediaStream', 'sidePanelMediaStream', 'currentAudioSource'];
  vars.forEach(varName => {
    if (typeof window[varName] !== 'undefined') {
      console.log(`✅ ${varName}:`, window[varName] ? 'présent' : 'null');
    } else {
      console.log(`⚠️ ${varName}: non défini`);
    }
  });
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('🚀 Démarrage des tests Ultron...');
  console.log('URL:', window.location.href);
  console.log('User Agent:', navigator.userAgent.includes('Chrome') ? 'Chrome OK' : 'Navigateur non supporté');

  testGlobalState();
  await testPermissions();
  await new Promise(resolve => setTimeout(resolve, 1000));
  testTabCapture();
}

// Lancer les tests
runAllTests();