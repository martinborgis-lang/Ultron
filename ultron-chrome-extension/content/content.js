/**
 * Ultron Meeting Assistant - Content Script
 * Real-time transcription with Deepgram + AI coaching
 */

// Prevent re-initialization on extension reload
if (window.ULTRON_CONTENT_LOADED) {
  console.log('Ultron: Content script already loaded, skipping re-initialization');
}
window.ULTRON_CONTENT_LOADED = true;

// Define API URL on window to share with other scripts (use var to allow redeclaration)
window.ULTRON_API_URL = 'https://ultron-murex.vercel.app';
var ULTRON_API_URL = window.ULTRON_API_URL;

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
  console.log('Ultron Meeting Assistant v2.2: Initializing...');

  // Get token
  const stored = await chrome.storage.local.get(['userToken', 'autoPanel']);
  userToken = stored.userToken;

  if (!userToken) {
    console.log('Ultron: Not logged in');
    return;
  }

  // Show floating button to open Side Panel (Chrome requires user gesture to open side panel)
  if (stored.autoPanel !== false) {
    createOpenPanelButton();
  }

  console.log('Ultron: Ready for transcription (Side Panel mode)');
})();

// Create a small floating button to open the Side Panel
function createOpenPanelButton() {
  // Check if button already exists
  if (document.getElementById('ultron-open-panel-btn')) return;

  const button = document.createElement('button');
  button.id = 'ultron-open-panel-btn';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v8M8 12h8"/>
    </svg>
    <span>Ultron</span>
  `;
  button.title = 'Ouvrir le panneau Ultron';

  // Style the button
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: white;
    border: none;
    border-radius: 50px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
    transition: all 0.3s ease;
    animation: ultron-pulse 2s infinite;
  `;

  // Add hover effect
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.4)';
  });

  // Click handler - opens Side Panel
  button.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' }, (response) => {
      if (response && response.success) {
        // Hide button after opening (optional - can keep it visible)
        button.style.display = 'none';
      } else {
        console.log('Ultron: Could not open side panel', response?.error);
      }
    });
  });

  // Add animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ultron-pulse {
      0%, 100% { box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4); }
      50% { box-shadow: 0 4px 25px rgba(99, 102, 241, 0.6); }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(button);
  console.log('Ultron: Open panel button created');
}

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
  // 🚫 DÉSACTIVÉ: Popup remplacé par le side panel
  console.log('Ultron [INFO]: Popup prospect sélecteur désactivé - utilisez le side panel');

  // Ouvrir le side panel au lieu du popup
  try {
    chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
  } catch (e) {
    console.log('Ultron [INFO]: Impossible d\'ouvrir le side panel:', e.message);
  }
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
  // Handle async operations
  handleMessage(message, sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message, sendResponse) {
  // Ensure we have the token
  if (!userToken) {
    const stored = await chrome.storage.local.get(['userToken']);
    userToken = stored.userToken;
  }

  if (message.type === 'SETTINGS_UPDATED') {
    if (message.autoPanel && !panelElement && userToken) {
      createPanel();
      if (!currentProspect) {
        detectProspect();
      }
    }
    sendResponse({ success: true });
  }

  // Handle login from popup - open panel automatically
  if (message.type === 'USER_LOGGED_IN') {
    userToken = message.token;
    if (!panelElement) {
      createPanel();
      detectProspect();
    }
    sendResponse({ success: true });
  }

  // Handle request to open panel manually
  if (message.type === 'OPEN_PANEL') {
    if (!userToken) {
      sendResponse({ success: false, error: 'Not logged in' });
      return;
    }
    if (!panelElement) {
      createPanel();
      detectProspect();
    } else {
      panelElement.classList.remove('minimized');
    }
    sendResponse({ success: true });
  }

  // Handle prospect selection from popup
  if (message.type === 'SELECT_PROSPECT') {
    if (!userToken) {
      sendResponse({ success: false, error: 'Not logged in' });
      return;
    }
    if (!panelElement) {
      createPanel();
    }
    panelElement.classList.remove('minimized');
    // Load the selected prospect
    selectProspect(message.prospectId);
    sendResponse({ success: true });
  }

  // Handle transcription start from Side Panel
  if (message.type === 'START_TRANSCRIPTION') {
    console.log('Ultron Content: Received START_TRANSCRIPTION, token from message:', message.token ? 'présent' : 'ABSENT');

    // Utiliser le token du message, sinon récupérer du storage
    if (message.token) {
      userToken = message.token;
    }

    startTranscriptionForSidePanel()
      .then(() => sendResponse({ success: true }))
      .catch((err) => {
        console.error('Ultron Content: Erreur transcription:', err);
        sendResponse({ success: false, error: err.message });
      });
  }

  // Handle transcription stop from Side Panel
  if (message.type === 'STOP_TRANSCRIPTION') {
    console.log('Ultron Content: Received STOP_TRANSCRIPTION');
    stopTranscriptionForSidePanel();
    sendResponse({ success: true });
  }

  // Handle speaker toggle from Side Panel
  if (message.type === 'SET_SPEAKER') {
    console.log('Ultron Content: Speaker override set to:', message.speaker);
    manualSpeakerOverride = message.speaker; // 'advisor', 'prospect', or null to reset
    sendResponse({ success: true });
  }
}

// ========================
// TRANSCRIPTION FOR SIDE PANEL
// ========================

let sidePanelDeepgramSocket = null;
let sidePanelMediaRecorder = null;
let sidePanelMediaStream = null;
let currentAudioSource = null; // 'microphone' or 'tab'
let manualSpeakerOverride = null; // 'advisor' or 'prospect' - set by user toggle

async function startTranscriptionForSidePanel() {
  console.log('Ultron Content: Starting transcription for Side Panel...');

  // S'assurer qu'on a le token
  if (!userToken) {
    console.log('Ultron Content: Token absent, récupération du storage...');
    const stored = await chrome.storage.local.get(['userToken']);
    userToken = stored.userToken;
  }

  if (!userToken) {
    throw new Error('Token non disponible - veuillez vous reconnecter via le popup Ultron');
  }

  console.log('Ultron Content: Token présent, appel API transcribe...');

  // Get Deepgram credentials
  const credResponse = await fetch(`${ULTRON_API_URL}/api/meeting/transcribe`, {
    headers: {
      'Authorization': `Bearer ${userToken}`,
    },
  });

  console.log('Ultron Content: Réponse API transcribe:', credResponse.status);

  const credentials = await credResponse.json();

  if (!credResponse.ok) {
    console.error('Ultron Content: Erreur API transcribe:', credentials);
    throw new Error(credentials.error || `Erreur ${credResponse.status} - vérifiez votre connexion`);
  }

  console.log('Ultron Content: Got Deepgram credentials, connecting...');

  // Connect to Deepgram
  sidePanelDeepgramSocket = new WebSocket(credentials.websocket_url, ['token', credentials.api_key]);

  sidePanelDeepgramSocket.onopen = async () => {
    console.log('Ultron Content: Deepgram connected!');

    // Notify Side Panel
    chrome.runtime.sendMessage({
      type: 'TRANSCRIPTION_STATUS',
      status: 'connected',
    });

    // Start capturing tab audio via background script
    try {
      await startTabAudioCapture();
    } catch (err) {
      console.error('Ultron Content: Tab audio capture failed, trying microphone...', err);
      // Fallback to microphone
      await startMicrophoneCapture();
    }
  };

  sidePanelDeepgramSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Ultron Content: Deepgram message type:', data.type);

      if (data.type === 'Results' && data.channel) {
        const transcript = data.channel.alternatives[0]?.transcript;
        const isFinal = data.is_final;
        const confidence = data.channel.alternatives[0]?.confidence;

        console.log('Ultron Content: Transcript result:', { transcript: transcript || '(empty)', isFinal, confidence });

        if (transcript && transcript.trim()) {
          console.log('Ultron Content: Sending transcript to Side Panel:', transcript);

          // Send to Side Panel
          chrome.runtime.sendMessage({
            type: 'TRANSCRIPT_UPDATE',
            data: {
              transcript,
              isFinal,
              speaker: detectSpeakerFromTranscript(transcript),
            },
          });
        }
      } else if (data.type === 'Metadata') {
        console.log('Ultron Content: Deepgram metadata received');
      } else if (data.type === 'Error' || data.error) {
        console.error('Ultron Content: Deepgram error:', data);
        chrome.runtime.sendMessage({
          type: 'TRANSCRIPTION_STATUS',
          status: 'error',
          error: data.message || data.error || 'Erreur Deepgram',
        });
      }
    } catch (e) {
      console.error('Ultron Content: Error parsing Deepgram message', e, event.data);
    }
  };

  sidePanelDeepgramSocket.onerror = (error) => {
    console.error('Ultron Content: Deepgram error', error);
    chrome.runtime.sendMessage({
      type: 'TRANSCRIPTION_STATUS',
      status: 'error',
      error: 'Erreur de connexion Deepgram',
    });
  };

  sidePanelDeepgramSocket.onclose = (event) => {
    console.log('Ultron Content: Deepgram closed', event.code);
    if (event.code !== 1000) {
      chrome.runtime.sendMessage({
        type: 'TRANSCRIPTION_STATUS',
        status: 'error',
        error: `Connexion fermee (code ${event.code})`,
      });
    }
  };
}

async function startTabAudioCapture() {
  console.log('Ultron Content: Requesting tab audio capture...');

  return new Promise((resolve, reject) => {
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
        console.log('Ultron Content: Got stream ID, starting capture...');

        sidePanelMediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: 'tab',
              chromeMediaSourceId: response.streamId,
            },
          },
          video: false,
        });

        // Mark that we're using tab audio (mixed audio from call)
        currentAudioSource = 'tab';
        console.log('Ultron Content: Tab audio capture started (source: tab = mixed)');
        setupMediaRecorder(sidePanelMediaStream);
        resolve();

      } catch (error) {
        reject(error);
      }
    });
  });
}

async function startMicrophoneCapture() {
  console.log('Ultron Content: Starting microphone capture as fallback...');

  try {
    // First check if we have permission
    const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
    console.log('Ultron Content: Microphone permission status:', permissionStatus.state);

    sidePanelMediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Mark that we're using microphone = advisor's voice
    currentAudioSource = 'microphone';
    console.log('Ultron Content: Microphone stream obtained (source: microphone = advisor)');
    setupMediaRecorder(sidePanelMediaStream);

  } catch (error) {
    console.error('Ultron Content: Microphone capture failed:', error.name, error.message);
    chrome.runtime.sendMessage({
      type: 'TRANSCRIPTION_STATUS',
      status: 'error',
      error: `Erreur micro: ${error.message}. Autorisez le micro pour meet.google.com`,
    });
  }
}

function setupMediaRecorder(stream) {
  // Check audio tracks
  const audioTracks = stream.getAudioTracks();
  console.log('Ultron Content: Audio tracks:', audioTracks.length, audioTracks.map(t => t.label));

  if (audioTracks.length === 0) {
    console.error('Ultron Content: No audio tracks in stream!');
    chrome.runtime.sendMessage({
      type: 'TRANSCRIPTION_STATUS',
      status: 'error',
      error: 'Aucune piste audio detectee',
    });
    return;
  }

  let mimeType = 'audio/webm;codecs=opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'audio/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = '';
    }
  }
  console.log('Ultron Content: Using mimeType:', mimeType || 'default');

  const options = mimeType ? { mimeType } : {};
  sidePanelMediaRecorder = new MediaRecorder(stream, options);

  let chunkCount = 0;
  sidePanelMediaRecorder.ondataavailable = (event) => {
    chunkCount++;
    if (event.data.size > 0) {
      if (chunkCount <= 5 || chunkCount % 20 === 0) {
        console.log(`Ultron Content: Audio chunk #${chunkCount}, size: ${event.data.size} bytes, WS state: ${sidePanelDeepgramSocket?.readyState}`);
      }
      if (sidePanelDeepgramSocket && sidePanelDeepgramSocket.readyState === WebSocket.OPEN) {
        sidePanelDeepgramSocket.send(event.data);
      } else {
        console.warn('Ultron Content: WebSocket not open, cannot send audio');
      }
    } else {
      console.warn('Ultron Content: Empty audio chunk');
    }
  };

  sidePanelMediaRecorder.onerror = (error) => {
    console.error('Ultron Content: MediaRecorder error', error);
  };

  sidePanelMediaRecorder.start(250);
  console.log('Ultron Content: MediaRecorder started, state:', sidePanelMediaRecorder.state);

  // Notify Side Panel
  chrome.runtime.sendMessage({
    type: 'TRANSCRIPTION_STATUS',
    status: 'connected',
  });
}

function detectSpeakerFromTranscript(transcript) {
  // Check for manual override first (user toggled speaker)
  if (manualSpeakerOverride) {
    return manualSpeakerOverride;
  }

  // If using microphone capture, it's the advisor speaking
  if (currentAudioSource === 'microphone') {
    return 'advisor';
  }

  // For tab audio (mixed), use keyword heuristics as fallback
  const lowerTranscript = transcript.toLowerCase();

  const prospectIndicators = [
    'je voudrais', 'j\'aimerais', 'est-ce que', 'combien', 'pourquoi',
    'je ne sais pas', 'je dois reflechir', 'c\'est trop cher', 'pas maintenant',
    'merci de me rappeler', 'je vous ecoute'
  ];

  const advisorIndicators = [
    'je vous propose', 'permettez-moi', 'comme je disais', 'nos clients',
    'notre solution', 'je comprends', 'excellente question', 'je me presente',
    'je suis conseiller', 'notre cabinet'
  ];

  const isProspect = prospectIndicators.some(ind => lowerTranscript.includes(ind));
  const isAdvisor = advisorIndicators.some(ind => lowerTranscript.includes(ind));

  if (isProspect && !isAdvisor) return 'prospect';
  if (isAdvisor && !isProspect) return 'advisor';

  // Default to advisor for unknown (since advisor initiates the call usually)
  return 'advisor';
}

function stopTranscriptionForSidePanel() {
  console.log('Ultron Content: Stopping transcription...');

  if (sidePanelMediaRecorder && sidePanelMediaRecorder.state !== 'inactive') {
    sidePanelMediaRecorder.stop();
  }

  if (sidePanelMediaStream) {
    sidePanelMediaStream.getTracks().forEach(track => track.stop());
    sidePanelMediaStream = null;
  }

  if (sidePanelDeepgramSocket) {
    sidePanelDeepgramSocket.close(1000);
    sidePanelDeepgramSocket = null;
  }

  // Reset state
  currentAudioSource = null;
  manualSpeakerOverride = null;

  chrome.runtime.sendMessage({ type: 'TRANSCRIPTION_STOPPED' });
}
