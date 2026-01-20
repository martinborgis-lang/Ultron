const ULTRON_API_URL = 'https://ultron-murex.vercel.app';

// State
let userToken = null;
let currentProspect = null;
let prospects = [];

// DOM Elements
const loginRequired = document.getElementById('login-required');
const mainContent = document.getElementById('main-content');
const prospectSelect = document.getElementById('prospect-select');
const refreshBtn = document.getElementById('refresh-prospects');
const prospectInfo = document.getElementById('prospect-info');
const suggestionsSection = document.getElementById('suggestions-section');
const suggestionsLoading = document.getElementById('suggestions-loading');
const suggestionsContent = document.getElementById('suggestions-content');
const historySection = document.getElementById('history-section');

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
  // Can't directly open popup, but can show instructions
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
    suggestionsSection.classList.remove('hidden');
    suggestionsLoading.classList.remove('hidden');
    suggestionsContent.classList.add('hidden');
    historySection.classList.add('hidden');

    // Get prospect details from extension API
    const response = await fetch(`${ULTRON_API_URL}/api/extension/prospect/${prospectId}`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load prospect');
    }

    const data = await response.json();
    currentProspect = data.prospect;

    // Display prospect info
    displayProspectInfo(currentProspect);

    // Load AI suggestions
    await loadAISuggestions(currentProspect);

    // Load preparation data (includes history)
    await loadPreparationData(prospectId);

  } catch (error) {
    console.error('Error loading prospect details:', error);
    prospectInfo.innerHTML = '<p class="loading">Erreur de chargement</p>';
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

  document.getElementById('prospect-email').textContent = prospect.email || 'N/A';
  document.getElementById('prospect-phone').textContent = prospect.telephone || prospect.phone || 'N/A';
  document.getElementById('prospect-revenus').textContent = formatCurrency(prospect.revenus || prospect.revenus_annuels);
  document.getElementById('prospect-patrimoine').textContent = formatCurrency(prospect.patrimoine || prospect.patrimoine_estime);
  document.getElementById('prospect-profession').textContent = prospect.situation_pro || prospect.profession || 'N/A';
  document.getElementById('prospect-besoins').textContent = prospect.besoins || prospect.notes || 'Non renseigne';
  document.getElementById('prospect-notes').textContent = prospect.notes_appel || prospect.notes || 'Aucune note';

  prospectInfo.classList.remove('hidden');
}

async function loadAISuggestions(prospect) {
  try {
    suggestionsLoading.classList.remove('hidden');
    suggestionsContent.classList.add('hidden');

    const response = await fetch(`${ULTRON_API_URL}/api/extension/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({ prospect }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI suggestions');
    }

    const data = await response.json();

    if (data.analysis) {
      displaySuggestions(data.analysis);
    }

  } catch (error) {
    console.error('Error loading AI suggestions:', error);
    suggestionsLoading.textContent = 'Erreur lors de l\'analyse';
  }
}

function displaySuggestions(analysis) {
  const questionsList = document.getElementById('questions-list');
  const argumentsList = document.getElementById('arguments-list');
  const objectionsList = document.getElementById('objections-list');

  questionsList.innerHTML = (analysis.questionsSuggerees || [])
    .map(q => `<li>${q}</li>`)
    .join('') || '<li>Aucune suggestion</li>';

  argumentsList.innerHTML = (analysis.argumentsCles || [])
    .map(a => `<li>${a}</li>`)
    .join('') || '<li>Aucun argument</li>';

  objectionsList.innerHTML = (analysis.objectionsProba || [])
    .map(o => `<li>${o}</li>`)
    .join('') || '<li>Aucune objection</li>';

  suggestionsLoading.classList.add('hidden');
  suggestionsContent.classList.remove('hidden');
}

async function loadPreparationData(prospectId) {
  try {
    const response = await fetch(`${ULTRON_API_URL}/api/meeting/prepare/${prospectId}`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      // Not critical if this fails
      console.warn('Could not load preparation data');
      return;
    }

    const data = await response.json();

    // Display interactions history
    if (data.interactions && data.interactions.length > 0) {
      displayHistory(data.interactions);
    }

  } catch (error) {
    console.error('Error loading preparation data:', error);
  }
}

function displayHistory(interactions) {
  const historyList = document.getElementById('history-list');

  historyList.innerHTML = interactions.map(i => `
    <div class="history-item">
      <div class="type">${i.type}</div>
      <div class="description">${i.description}</div>
      <div class="date">${i.date}</div>
    </div>
  `).join('');

  historySection.classList.remove('hidden');
}

function hideProspectInfo() {
  prospectInfo.classList.add('hidden');
  suggestionsSection.classList.add('hidden');
  historySection.classList.add('hidden');
  currentProspect = null;
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
