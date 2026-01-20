/**
 * Ultron Meeting Assistant - Content Script
 * Real-time transcription with Deepgram + AI coaching
 */

const ULTRON_API_URL = 'https://ultron-murex.vercel.app';

// State
let panelElement = null;
let isTranscribing = false;
let currentProspect = null;
let userToken = null;
let isPanelLarge = false;
let meetingStartTime = null;

// Deepgram & Audio
let deepgramClient = null;
let audioCapture = null;
let mediaStream = null;
let mediaRecorder = null;

// Transcript state
let transcriptSegments = [];
let conversationHistory = [];
let lastSpeaker = 'unknown';
let realtimeAnalysisTimeout = null;

// Dragging state
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// Initialization
(async function init() {
  console.log('Ultron Meeting Assistant v2.0: Initializing...');

  // Get token
  const stored = await chrome.storage.local.get(['userToken', 'autoPanel', 'transcriptionEnabled']);
  userToken = stored.userToken;

  if (!userToken) {
    console.log('Ultron: Not logged in');
    return;
  }

  // Wait for page to load
  setTimeout(() => {
    if (stored.autoPanel !== false) {
      createPanel();
    }
    detectProspect();
  }, 3000);
})();

function createPanel() {
  if (panelElement) return;

  panelElement = document.createElement('div');
  panelElement.id = 'ultron-panel';
  panelElement.className = 'ultron-panel-normal';
  panelElement.innerHTML = `
    <div class="ultron-header" id="ultron-drag-handle">
      <span class="ultron-logo">ULTRON</span>
      <div class="ultron-controls">
        <button id="ultron-resize" title="Agrandir/Reduire">[]</button>
        <button id="ultron-minimize" title="Reduire">-</button>
        <button id="ultron-close" title="Fermer">x</button>
      </div>
    </div>
    <div class="ultron-content">
      <div id="ultron-prospect-info">
        <p class="ultron-loading">Recherche du prospect...</p>
      </div>
      <div id="ultron-transcription" class="hidden">
        <div class="ultron-section-header">
          <span>Transcription Deepgram</span>
          <div class="ultron-transcription-controls">
            <span id="ultron-connection-status" class="ultron-status-dot"></span>
            <button id="ultron-toggle-transcription">Demarrer</button>
          </div>
        </div>
        <div id="ultron-transcription-text"></div>
        <div id="ultron-transcription-actions" class="hidden">
          <button id="ultron-save-transcript" class="ultron-btn-primary">
            Sauvegarder et generer PDF
          </button>
        </div>
      </div>
      <div id="ultron-realtime-suggestions" class="hidden">
        <div class="ultron-section-header">
          <span>Suggestions IA temps reel</span>
          <span id="ultron-ai-status" class="ultron-ai-status"></span>
        </div>
        <div id="ultron-realtime-content">
          <div class="ultron-realtime-placeholder">
            Demarrez la transcription pour recevoir des suggestions en temps reel
          </div>
        </div>
      </div>
      <div id="ultron-suggestions" class="hidden">
        <div class="ultron-section-header">Preparation initiale</div>
        <div id="ultron-suggestions-list"></div>
      </div>
    </div>
  `;

  document.body.appendChild(panelElement);

  // Event listeners
  document.getElementById('ultron-close').addEventListener('click', () => {
    if (isTranscribing) {
      if (confirm('La transcription est en cours. Voulez-vous vraiment fermer?')) {
        stopTranscription();
        panelElement.remove();
        panelElement = null;
      }
    } else {
      panelElement.remove();
      panelElement = null;
    }
  });

  document.getElementById('ultron-minimize').addEventListener('click', () => {
    panelElement.classList.toggle('minimized');
  });

  document.getElementById('ultron-resize').addEventListener('click', togglePanelSize);
  document.getElementById('ultron-toggle-transcription').addEventListener('click', toggleTranscription);
  document.getElementById('ultron-save-transcript')?.addEventListener('click', saveTranscript);

  // Make panel draggable
  setupDraggable();
}

function setupDraggable() {
  const header = document.getElementById('ultron-drag-handle');

  header.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return;

    isDragging = true;
    const rect = panelElement.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;

    panelElement.style.transition = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging || !panelElement) return;

    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;

    const maxX = window.innerWidth - panelElement.offsetWidth;
    const maxY = window.innerHeight - panelElement.offsetHeight;

    panelElement.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
    panelElement.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
    panelElement.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      panelElement.style.transition = '';
    }
  });
}

function togglePanelSize() {
  isPanelLarge = !isPanelLarge;

  if (isPanelLarge) {
    panelElement.classList.remove('ultron-panel-normal');
    panelElement.classList.add('ultron-panel-large');
    document.getElementById('ultron-resize').textContent = '><';
  } else {
    panelElement.classList.remove('ultron-panel-large');
    panelElement.classList.add('ultron-panel-normal');
    document.getElementById('ultron-resize').textContent = '[]';
  }
}

async function detectProspect() {
  const meetingTitle = document.querySelector('[data-meeting-title]')?.textContent ||
                       document.title.replace(' - Google Meet', '').trim();

  if (meetingTitle) {
    try {
      const response = await fetch(`${ULTRON_API_URL}/api/extension/search-prospect?q=${encodeURIComponent(meetingTitle)}`, {
        headers: { 'Authorization': `Bearer ${userToken}` },
      });

      const data = await response.json();

      if (data.prospect) {
        currentProspect = data.prospect;
        displayProspectInfo(data.prospect);
        loadAISuggestions(data.prospect);
      } else {
        showProspectSelector();
      }
    } catch (error) {
      console.error('Ultron: Error searching prospect', error);
      showProspectSelector();
    }
  } else {
    showProspectSelector();
  }
}

function displayProspectInfo(prospect) {
  const container = document.getElementById('ultron-prospect-info');
  container.innerHTML = `
    <div class="ultron-prospect-card">
      <div class="ultron-prospect-header">
        <span class="ultron-prospect-name">${prospect.prenom || prospect.firstName || ''} ${prospect.nom || prospect.lastName || ''}</span>
        <span class="ultron-badge ${(prospect.qualification || '').toLowerCase()}">${prospect.qualification || 'N/A'}</span>
      </div>
      <div class="ultron-prospect-details">
        <div>Email: ${prospect.email || 'N/A'}</div>
        <div>Tel: ${prospect.telephone || prospect.phone || 'N/A'}</div>
        <div>Revenus: ${prospect.revenus || prospect.revenus_annuels || 'N/A'}</div>
        <div>Patrimoine: ${prospect.patrimoine || prospect.patrimoine_estime || 'N/A'}</div>
      </div>
      <div class="ultron-prospect-needs">
        <strong>Besoins:</strong> ${prospect.besoins || prospect.notes || 'Non renseigne'}
      </div>
      <button id="ultron-change-prospect" class="ultron-btn-secondary">Changer de prospect</button>
    </div>
  `;

  document.getElementById('ultron-change-prospect')?.addEventListener('click', showProspectSelector);
  document.getElementById('ultron-transcription').classList.remove('hidden');
  document.getElementById('ultron-realtime-suggestions').classList.remove('hidden');
  document.getElementById('ultron-suggestions').classList.remove('hidden');
}

function showProspectSelector() {
  const container = document.getElementById('ultron-prospect-info');
  container.innerHTML = `
    <div class="ultron-selector">
      <p>Selectionnez le prospect pour ce RDV :</p>
      <input type="text" id="ultron-search" placeholder="Rechercher un prospect...">
      <div id="ultron-search-results"></div>
    </div>
  `;

  document.getElementById('ultron-search').addEventListener('input', debounce(searchProspects, 300));
}

async function searchProspects(e) {
  const query = e.target.value.trim();
  const resultsContainer = document.getElementById('ultron-search-results');

  if (query.length < 2) {
    resultsContainer.innerHTML = '';
    return;
  }

  try {
    const response = await fetch(`${ULTRON_API_URL}/api/extension/search-prospect?q=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${userToken}` },
    });

    const data = await response.json();

    if (data.prospects && data.prospects.length > 0) {
      resultsContainer.innerHTML = data.prospects.map(p => `
        <div class="ultron-search-item" data-id="${p.id}">
          <span>${p.prenom || p.firstName || ''} ${p.nom || p.lastName || ''}</span>
          <span class="ultron-badge ${(p.qualification || '').toLowerCase()}">${p.qualification || 'N/A'}</span>
        </div>
      `).join('');

      resultsContainer.querySelectorAll('.ultron-search-item').forEach(item => {
        item.addEventListener('click', () => selectProspect(item.dataset.id));
      });
    } else {
      resultsContainer.innerHTML = '<p class="ultron-no-results">Aucun resultat</p>';
    }
  } catch (error) {
    console.error('Ultron: Search error', error);
  }
}

async function selectProspect(prospectId) {
  try {
    const response = await fetch(`${ULTRON_API_URL}/api/extension/prospect/${prospectId}`, {
      headers: { 'Authorization': `Bearer ${userToken}` },
    });

    const data = await response.json();

    if (data.prospect) {
      currentProspect = data.prospect;
      displayProspectInfo(data.prospect);
      loadAISuggestions(data.prospect);
    }
  } catch (error) {
    console.error('Ultron: Error selecting prospect', error);
  }
}

async function loadAISuggestions(prospect) {
  const container = document.getElementById('ultron-suggestions-list');
  container.innerHTML = '<p class="ultron-loading">Analyse IA en cours...</p>';

  try {
    const response = await fetch(`${ULTRON_API_URL}/api/extension/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({ prospect }),
    });

    const data = await response.json();

    if (data.analysis) {
      container.innerHTML = `
        <div class="ultron-suggestion-group">
          <h4>Questions a poser</h4>
          <ul>
            ${data.analysis.questionsSuggerees?.map(q => `<li>${q}</li>`).join('') || '<li>Aucune suggestion</li>'}
          </ul>
        </div>
        <div class="ultron-suggestion-group">
          <h4>Arguments cles</h4>
          <ul>
            ${data.analysis.argumentsCles?.map(a => `<li>${a}</li>`).join('') || '<li>Aucune suggestion</li>'}
          </ul>
        </div>
        <div class="ultron-suggestion-group">
          <h4>Objections probables</h4>
          <ul>
            ${data.analysis.objectionsProba?.map(o => `<li>${o}</li>`).join('') || '<li>Aucune suggestion</li>'}
          </ul>
        </div>
      `;
    }
  } catch (error) {
    container.innerHTML = '<p class="ultron-error">Erreur de chargement</p>';
  }
}

// ========================
// DEEPGRAM TRANSCRIPTION
// ========================

function toggleTranscription() {
  const btn = document.getElementById('ultron-toggle-transcription');

  if (isTranscribing) {
    stopTranscription();
    btn.textContent = 'Demarrer';
    btn.classList.remove('active');
  } else {
    startDeepgramTranscription();
    btn.textContent = 'Arreter';
    btn.classList.add('active');
  }
}

async function startDeepgramTranscription() {
  const statusEl = document.getElementById('ultron-connection-status');
  const aiStatusEl = document.getElementById('ultron-ai-status');

  try {
    statusEl.className = 'ultron-status-dot connecting';
    aiStatusEl.textContent = 'Connexion...';

    // Initialize Deepgram client
    deepgramClient = new window.UltronDeepgramClient();

    await deepgramClient.connect(userToken, {
      onTranscript: handleTranscript,
      onError: handleTranscriptionError,
      onStatusChange: (status) => {
        statusEl.className = `ultron-status-dot ${status}`;
        if (status === 'connected') {
          aiStatusEl.textContent = 'En ecoute...';
          aiStatusEl.className = 'ultron-ai-status listening';
        }
      },
    });

    // Start tab audio capture
    await startAudioCapture();

    isTranscribing = true;
    meetingStartTime = Date.now();
    transcriptSegments = [];
    conversationHistory = [];

    // Show save button
    document.getElementById('ultron-transcription-actions')?.classList.remove('hidden');

    console.log('Ultron: Deepgram transcription started');

  } catch (error) {
    console.error('Ultron: Failed to start Deepgram transcription', error);
    statusEl.className = 'ultron-status-dot error';
    aiStatusEl.textContent = 'Erreur: ' + error.message;
    aiStatusEl.className = 'ultron-ai-status error';

    // Fall back to Web Speech API if Deepgram fails
    if (error.message.includes('capture') || error.message.includes('permission')) {
      alert('Impossible de capturer l\'audio de l\'onglet. Verifiez les permissions de l\'extension.');
    }
  }
}

async function startAudioCapture() {
  return new Promise((resolve, reject) => {
    // Request tab capture stream ID from background
    chrome.runtime.sendMessage({ type: 'GET_TAB_MEDIA_STREAM_ID' }, async (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (response.error) {
        reject(new Error(response.error));
        return;
      }

      try {
        // Get media stream using the stream ID
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: 'tab',
              chromeMediaSourceId: response.streamId,
            },
          },
          video: false,
        });

        // Create MediaRecorder to send chunks to Deepgram
        mediaRecorder = new MediaRecorder(mediaStream, {
          mimeType: 'audio/webm;codecs=opus',
        });

        mediaRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0 && deepgramClient && deepgramClient.isActive()) {
            const arrayBuffer = await event.data.arrayBuffer();
            deepgramClient.sendAudio(arrayBuffer);
          }
        };

        // Record in 250ms chunks for real-time streaming
        mediaRecorder.start(250);

        console.log('Ultron: Audio capture started');
        resolve();

      } catch (error) {
        reject(error);
      }
    });
  });
}

function handleTranscript(result) {
  const { transcript, isFinal, confidence } = result;

  if (!transcript || transcript.trim() === '') return;

  const currentTime = (Date.now() - meetingStartTime) / 1000;

  // Determine speaker based on audio analysis or simple heuristic
  // In production, you'd use speaker diarization
  const speaker = detectSpeaker(transcript);

  if (isFinal) {
    // Add to transcript segments
    transcriptSegments.push({
      timestamp: currentTime,
      speaker: speaker,
      text: transcript,
      confidence: confidence,
    });

    // Add to conversation history for AI analysis
    conversationHistory.push(`[${speaker === 'advisor' ? 'Conseiller' : 'Prospect'}]: ${transcript}`);

    // Schedule real-time AI analysis
    scheduleRealtimeAnalysis();
  }

  // Update display
  updateTranscriptDisplay(transcript, isFinal);
}

function detectSpeaker(transcript) {
  // Simple heuristic: alternate speakers or detect based on content
  // In production, use speaker diarization from Deepgram
  // For now, we'll use simple content-based detection

  const prospectIndicators = [
    'je voudrais', 'j\'aimerais', 'est-ce que', 'combien', 'pourquoi',
    'je ne sais pas', 'je dois reflechir', 'c\'est trop cher', 'pas maintenant'
  ];

  const advisorIndicators = [
    'je vous propose', 'permettez-moi', 'comme je disais', 'nos clients',
    'notre solution', 'je comprends', 'excellente question'
  ];

  const lowerTranscript = transcript.toLowerCase();

  const isProspect = prospectIndicators.some(ind => lowerTranscript.includes(ind));
  const isAdvisor = advisorIndicators.some(ind => lowerTranscript.includes(ind));

  if (isProspect && !isAdvisor) {
    lastSpeaker = 'prospect';
  } else if (isAdvisor && !isProspect) {
    lastSpeaker = 'advisor';
  }
  // If neither or both, keep the last speaker

  return lastSpeaker;
}

function updateTranscriptDisplay(currentTranscript, isFinal) {
  const container = document.getElementById('ultron-transcription-text');

  const segmentsHtml = transcriptSegments.map(seg => {
    const speakerLabel = seg.speaker === 'advisor' ? 'Conseiller' : 'Prospect';
    const speakerClass = seg.speaker === 'advisor' ? 'advisor' : 'prospect';
    const time = formatTime(seg.timestamp);
    return `
      <div class="ultron-transcript-segment ${speakerClass}">
        <span class="ultron-transcript-time">${time}</span>
        <span class="ultron-transcript-speaker">${speakerLabel}:</span>
        <span class="ultron-transcript-text">${seg.text}</span>
      </div>
    `;
  }).join('');

  const interimHtml = !isFinal ? `
    <div class="ultron-transcript-interim">
      ${currentTranscript}
    </div>
  ` : '';

  container.innerHTML = segmentsHtml + interimHtml;
  container.scrollTop = container.scrollHeight;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function handleTranscriptionError(error) {
  console.error('Ultron: Transcription error', error);
  const aiStatusEl = document.getElementById('ultron-ai-status');
  aiStatusEl.textContent = 'Erreur transcription';
  aiStatusEl.className = 'ultron-ai-status error';
}

function stopTranscription() {
  // Stop media recorder
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }

  // Stop media stream
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  // Disconnect Deepgram
  if (deepgramClient) {
    deepgramClient.disconnect();
    deepgramClient = null;
  }

  isTranscribing = false;

  // Clear timeouts
  if (realtimeAnalysisTimeout) {
    clearTimeout(realtimeAnalysisTimeout);
    realtimeAnalysisTimeout = null;
  }

  // Update UI
  const statusEl = document.getElementById('ultron-connection-status');
  const aiStatusEl = document.getElementById('ultron-ai-status');
  statusEl.className = 'ultron-status-dot';
  aiStatusEl.textContent = '';
  aiStatusEl.className = 'ultron-ai-status';

  console.log('Ultron: Transcription stopped');
}

// ========================
// REAL-TIME AI ANALYSIS
// ========================

function scheduleRealtimeAnalysis() {
  if (realtimeAnalysisTimeout) {
    clearTimeout(realtimeAnalysisTimeout);
  }

  realtimeAnalysisTimeout = setTimeout(() => {
    if (conversationHistory.length >= 2) {
      runRealtimeAnalysis();
    }
  }, 3000);
}

async function runRealtimeAnalysis() {
  if (!currentProspect || conversationHistory.length === 0) return;

  const aiStatusEl = document.getElementById('ultron-ai-status');
  aiStatusEl.textContent = 'Analyse...';
  aiStatusEl.className = 'ultron-ai-status analyzing';

  const recentTranscript = conversationHistory.slice(-10).join('\n');

  try {
    const response = await fetch(`${ULTRON_API_URL}/api/meeting/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        prospect: currentProspect,
        transcript: recentTranscript,
        conversationHistory: conversationHistory.slice(-5),
      }),
    });

    const data = await response.json();

    if (data.analysis) {
      displayRealtimeSuggestions(data.analysis);
    }

    aiStatusEl.textContent = 'En ecoute...';
    aiStatusEl.className = 'ultron-ai-status listening';

  } catch (error) {
    console.error('Ultron: Realtime analysis error', error);
    aiStatusEl.textContent = 'Erreur';
    aiStatusEl.className = 'ultron-ai-status error';
  }
}

function displayRealtimeSuggestions(analysis) {
  const container = document.getElementById('ultron-realtime-content');

  let html = '';

  if (analysis.objectionDetectee) {
    html += `
      <div class="ultron-alert objection">
        <strong>Objection detectee:</strong> ${analysis.objectionDetectee}
        <div class="ultron-response">
          <strong>Reponse suggeree:</strong> ${analysis.reponseObjection || 'N/A'}
        </div>
      </div>
    `;
  }

  if (analysis.questionSuivante) {
    html += `
      <div class="ultron-realtime-suggestion">
        <strong>Question a poser maintenant:</strong>
        <p>${analysis.questionSuivante}</p>
      </div>
    `;
  }

  if (analysis.pointCle) {
    html += `
      <div class="ultron-realtime-suggestion highlight">
        <strong>Point cle a aborder:</strong>
        <p>${analysis.pointCle}</p>
      </div>
    `;
  }

  if (analysis.tonalite) {
    html += `
      <div class="ultron-tonalite ${analysis.tonalite.toLowerCase()}">
        Tonalite du prospect: <strong>${analysis.tonalite}</strong>
      </div>
    `;
  }

  if (!html) {
    html = '<div class="ultron-realtime-placeholder">Continuez la conversation...</div>';
  }

  container.innerHTML = html;
}

// ========================
// SAVE TRANSCRIPT
// ========================

async function saveTranscript() {
  if (transcriptSegments.length === 0) {
    alert('Aucune transcription a sauvegarder');
    return;
  }

  const btn = document.getElementById('ultron-save-transcript');
  btn.disabled = true;
  btn.textContent = 'Sauvegarde en cours...';

  const durationSeconds = meetingStartTime ? Math.floor((Date.now() - meetingStartTime) / 1000) : 0;

  try {
    const response = await fetch(`${ULTRON_API_URL}/api/meeting/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        prospect_id: currentProspect?.id,
        google_meet_link: window.location.href,
        transcript_segments: transcriptSegments,
        duration_seconds: durationSeconds,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert(`Transcript sauvegarde avec succes!\n\nResume: ${data.ai_summary?.substring(0, 200)}...`);

      if (data.pdf_url) {
        // Open PDF in new tab
        window.open(data.pdf_url, '_blank');
      }
    } else {
      throw new Error(data.error || 'Erreur de sauvegarde');
    }

  } catch (error) {
    console.error('Ultron: Save error', error);
    alert('Erreur lors de la sauvegarde: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sauvegarder et generer PDF';
  }
}

// ========================
// UTILITIES
// ========================

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SETTINGS_UPDATED') {
    if (message.autoPanel && !panelElement) {
      createPanel();
    }
  }
});
