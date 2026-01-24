const ULTRON_API_URL = 'https://ultron-murex.vercel.app';

// State
let userToken = null;
let currentProspect = null;
let currentAnalysis = null;
let prospects = [];
let currentMeetUrl = null; // URL du meeting Google Meet actuel

// Transcription state
let isTranscribing = false;
let transcriptSegments = [];
let conversationHistory = [];
let meetingStartTime = null;
let deepgramSocket = null;
let realtimeAnalysisTimeout = null;

// DOM Elements
const loginRequired = document.getElementById('login-required');
const mainContent = document.getElementById('main-content');
const prospectSelect = document.getElementById('prospect-select');
const refreshBtn = document.getElementById('refresh-prospects');
const prospectInfo = document.getElementById('prospect-info');
const tabsSection = document.getElementById('tabs-section');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  const stored = await chrome.storage.local.get(['userToken', 'selectedProspectId']);
  userToken = stored.userToken;

  if (!userToken) {
    showLoginRequired();
    return;
  }

  showMainContent();

  // 1. Récupérer l'URL Google Meet de l'onglet actif
  await detectCurrentMeetUrl();

  // 2. Charger les prospects
  await loadProspects();

  // 3. Essayer de trouver le prospect par le meet_link
  const prospectByMeet = findProspectByMeetUrl(currentMeetUrl);

  if (prospectByMeet) {
    // Prospect trouvé par le lien Meet - le sélectionner
    console.log('Ultron: Prospect trouvé par meet_link:', prospectByMeet.id);
    prospectSelect.value = prospectByMeet.id;
    await chrome.storage.local.set({ selectedProspectId: prospectByMeet.id });
    await loadProspectDetails(prospectByMeet.id);
  } else if (stored.selectedProspectId) {
    // Fallback: utiliser le prospect précédemment sélectionné
    console.log('Ultron: Fallback vers selectedProspectId:', stored.selectedProspectId);
    prospectSelect.value = stored.selectedProspectId;
    await loadProspectDetails(stored.selectedProspectId);
  }

  // Setup tabs
  setupTabs();

  // Setup transcription
  setupTranscription();
});

// Détecter l'URL Google Meet de l'onglet actif
async function detectCurrentMeetUrl() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const meetTab = tabs.find(t => t.url?.includes('meet.google.com'));

    if (meetTab && meetTab.url) {
      currentMeetUrl = meetTab.url;
      console.log('Ultron: Meet URL détectée:', currentMeetUrl);
    }
  } catch (error) {
    console.error('Ultron: Erreur détection URL Meet:', error);
  }
}

// Trouver un prospect par son meet_link
function findProspectByMeetUrl(meetUrl) {
  if (!meetUrl || !prospects || prospects.length === 0) return null;

  // Extraire le code du meeting (ex: "abc-defg-hij" de "https://meet.google.com/abc-defg-hij")
  const meetCodeMatch = meetUrl.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
  const meetCode = meetCodeMatch ? meetCodeMatch[1] : null;

  console.log('Ultron: Recherche prospect avec meet_code:', meetCode);

  for (const prospect of prospects) {
    if (prospect.meet_link) {
      // Vérifier si le meet_link contient le même code
      if (prospect.meet_link.includes(meetCode) || meetUrl.includes(prospect.meet_link)) {
        console.log('Ultron: Match trouvé:', prospect);
        return prospect;
      }
    }
  }

  console.log('Ultron: Aucun prospect trouvé avec ce meet_link');
  return null;
}

// Event listeners
prospectSelect.addEventListener('change', async (e) => {
  const prospectId = e.target.value;
  if (prospectId) {
    await chrome.storage.local.set({ selectedProspectId: prospectId });
    await loadProspectDetails(prospectId);
  } else {
    hideProspectInfo();
  }
});

refreshBtn.addEventListener('click', async () => {
  refreshBtn.textContent = '...';
  await loadProspects();
  refreshBtn.textContent = '↻';
});

document.getElementById('open-popup-btn')?.addEventListener('click', () => {
  alert('Cliquez sur l\'icone Ultron dans la barre d\'outils Chrome pour vous connecter.');
});

// Listen for storage changes (e.g., when user logs in from popup)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.userToken) {
      userToken = changes.userToken.newValue;
      if (userToken) {
        showMainContent();
        loadProspects();
      } else {
        showLoginRequired();
      }
    }
    if (changes.selectedProspectId && changes.selectedProspectId.newValue) {
      prospectSelect.value = changes.selectedProspectId.newValue;
      loadProspectDetails(changes.selectedProspectId.newValue);
    }
  }
});

function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      // Add active to clicked tab
      tab.classList.add('active');

      // Hide all tab contents
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });

      // Show selected tab content
      const tabId = tab.dataset.tab;
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });
}

function showLoginRequired() {
  loginRequired.classList.remove('hidden');
  mainContent.classList.add('hidden');
}

function showMainContent() {
  loginRequired.classList.add('hidden');
  mainContent.classList.remove('hidden');
}

async function loadProspects() {
  try {
    const response = await fetch(`${ULTRON_API_URL}/api/extension/prospects`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load prospects');
    }

    const data = await response.json();
    prospects = data.prospects || [];

    // Populate select
    prospectSelect.innerHTML = '<option value="">Selectionner un prospect...</option>';
    prospects.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      const name = `${p.prenom || p.firstName || ''} ${p.nom || p.lastName || ''}`.trim();
      const date = p.date_rdv ? ` - ${p.date_rdv}` : '';
      option.textContent = `${name}${date}`;
      prospectSelect.appendChild(option);
    });

  } catch (error) {
    console.error('Error loading prospects:', error);
    prospectSelect.innerHTML = '<option value="">Erreur de chargement</option>';
  }
}

async function loadProspectDetails(prospectId) {
  try {
    // Show loading state
    prospectInfo.classList.remove('hidden');
    tabsSection.classList.remove('hidden');
    showAllLoading();

    // Get prospect details from meeting prepare API (more complete data)
    const response = await fetch(`${ULTRON_API_URL}/api/meeting/prepare/${prospectId}`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      // Fallback to extension API
      const fallbackResponse = await fetch(`${ULTRON_API_URL}/api/extension/prospect/${prospectId}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      });
      const fallbackData = await fallbackResponse.json();
      if (fallbackData.prospect) {
        currentProspect = fallbackData.prospect;
        displayProspectInfo(currentProspect);
        await loadDetailedAnalysis(currentProspect, []);
      }
      return;
    }

    const data = await response.json();
    currentProspect = data.prospect;
    const interactions = data.interactions || [];

    // Display prospect info
    displayProspectInfo(currentProspect);

    // Display history
    displayHistory(interactions);

    // Load detailed AI analysis
    await loadDetailedAnalysis(currentProspect, interactions);

  } catch (error) {
    console.error('Error loading prospect details:', error);
    prospectInfo.innerHTML = '<div class="prospect-card"><p class="loading">Erreur de chargement</p></div>';
  }
}

function displayProspectInfo(prospect) {
  const firstName = prospect.prenom || prospect.firstName || prospect.first_name || '';
  const lastName = prospect.nom || prospect.lastName || prospect.last_name || '';

  document.getElementById('prospect-name').textContent = `${firstName} ${lastName}`;

  const badge = document.getElementById('prospect-badge');
  const qualification = (prospect.qualification || 'non_qualifie').toLowerCase().replace(' ', '_');
  badge.textContent = prospect.qualification || 'N/A';
  badge.className = `badge ${qualification}`;

  const scoreBadge = document.getElementById('prospect-score');
  const score = prospect.score || prospect.score_ia || 0;
  scoreBadge.textContent = `${score}%`;

  document.getElementById('prospect-email').textContent = prospect.email || 'N/A';
  document.getElementById('prospect-phone').textContent = prospect.telephone || prospect.phone || 'N/A';
  document.getElementById('prospect-rdv').textContent = prospect.date_rdv || 'Non planifie';
  document.getElementById('prospect-profession').textContent = prospect.situation_pro || prospect.profession || 'N/A';
  document.getElementById('prospect-revenus').textContent = formatCurrency(prospect.revenus || prospect.revenus_annuels);
  document.getElementById('prospect-patrimoine').textContent = formatCurrency(prospect.patrimoine || prospect.patrimoine_estime);
  document.getElementById('prospect-age').textContent = prospect.age || 'N/A';
  document.getElementById('prospect-source').textContent = prospect.source || 'N/A';
  document.getElementById('prospect-besoins').textContent = prospect.besoins || prospect.notes || 'Non renseigne';
  document.getElementById('prospect-notes').textContent = prospect.notes_appel || prospect.notes || 'Aucune note';

  // Justification IA
  const justificationSection = document.getElementById('prospect-justification');
  const justificationText = prospect.justification || prospect.analyse_ia;
  if (justificationText) {
    document.getElementById('prospect-justification-text').textContent = justificationText;
    justificationSection.classList.remove('hidden');
  } else {
    justificationSection.classList.add('hidden');
  }

  prospectInfo.classList.remove('hidden');
  tabsSection.classList.remove('hidden');

  // Show transcription section when prospect is selected
  document.getElementById('transcription-section').classList.remove('hidden');
}

async function loadDetailedAnalysis(prospect, interactions) {
  try {
    showAllLoading();

    const response = await fetch(`${ULTRON_API_URL}/api/meeting/analyze-prep`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({ prospect, interactions }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI analysis');
    }

    const data = await response.json();
    currentAnalysis = data.analysis;

    if (currentAnalysis) {
      displayAnalysis(currentAnalysis);
    }

  } catch (error) {
    console.error('Error loading AI analysis:', error);
    // Show error in all tabs
    document.getElementById('questions-loading').textContent = 'Erreur d\'analyse';
    document.getElementById('arguments-loading').textContent = 'Erreur d\'analyse';
    document.getElementById('attention-loading').textContent = 'Erreur d\'analyse';
  }
}

function showAllLoading() {
  document.getElementById('questions-loading').classList.remove('hidden');
  document.getElementById('questions-content').classList.add('hidden');
  document.getElementById('arguments-loading').classList.remove('hidden');
  document.getElementById('arguments-content').classList.add('hidden');
  document.getElementById('attention-loading').classList.remove('hidden');
  document.getElementById('attention-content').classList.add('hidden');
}

function displayAnalysis(analysis) {
  // Questions tab
  const questionsList = document.getElementById('questions-list');
  questionsList.innerHTML = (analysis.questionsSuggerees || [])
    .map(q => `<li><span>${q}</span></li>`)
    .join('') || '<li>Aucune suggestion</li>';
  document.getElementById('questions-loading').classList.add('hidden');
  document.getElementById('questions-content').classList.remove('hidden');

  // Arguments tab
  const argumentsList = document.getElementById('arguments-list');
  argumentsList.innerHTML = (analysis.argumentsCles || [])
    .map(a => `<li>${a}</li>`)
    .join('') || '<li>Aucun argument</li>';

  // Profil comportemental
  const profilSection = document.getElementById('profil-section');
  if (analysis.profilPsycho) {
    document.getElementById('profil-text').textContent = analysis.profilPsycho;
    profilSection.classList.remove('hidden');
  } else {
    profilSection.classList.add('hidden');
  }
  document.getElementById('arguments-loading').classList.add('hidden');
  document.getElementById('arguments-content').classList.remove('hidden');

  // Attention tab
  const attentionList = document.getElementById('attention-list');
  attentionList.innerHTML = (analysis.pointsAttention || [])
    .map(p => `<li>${p}</li>`)
    .join('') || '<li>Aucun point d\'attention</li>';

  const objectionsList = document.getElementById('objections-list');
  objectionsList.innerHTML = (analysis.objectionsProba || [])
    .map(o => `<li>${o}</li>`)
    .join('') || '<li>Aucune objection</li>';
  document.getElementById('attention-loading').classList.add('hidden');
  document.getElementById('attention-content').classList.remove('hidden');
}

function displayHistory(interactions) {
  const historyList = document.getElementById('history-list');

  if (!interactions || interactions.length === 0) {
    historyList.innerHTML = '<p class="loading">Aucune interaction enregistree</p>';
    return;
  }

  historyList.innerHTML = interactions.map(i => `
    <div class="history-item">
      <div class="type">${i.type}</div>
      <div class="description">${i.description}</div>
      <div class="date">${i.date}</div>
    </div>
  `).join('');
}

function hideProspectInfo() {
  prospectInfo.classList.add('hidden');
  tabsSection.classList.add('hidden');
  currentProspect = null;
  currentAnalysis = null;
}

function formatCurrency(value) {
  if (!value) return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
  if (isNaN(num)) return value;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(num);
}

// ========================
// TRANSCRIPTION FUNCTIONS
// ========================

let currentSpeakerMode = 'auto'; // 'auto', 'advisor', 'prospect'

function setupTranscription() {
  const toggleBtn = document.getElementById('toggle-transcription');
  const saveBtn = document.getElementById('save-transcript');

  toggleBtn?.addEventListener('click', toggleTranscription);
  saveBtn?.addEventListener('click', saveTranscript);

  // Setup speaker toggle buttons
  setupSpeakerToggle();
}

function setupSpeakerToggle() {
  const speakerBtns = document.querySelectorAll('.speaker-btn');

  speakerBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const speaker = btn.dataset.speaker;

      // Update UI
      speakerBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update state
      currentSpeakerMode = speaker;

      // Send to content script
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const meetTab = tabs.find(t => t.url?.includes('meet.google.com'));

        if (meetTab) {
          const speakerOverride = speaker === 'auto' ? null : speaker;
          chrome.tabs.sendMessage(meetTab.id, {
            type: 'SET_SPEAKER',
            speaker: speakerOverride,
          });
          console.log('Ultron: Speaker mode set to:', speaker);
        }
      } catch (e) {
        console.error('Ultron: Error setting speaker', e);
      }
    });
  });
}

async function toggleTranscription() {
  const toggleBtn = document.getElementById('toggle-transcription');

  if (isTranscribing) {
    stopTranscription();
    toggleBtn.textContent = 'Demarrer';
    toggleBtn.classList.remove('active');
  } else {
    await startTranscription();
    toggleBtn.textContent = 'Arreter';
    toggleBtn.classList.add('active');
  }
}

async function startTranscription() {
  if (!currentProspect) {
    alert('Veuillez d\'abord selectionner un prospect');
    return;
  }

  const statusDot = document.getElementById('transcription-status');
  const transcriptionText = document.getElementById('transcription-text');

  try {
    statusDot.className = 'status-dot connecting';
    transcriptionText.innerHTML = '<p class="transcription-placeholder">Connexion en cours...</p>';

    // Get the active Google Meet tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const meetTab = tabs.find(t => t.url?.includes('meet.google.com'));

    if (!meetTab) {
      throw new Error('Aucun onglet Google Meet actif trouve');
    }

    // Send message to content script to start transcription
    chrome.tabs.sendMessage(meetTab.id, {
      type: 'START_TRANSCRIPTION',
      token: userToken,
      prospectId: currentProspect.id,
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Ultron: Error sending message to content script', chrome.runtime.lastError);
        statusDot.className = 'status-dot error';
        transcriptionText.innerHTML = '<p class="transcription-placeholder" style="color: #ef4444;">Erreur: Impossible de communiquer avec Google Meet. Rafraichissez la page.</p>';
        return;
      }

      if (response && response.success) {
        console.log('Ultron: Transcription started via content script');
        statusDot.className = 'status-dot connected';
        transcriptionText.innerHTML = '<p class="transcription-placeholder">En ecoute... (capture audio de l\'onglet)</p>';
      } else {
        statusDot.className = 'status-dot error';
        transcriptionText.innerHTML = `<p class="transcription-placeholder" style="color: #ef4444;">Erreur: ${response?.error || 'Echec du demarrage'}</p>`;
      }
    });

    isTranscribing = true;
    meetingStartTime = Date.now();
    transcriptSegments = [];
    conversationHistory = [];

    // Show sections
    document.getElementById('transcription-section').classList.remove('hidden');
    document.getElementById('realtime-section').classList.remove('hidden');
    document.getElementById('transcription-actions').classList.remove('hidden');

    // Show speaker toggle
    document.getElementById('speaker-toggle').classList.remove('hidden');

    // Reset speaker to auto (advisor by default since using microphone)
    currentSpeakerMode = 'auto';
    document.querySelectorAll('.speaker-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.speaker-btn[data-speaker="advisor"]').classList.add('active');

  } catch (error) {
    console.error('Ultron: Failed to start transcription', error);
    statusDot.className = 'status-dot error';
    transcriptionText.innerHTML = `<p class="transcription-placeholder" style="color: #ef4444;">Erreur: ${error.message}</p>`;
  }
}

// Listen for transcript updates from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRANSCRIPT_UPDATE') {
    handleTranscriptUpdate(message.data);
    sendResponse({ success: true });
  }

  if (message.type === 'TRANSCRIPTION_STATUS') {
    const statusDot = document.getElementById('transcription-status');
    const transcriptionText = document.getElementById('transcription-text');

    if (message.status === 'connected') {
      statusDot.className = 'status-dot connected';
      transcriptionText.innerHTML = '<p class="transcription-placeholder">En ecoute... Parlez!</p>';
    } else if (message.status === 'error') {
      statusDot.className = 'status-dot error';
      transcriptionText.innerHTML = `<p class="transcription-placeholder" style="color: #ef4444;">${message.error}</p>`;
    }
    sendResponse({ success: true });
  }

  if (message.type === 'TRANSCRIPTION_STOPPED') {
    isTranscribing = false;
    const toggleBtn = document.getElementById('toggle-transcription');
    toggleBtn.textContent = 'Demarrer';
    toggleBtn.classList.remove('active');
    document.getElementById('transcription-status').className = 'status-dot';
    sendResponse({ success: true });
  }

  return true;
});

function handleTranscriptUpdate(data) {
  const { transcript, isFinal, speaker } = data;

  console.log('Ultron: Transcript update:', { transcript, isFinal, speaker });

  if (transcript && transcript.trim()) {
    const currentTime = meetingStartTime ? (Date.now() - meetingStartTime) / 1000 : 0;

    if (isFinal) {
      transcriptSegments.push({
        timestamp: currentTime,
        speaker: speaker || 'unknown',
        text: transcript,
      });

      const speakerLabel = speaker === 'advisor' ? 'Conseiller' : 'Prospect';
      conversationHistory.push(`[${speakerLabel}]: ${transcript}`);

      console.log('Ultron: Added final segment, total:', transcriptSegments.length);

      // Schedule real-time AI analysis
      scheduleRealtimeAnalysis();
    }

    // Update display
    updateTranscriptDisplay(transcript, isFinal);
  }
}

function updateTranscriptDisplay(currentTranscript, isFinal) {
  const container = document.getElementById('transcription-text');

  const segmentsHtml = transcriptSegments.map(seg => {
    const speakerLabel = seg.speaker === 'advisor' ? 'Conseiller' : 'Prospect';
    const time = formatTime(seg.timestamp);
    return `
      <div class="transcript-segment">
        <span class="speaker ${seg.speaker}">${speakerLabel}</span>
        <span class="time">${time}</span>
        <div class="text">${seg.text}</div>
      </div>
    `;
  }).join('');

  const interimHtml = !isFinal && currentTranscript ? `
    <div class="transcript-interim">${currentTranscript}</div>
  ` : '';

  container.innerHTML = segmentsHtml + interimHtml || '<p class="transcription-placeholder">En ecoute...</p>';
  container.scrollTop = container.scrollHeight;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function stopTranscription() {
  // Send message to content script to stop transcription
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const meetTab = tabs.find(t => t.url?.includes('meet.google.com'));

    if (meetTab) {
      chrome.tabs.sendMessage(meetTab.id, { type: 'STOP_TRANSCRIPTION' });
    }
  } catch (e) {
    console.error('Ultron: Error stopping transcription', e);
  }

  // Clear timeout
  if (realtimeAnalysisTimeout) {
    clearTimeout(realtimeAnalysisTimeout);
    realtimeAnalysisTimeout = null;
  }

  isTranscribing = false;

  const statusDot = document.getElementById('transcription-status');
  statusDot.className = 'status-dot';

  // Hide speaker toggle
  document.getElementById('speaker-toggle').classList.add('hidden');

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

  } catch (error) {
    console.error('Ultron: Realtime analysis error', error);
  }
}

function displayRealtimeSuggestions(analysis) {
  const container = document.getElementById('realtime-suggestions');

  let html = '';

  if (analysis.objectionDetectee) {
    html += `
      <div class="realtime-alert objection">
        <strong>Objection detectee:</strong> ${analysis.objectionDetectee}
        <div class="response">
          <strong>Reponse suggeree:</strong> ${analysis.reponseObjection || 'N/A'}
        </div>
      </div>
    `;
  }

  if (analysis.questionSuivante) {
    html += `
      <div class="realtime-suggestion">
        <strong>Question a poser maintenant:</strong>
        <p>${analysis.questionSuivante}</p>
      </div>
    `;
  }

  if (analysis.pointCle) {
    html += `
      <div class="realtime-suggestion highlight">
        <strong>Point cle a aborder:</strong>
        <p>${analysis.pointCle}</p>
      </div>
    `;
  }

  if (analysis.tonalite) {
    html += `
      <div class="tonalite ${analysis.tonalite.toLowerCase()}">
        Tonalite du prospect: <strong>${analysis.tonalite}</strong>
      </div>
    `;
  }

  if (!html) {
    html = '<p class="realtime-placeholder">Continuez la conversation...</p>';
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

  const saveBtn = document.getElementById('save-transcript');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Sauvegarde en cours...';

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
      alert(`Transcript sauvegarde avec succes!\n\nResume: ${data.ai_summary?.substring(0, 200) || 'N/A'}...`);

      if (data.pdf_url) {
        window.open(data.pdf_url, '_blank');
      }
    } else {
      throw new Error(data.error || 'Erreur de sauvegarde');
    }

  } catch (error) {
    console.error('Ultron: Save error', error);
    alert('Erreur lors de la sauvegarde: ' + error.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Sauvegarder et generer PDF';
  }
}
