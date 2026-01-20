const ULTRON_API_URL = 'https://ultron-murex.vercel.app';

// State
let userToken = null;
let currentProspect = null;
let currentAnalysis = null;
let prospects = [];

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
  await loadProspects();

  // If a prospect was previously selected, select it
  if (stored.selectedProspectId) {
    prospectSelect.value = stored.selectedProspectId;
    await loadProspectDetails(stored.selectedProspectId);
  }

  // Setup tabs
  setupTabs();
});

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
