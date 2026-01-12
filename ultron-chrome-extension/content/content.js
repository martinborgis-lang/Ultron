const ULTRON_API_URL = 'https://ultron-murex.vercel.app';

let panelElement = null;
let isTranscribing = false;
let recognition = null;
let currentProspect = null;
let userToken = null;
let transcriptionBuffer = [];

// Initialization
(async function init() {
  console.log('Ultron Meeting Assistant: Initializing...');

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

    // Try to detect prospect from URL or title
    detectProspect();
  }, 3000);
})();

function createPanel() {
  if (panelElement) return;

  panelElement = document.createElement('div');
  panelElement.id = 'ultron-panel';
  panelElement.innerHTML = `
    <div class="ultron-header">
      <span class="ultron-logo">ULTRON</span>
      <div class="ultron-controls">
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
          <span>Transcription</span>
          <button id="ultron-toggle-transcription">Activer</button>
        </div>
        <div id="ultron-transcription-text"></div>
      </div>
      <div id="ultron-suggestions" class="hidden">
        <div class="ultron-section-header">Suggestions</div>
        <div id="ultron-suggestions-list"></div>
      </div>
    </div>
  `;

  document.body.appendChild(panelElement);

  // Event listeners
  document.getElementById('ultron-close').addEventListener('click', () => {
    panelElement.remove();
    panelElement = null;
  });

  document.getElementById('ultron-minimize').addEventListener('click', () => {
    panelElement.classList.toggle('minimized');
  });

  document.getElementById('ultron-toggle-transcription').addEventListener('click', toggleTranscription);
}

async function detectProspect() {
  // Try to find prospect from meeting participants or ask user to select
  const meetingTitle = document.querySelector('[data-meeting-title]')?.textContent ||
                       document.title.replace(' - Google Meet', '').trim();

  if (meetingTitle) {
    // Search for prospect with this name
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
        <span class="ultron-prospect-name">${prospect.prenom} ${prospect.nom}</span>
        <span class="ultron-badge ${prospect.qualification?.toLowerCase()}">${prospect.qualification || 'N/A'}</span>
      </div>
      <div class="ultron-prospect-details">
        <div>Email: ${prospect.email || 'N/A'}</div>
        <div>Tel: ${prospect.telephone || 'N/A'}</div>
        <div>Situation: ${prospect.situation_pro || 'N/A'}</div>
        <div>Revenus: ${prospect.revenus || 'N/A'}</div>
        <div>Patrimoine: ${prospect.patrimoine || 'N/A'}</div>
      </div>
      <div class="ultron-prospect-needs">
        <strong>Besoins:</strong> ${prospect.besoins || 'Non renseigne'}
      </div>
      <div class="ultron-prospect-notes">
        <strong>Notes:</strong> ${prospect.notes_appel || 'Aucune note'}
      </div>
      <button id="ultron-change-prospect" class="ultron-btn-secondary">Changer de prospect</button>
    </div>
  `;

  document.getElementById('ultron-change-prospect')?.addEventListener('click', showProspectSelector);
  document.getElementById('ultron-transcription').classList.remove('hidden');
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
          <span>${p.prenom} ${p.nom}</span>
          <span class="ultron-badge ${p.qualification?.toLowerCase()}">${p.qualification || 'N/A'}</span>
        </div>
      `).join('');

      // Add event listeners
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

function toggleTranscription() {
  const btn = document.getElementById('ultron-toggle-transcription');

  if (isTranscribing) {
    stopTranscription();
    btn.textContent = 'Activer';
  } else {
    startTranscription();
    btn.textContent = 'Arreter';
  }
}

function startTranscription() {
  if (!('webkitSpeechRecognition' in window)) {
    alert('La transcription n\'est pas supportee dans ce navigateur');
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'fr-FR';

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
        transcriptionBuffer.push({
          text: transcript,
          timestamp: new Date().toISOString(),
        });
      } else {
        interimTranscript += transcript;
      }
    }

    const container = document.getElementById('ultron-transcription-text');
    container.innerHTML = `
      <div class="ultron-transcript-final">${transcriptionBuffer.map(t => t.text).join(' ')}</div>
      <div class="ultron-transcript-interim">${interimTranscript}</div>
    `;
    container.scrollTop = container.scrollHeight;
  };

  recognition.onerror = (event) => {
    console.error('Ultron: Transcription error', event.error);
    if (event.error === 'not-allowed') {
      alert('Microphone non autorise. Veuillez autoriser l\'acces au microphone.');
    }
  };

  recognition.onend = () => {
    if (isTranscribing) {
      recognition.start(); // Auto-restart
    }
  };

  recognition.start();
  isTranscribing = true;
}

function stopTranscription() {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  isTranscribing = false;
}

// Utilities
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
