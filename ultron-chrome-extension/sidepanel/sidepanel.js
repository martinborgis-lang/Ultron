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
  console.log('=== ULTRON SIDEPANEL INIT ===');

  const stored = await chrome.storage.local.get(['userToken', 'selectedProspectId']);
  userToken = stored.userToken;

  console.log('Ultron [INIT]: Token from storage:', userToken ? 'PRÉSENT (' + userToken.substring(0, 20) + '...)' : 'ABSENT');
  console.log('Ultron [INIT]: selectedProspectId from storage:', stored.selectedProspectId || 'AUCUN');

  if (!userToken) {
    console.log('Ultron [INIT]: Pas de token, affichage login required');
    showLoginRequired();
    return;
  }

  showMainContent();

  // 1. Récupérer l'URL Google Meet de l'onglet actif
  await detectCurrentMeetUrl();

  // 2. Charger les prospects (BUG 1 - dropdown)
  console.log('Ultron [BUG1]: Appel loadProspects()...');
  await loadProspects();
  console.log('Ultron [BUG1]: loadProspects() terminé, prospects chargés:', prospects.length);

  // 3. Essayer de trouver le prospect par le meet_link ou le titre du meeting (BUG 2)
  console.log('Ultron [BUG2]: Recherche du prospect pour ce meeting...');
  const prospectByMeet = await findProspectByMeetUrl(currentMeetUrl);

  console.log('Ultron [BUG2]: Résultat findProspectByMeetUrl:', prospectByMeet ? `TROUVÉ: ${prospectByMeet.prenom || prospectByMeet.firstName} ${prospectByMeet.nom || prospectByMeet.lastName}` : 'NON TROUVÉ');

  if (prospectByMeet) {
    // Prospect trouvé par le lien Meet - le sélectionner
    console.log('Ultron [BUG2]: ✅ Sélection du prospect trouvé par meeting:', prospectByMeet.id);
    prospectSelect.value = prospectByMeet.id;
    await chrome.storage.local.set({ selectedProspectId: prospectByMeet.id });
    await loadProspectDetails(prospectByMeet.id);
  } else if (stored.selectedProspectId) {
    // Fallback: utiliser le prospect précédemment sélectionné
    console.log('Ultron [BUG2]: ⚠️ FALLBACK vers ancien selectedProspectId:', stored.selectedProspectId);
    console.log('Ultron [BUG2]: C\'est probablement la cause du mauvais prospect affiché!');
    prospectSelect.value = stored.selectedProspectId;
    await loadProspectDetails(stored.selectedProspectId);
  } else {
    console.log('Ultron [BUG2]: Aucun prospect sélectionné');
  }

  // Setup tabs
  setupTabs();

  // Setup transcription
  setupTranscription();

  console.log('=== ULTRON SIDEPANEL INIT TERMINÉ ===');
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

// Trouver un prospect par son meet_link OU par le titre du meeting
async function findProspectByMeetUrl(meetUrl) {
  console.log('Ultron [BUG2]: === RECHERCHE PROSPECT ===');
  console.log('Ultron [BUG2]: Meet URL:', meetUrl || 'AUCUNE');
  console.log('Ultron [BUG2]: Nombre de prospects chargés:', prospects?.length || 0);

  if (!prospects || prospects.length === 0) {
    console.log('Ultron [BUG2]: ❌ Aucun prospect chargé - impossible de matcher');
    return null;
  }

  // 1. Essayer de matcher par meet_link
  if (meetUrl) {
    const meetCodeMatch = meetUrl.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
    const meetCode = meetCodeMatch ? meetCodeMatch[1] : null;

    console.log('Ultron [BUG2]: Code meeting extrait:', meetCode || 'AUCUN');
    console.log('Ultron [BUG2]: Recherche par meet_link...');

    for (const prospect of prospects) {
      if (prospect.meet_link) {
        console.log(`Ultron [BUG2]:   Comparaison: "${meetCode}" vs meet_link "${prospect.meet_link}"`);
        if (meetCode && (prospect.meet_link.includes(meetCode) || meetUrl.includes(prospect.meet_link))) {
          console.log('Ultron [BUG2]: ✅ MATCH par meet_link:', prospect.prenom || prospect.firstName, prospect.nom || prospect.lastName);
          return prospect;
        }
      }
    }
    console.log('Ultron [BUG2]: Aucun match par meet_link');
  }

  // 2. Essayer de matcher par le titre du meeting (via le titre du tab)
  console.log('Ultron [BUG2]: Recherche par titre du tab...');
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const meetTab = tabs.find(t => t.url?.includes('meet.google.com'));

    console.log('Ultron [BUG2]: Tab Meet trouvé:', meetTab ? 'OUI' : 'NON');

    if (meetTab && meetTab.title) {
      const meetingTitle = meetTab.title.toLowerCase();
      console.log('Ultron [BUG2]: Titre du tab:', meetTab.title);
      console.log('Ultron [BUG2]: Titre normalisé:', meetingTitle);

      for (const prospect of prospects) {
        const firstName = (prospect.prenom || prospect.firstName || '').toLowerCase();
        const lastName = (prospect.nom || prospect.lastName || '').toLowerCase();

        console.log(`Ultron [BUG2]:   Test prospect: prénom="${firstName}", nom="${lastName}"`);

        // Vérifier si le nom du prospect est dans le titre du meeting
        if (firstName && firstName.length > 2 && meetingTitle.includes(firstName)) {
          console.log('Ultron [BUG2]: ✅ MATCH par prénom!', firstName, 'trouvé dans', meetingTitle);
          return prospect;
        }
        if (lastName && lastName.length > 2 && meetingTitle.includes(lastName)) {
          console.log('Ultron [BUG2]: ✅ MATCH par nom!', lastName, 'trouvé dans', meetingTitle);
          return prospect;
        }
      }
      console.log('Ultron [BUG2]: Aucun match par titre');
    } else {
      console.log('Ultron [BUG2]: Pas de titre de tab disponible');
    }
  } catch (error) {
    console.error('Ultron [BUG2]: Erreur recherche par titre:', error);
  }

  console.log('Ultron [BUG2]: ❌ AUCUN PROSPECT TROUVÉ - fallback vers storage');
  console.log('Ultron [BUG2]: === FIN RECHERCHE PROSPECT ===');
  return null;
}

// Event listeners
prospectSelect.addEventListener('change', async (e) => {
  const prospectId = e.target.value;
  if (prospectId) {
    // Gérer les nouveaux événements calendrier
    const selectedOption = e.target.selectedOptions[0];
    const meetLink = selectedOption?.dataset.meetLink;
    const eventDataStr = selectedOption?.dataset.eventData;

    console.log('Ultron [SELECT]: Événement sélectionné ID:', prospectId);
    console.log('Ultron [SELECT]: Meet link:', meetLink || 'AUCUN');

    if (eventDataStr) {
      // Nouveaux événements calendrier
      try {
        const eventData = JSON.parse(eventDataStr);
        console.log('Ultron [SELECT]: Données événement:', eventData);

        // ⭐ NOUVEAU: L'API nous donne directement l'ID Ultron !
        if (eventData.prospectId) {
          console.log('Ultron [BUG2]: ✅ ID Ultron directement disponible:', eventData.prospectId);

          // Stocker l'ID Ultron (pas Calendar!)
          await chrome.storage.local.set({ selectedProspectId: eventData.prospectId });

          // Charger la fiche prospect avec l'ID Ultron
          await loadProspectDetails(eventData.prospectId);

        } else {
          console.log('Ultron [BUG2]: ⚠️ Pas d\'ID Ultron trouvé, affichage événement Calendar seulement');

          // Afficher seulement les infos Calendar
          displayCalendarEventOnly(eventData);
        }

      } catch (error) {
        console.error('Ultron [SELECT]: Erreur parsing event data:', error);
        // Fallback vers l'affichage de l'événement seul
        displayCalendarEventOnly(eventData);
      }
    } else {
      // Ancien système de prospects
      await chrome.storage.local.set({ selectedProspectId: prospectId });
      await loadProspectDetails(prospectId);
    }
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
      console.log('Ultron [SIDEPANEL]: Storage change détecté pour userToken');
      userToken = changes.userToken.newValue;
      if (userToken) {
        console.log('Ultron [SIDEPANEL]: Nouveau token reçu, rechargement...');
        // Masquer le message d'erreur s'il existe
        const errorDiv = document.getElementById('logout-error-message');
        if (errorDiv) errorDiv.remove();

        showMainContent();
        loadProspects();
      } else {
        console.log('Ultron [SIDEPANEL]: Token supprimé, affichage login');
        showLoginRequired();
      }
    }
    if (changes.selectedProspectId && changes.selectedProspectId.newValue) {
      prospectSelect.value = changes.selectedProspectId.newValue;
      loadProspectDetails(changes.selectedProspectId.newValue);
    }
  }
});

// Listen for TOKEN_UPDATED message from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOKEN_UPDATED') {
    console.log('Ultron [SIDEPANEL]: Message TOKEN_UPDATED reçu');
    if (message.token) {
      userToken = message.token;
      // Vérifier l'algo du nouveau token
      try {
        const headerBase64 = userToken.split('.')[0];
        const headerJson = atob(headerBase64);
        const header = JSON.parse(headerJson);
        console.log('Ultron [SIDEPANEL]: Nouveau token algo:', header.alg);
      } catch (e) {}

      // Masquer le message d'erreur s'il existe
      const errorDiv = document.getElementById('logout-error-message');
      if (errorDiv) errorDiv.remove();

      showMainContent();
      loadProspects();
    }
    sendResponse({ success: true });
  }
  return true;
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

// Force logout et afficher message d'erreur
async function forceLogout(message) {
  console.log('Ultron [LOGOUT]: Déconnexion forcée -', message);

  // Effacer le token du storage
  await chrome.storage.local.remove(['userToken', 'selectedProspectId']);
  userToken = null;

  // Afficher le login avec message d'erreur
  showLoginRequired();

  // Afficher le message d'erreur dans l'UI
  const loginRequired = document.getElementById('login-required');
  if (loginRequired) {
    // Ajouter un message d'erreur visible
    let errorDiv = document.getElementById('logout-error-message');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'logout-error-message';
      errorDiv.style.cssText = 'background: #fef2f2; border: 1px solid #ef4444; color: #dc2626; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; text-align: center;';
      loginRequired.insertBefore(errorDiv, loginRequired.firstChild);
    }
    errorDiv.textContent = message;
  }
}

function showMainContent() {
  loginRequired.classList.add('hidden');
  mainContent.classList.remove('hidden');
}

async function loadProspects() {
  // Nouvelle approche: charger les événements Google Calendar au lieu des prospects statiques
  await loadCalendarEvents();
}

async function loadCalendarEvents() {
  const apiUrl = `${ULTRON_API_URL}/api/extension/calendar-events`;
  console.log('Ultron [CALENDAR]: === CHARGEMENT ÉVÉNEMENTS RDV ===');
  console.log('Ultron [CALENDAR]: URL API:', apiUrl);

  try {
    console.log('Ultron [CALENDAR]: Token actuel:', userToken ? 'présent (' + userToken.substring(0, 20) + '...)' : 'ABSENT');

    if (!userToken) {
      // Essayer de récupérer le token du storage
      const stored = await chrome.storage.local.get(['userToken']);
      userToken = stored.userToken;
      console.log('Ultron [CALENDAR]: Token récupéré du storage:', userToken ? 'présent' : 'ABSENT');
    }

    if (!userToken) {
      console.error('Ultron [CALENDAR]: ❌ PAS DE TOKEN - Impossible d\'appeler l\'API');
      throw new Error('Token non disponible - veuillez vous reconnecter');
    }

    // Diagnostic: vérifier l'algorithme du token JWT
    try {
      const headerBase64 = userToken.split('.')[0];
      const headerJson = atob(headerBase64);
      const header = JSON.parse(headerJson);
      console.log('Ultron [TOKEN]: Algorithme JWT:', header.alg);
      if (header.alg !== 'HS256') {
        console.warn('Ultron [TOKEN]: ⚠️ ATTENTION - Token utilise', header.alg, 'mais Supabase attend HS256!');
        console.warn('Ultron [TOKEN]: Ce token n\'est PAS un token Supabase valide.');
        console.warn('Ultron [TOKEN]: Forçage déconnexion pour permettre re-auth...');
        await forceLogout('Token invalide (mauvais type). Veuillez vous reconnecter.');
        return;
      }
    } catch (e) {
      console.log('Ultron [TOKEN]: Impossible de décoder le header JWT:', e.message);
    }

    console.log('Ultron [CALENDAR]: Envoi requête fetch...');
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    console.log('Ultron [CALENDAR]: Réponse reçue - Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ultron [CALENDAR]: ❌ ERREUR API - Status:', response.status);
      console.error('Ultron [CALENDAR]: ❌ ERREUR API - Body:', errorText);

      // Si 401 Unauthorized, forcer la déconnexion
      if (response.status === 401) {
        console.error('Ultron [CALENDAR]: ⚠️ Token rejeté par le serveur - déconnexion forcée');
        await forceLogout('Session expirée ou token invalide. Veuillez vous reconnecter.');
        return;
      }

      // Si Google Calendar non configuré, fallback vers l'ancienne API prospects
      if (response.status === 400 && errorText.includes('Google Calendar non configuré')) {
        console.warn('Ultron [CALENDAR]: ⚠️ Google Calendar non configuré, fallback vers prospects');
        await loadProspectsLegacy();
        return;
      }

      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `Erreur ${response.status}`);
      } catch {
        throw new Error(`Erreur ${response.status}: ${errorText.substring(0, 100)}`);
      }
    }

    const data = await response.json();
    const events = data.events || [];

    console.log('Ultron [CALENDAR]: ✅ Événements RDV reçus:', events.length);
    console.log('Ultron [CALENDAR]: Liste des événements:');
    events.forEach((e, i) => {
      const status = e.isPast ? 'PASSÉ' : 'FUTUR';
      const meetStatus = e.meetLink ? 'MEET ✓' : 'NO MEET';
      console.log(`  ${i + 1}. ${e.prospectName} - ${formatDisplayDate(e.startDate)} (${status}, ${meetStatus})`);
    });

    // Populate select avec les événements
    prospectSelect.innerHTML = '<option value="">Sélectionner un RDV...</option>';
    events.forEach(event => {
      const option = document.createElement('option');
      option.value = event.id;

      // Formater le texte d'affichage
      const dateStr = formatDisplayDate(event.startDate);
      const statusIcon = event.isPast ? '📅' : '🔜';
      const meetIcon = event.meetLink ? ' 🎥' : '';

      option.textContent = `${statusIcon} ${event.prospectName} - ${dateStr}${meetIcon}`;
      option.dataset.meetLink = event.meetLink || '';
      option.dataset.eventData = JSON.stringify(event);

      prospectSelect.appendChild(option);
    });

    // Stocker les événements pour référence
    prospects = events.map(event => ({
      id: event.id,
      prenom: event.prospectName.split(' ')[0] || '',
      nom: event.prospectName.split(' ').slice(1).join(' ') || '',
      firstName: event.prospectName.split(' ')[0] || '',
      lastName: event.prospectName.split(' ').slice(1).join(' ') || '',
      meet_link: event.meetLink,
      date_rdv: formatDisplayDate(event.startDate),
      eventData: event
    }));

    console.log('Ultron [CALENDAR]: === FIN CHARGEMENT ÉVÉNEMENTS RDV ===');

  } catch (error) {
    console.error('Ultron [BUG1]: ❌ EXCEPTION:', error.message);
    console.error('Ultron [BUG1]: Stack:', error.stack);
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

    // 🐛 DEBUG: Log des données prospect complètes
    console.log('Ultron [DEBUG]: Données prospect complètes:', JSON.stringify(currentProspect, null, 2));

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
  // 🐛 DEBUG: Vérifications mapping
  console.log('Ultron [DEBUG]: prospect.revenus =', prospect.revenus, ', prospect.revenus_annuels =', prospect.revenus_annuels);
  console.log('Ultron [DEBUG]: prospect.patrimoine =', prospect.patrimoine, ', prospect.patrimoine_estime =', prospect.patrimoine_estime);
  console.log('Ultron [DEBUG]: prospect.age =', prospect.age);
  console.log('Ultron [DEBUG]: prospect.profession =', prospect.profession, ', prospect.situation_pro =', prospect.situation_pro);

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

    // S'assurer qu'on a le token
    if (!userToken) {
      const stored = await chrome.storage.local.get(['userToken']);
      userToken = stored.userToken;
    }

    if (!userToken) {
      throw new Error('Token non disponible - veuillez vous reconnecter');
    }

    console.log('Ultron: Démarrage transcription avec token:', userToken ? 'présent' : 'ABSENT');

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

// ========================
// CALENDAR HELPER FUNCTIONS
// ========================

/**
 * Format date for display in dropdown
 */
function formatDisplayDate(dateStr) {
  if (!dateStr) return 'Date non définie';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Date invalide';

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Legacy function to load prospects from the old API
 * Used as fallback when Google Calendar is not configured
 */
async function loadProspectsLegacy() {
  const apiUrl = `${ULTRON_API_URL}/api/extension/prospects`;
  console.log('Ultron [LEGACY]: === FALLBACK VERS ANCIENNE API PROSPECTS ===');
  console.log('Ultron [LEGACY]: URL API:', apiUrl);

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ultron [LEGACY]: ❌ ERREUR API - Status:', response.status);
      console.error('Ultron [LEGACY]: ❌ ERREUR API - Body:', errorText);
      throw new Error(`Erreur ${response.status}`);
    }

    const data = await response.json();
    prospects = data.prospects || [];

    console.log('Ultron [LEGACY]: ✅ Prospects legacy reçus:', prospects.length);

    // Populate select avec les prospects legacy
    prospectSelect.innerHTML = '<option value="">Sélectionner un prospect...</option>';
    prospects.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      const name = `${p.prenom || p.firstName || ''} ${p.nom || p.lastName || ''}`.trim();
      const date = p.date_rdv ? ` - ${p.date_rdv}` : ' - Date non définie';
      option.textContent = `${name}${date}`;
      prospectSelect.appendChild(option);
    });

    console.log('Ultron [LEGACY]: === FIN FALLBACK LEGACY ===');

  } catch (error) {
    console.error('Ultron [LEGACY]: ❌ EXCEPTION:', error.message);
    throw error;
  }
}

/**
 * Display event information from Google Calendar
 */
function displayEventInfo(eventData) {
  console.log('Ultron [EVENT]: Affichage infos événement:', eventData.title);

  prospectInfo.classList.remove('hidden');
  tabsSection.classList.remove('hidden');

  // Afficher le nom du prospect extrait de l'événement
  document.getElementById('prospect-name').textContent = eventData.prospectName || 'Prospect';

  // Afficher le statut de l'événement
  const badge = document.getElementById('prospect-badge');
  if (eventData.isPast) {
    badge.className = 'badge badge-gray';
    badge.textContent = '📅 RDV Passé';
  } else {
    badge.className = 'badge badge-green';
    badge.textContent = '🔜 RDV Futur';
  }

  // Afficher les détails de l'événement
  const eventDetails = `
    <div class="prospect-details">
      <div class="detail-row">
        <span class="label">📅 Date & Heure:</span>
        <span class="value">${formatDisplayDate(eventData.startDate)}</span>
      </div>
      <div class="detail-row">
        <span class="label">📝 Titre:</span>
        <span class="value">${eventData.title}</span>
      </div>
      ${eventData.location ? `
      <div class="detail-row">
        <span class="label">📍 Lieu:</span>
        <span class="value">${eventData.location}</span>
      </div>
      ` : ''}
      ${eventData.description ? `
      <div class="detail-row">
        <span class="label">📋 Description:</span>
        <span class="value">${eventData.description.substring(0, 200)}...</span>
      </div>
      ` : ''}
      ${eventData.meetLink ? `
      <div class="detail-row meet-link-row">
        <span class="label">🎥 Google Meet:</span>
        <span class="value">
          <button id="open-meet-btn" class="meet-btn" onclick="openMeetLink('${eventData.meetLink}')">
            Ouvrir le Meet
          </button>
        </span>
      </div>
      ` : ''}
    </div>
  `;

  // Injecter le HTML des détails de l'événement
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => {
    if (content.id === 'prospect-overview') {
      content.innerHTML = eventDetails;
    } else {
      content.innerHTML = '<p class="loading">Recherche des détails prospect en cours...</p>';
    }
  });

  // Stocker l'événement sélectionné
  currentProspect = {
    id: eventData.id,
    prenom: eventData.prospectName.split(' ')[0] || '',
    nom: eventData.prospectName.split(' ').slice(1).join(' ') || '',
    eventData: eventData
  };

  console.log('Ultron [EVENT]: Informations événement affichées');
}

/**
 * Try to find a prospect in the database by name
 */
async function findAndDisplayProspectByName(prospectName) {
  console.log('Ultron [PROSPECT]: Recherche prospect par nom:', prospectName);

  try {
    const response = await fetch(`${ULTRON_API_URL}/api/extension/search-prospect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        query: prospectName,
        searchType: 'name'
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.prospect) {
        console.log('Ultron [PROSPECT]: ✅ Prospect trouvé en base:', data.prospect.prenom, data.prospect.nom);

        // Enrichir les informations avec les données de la base
        currentProspect = { ...currentProspect, ...data.prospect };

        // Afficher les détails complets du prospect
        displayProspectInfo(data.prospect);

        // Charger l'analyse détaillée
        if (data.interactions) {
          await loadDetailedAnalysis(data.prospect, data.interactions);
        }
      } else {
        console.log('Ultron [PROSPECT]: ❌ Aucun prospect trouvé en base pour:', prospectName);
        displayNoProspectFound(prospectName);
      }
    } else {
      console.warn('Ultron [PROSPECT]: Erreur recherche:', response.status);
      displayNoProspectFound(prospectName);
    }
  } catch (error) {
    console.error('Ultron [PROSPECT]: Exception lors recherche:', error);
    displayNoProspectFound(prospectName);
  }
}

/**
 * Display message when no prospect is found in database
 */
function displayNoProspectFound(prospectName) {
  const noProspectMessage = `
    <div class="prospect-details">
      <div class="no-prospect-message">
        <h3>🔍 Prospect non trouvé en base</h3>
        <p>Le prospect "<strong>${prospectName}</strong>" extrait de l'événement calendrier n'a pas été trouvé dans la base de données Ultron.</p>
        <p>Les fonctionnalités d'analyse et de qualification ne seront pas disponibles, mais vous pouvez toujours utiliser la transcription et les suggestions générales.</p>
      </div>
    </div>
  `;

  const overviewContent = document.getElementById('prospect-overview');
  if (overviewContent) {
    overviewContent.innerHTML = noProspectMessage;
  }
}

/**
 * Open Google Meet link in new tab
 */
function openMeetLink(meetLink) {
  console.log('Ultron [MEET]: Ouverture du lien Meet:', meetLink);
  chrome.tabs.create({ url: meetLink });
}

/**
 * Extract prospect name from calendar event title
 */
function extractProspectNameFromTitle(title) {
  if (!title) return '';

  console.log('Ultron [EXTRACT]: Titre original:', title);

  // Remove common prefixes and emojis
  let cleaned = title
    .replace(/^(🤝|📅|🔜|📍|🎥|📞|💼|👥)\s*/g, '') // Remove emojis
    .replace(/^(rdv|rendez-vous|réunion|meeting|call|entretien)\s+(avec\s+)?/i, '') // Remove prefixes
    .replace(/\s*-\s*\d{2}\/\d{2}.*$/g, '') // Remove trailing dates
    .trim();

  console.log('Ultron [EXTRACT]: Titre nettoyé:', cleaned);

  // If nothing left after cleaning, try a different approach
  if (!cleaned) {
    // Look for patterns like "avec [NAME]" or "[NAME] -"
    const withMatch = title.match(/avec\s+([^-\d]+)/i);
    if (withMatch) {
      cleaned = withMatch[1].trim();
    } else {
      // Take everything before first dash or number
      const beforeDash = title.split(/\s*[-–—]\s*/)[0];
      const beforeNumber = beforeDash.split(/\s*\d/)[0];
      cleaned = beforeNumber.replace(/^(🤝|📅|🔜|📍|🎥|📞|💼|👥)\s*/g, '').trim();
    }
  }

  console.log('Ultron [EXTRACT]: Nom prospect final:', cleaned);
  return cleaned || title;
}

/**
 * Load prospect from calendar event by searching in Ultron database
 */
async function loadProspectFromCalendarEvent(event) {
  console.log('Ultron [CALENDAR]: === CHARGEMENT PROSPECT DEPUIS ÉVÉNEMENT ===');
  console.log('Ultron [CALENDAR]: Événement:', event.title);

  // 1. Extraire le nom du prospect depuis le titre
  const prospectName = extractProspectNameFromTitle(event.title);
  console.log('Ultron [CALENDAR]: Nom prospect extrait:', prospectName);

  if (!prospectName || prospectName.length < 2) {
    console.log('Ultron [CALENDAR]: ⚠️ Nom prospect trop court, affichage événement seul');
    displayCalendarEventOnly(event);
    return;
  }

  // 2. Rechercher le prospect en base Ultron
  try {
    console.log('Ultron [CALENDAR]: Recherche en base...');
    const searchUrl = `${ULTRON_API_URL}/api/extension/search-prospect?query=${encodeURIComponent(prospectName)}`;

    const searchResponse = await fetch(searchUrl, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    console.log('Ultron [CALENDAR]: Réponse recherche - Status:', searchResponse.status);

    if (searchResponse.ok) {
      const data = await searchResponse.json();
      console.log('Ultron [CALENDAR]: Données reçues:', data);

      if (data.prospect && data.prospect.id) {
        // 3. On a trouvé le prospect Ultron !
        const ultronProspectId = data.prospect.id; // UUID Ultron
        console.log('Ultron [CALENDAR]: ✅ Prospect Ultron trouvé:', ultronProspectId);
        console.log('Ultron [CALENDAR]: Détails:', data.prospect.prenom, data.prospect.nom);

        // 4. Enrichir currentProspect avec les données Calendar + Ultron
        currentProspect = {
          ...data.prospect,
          calendarEvent: event,
          meetLink: event.meetLink
        };

        // 5. Stocker l'ID Ultron dans storage (pas l'ID Calendar!)
        await chrome.storage.local.set({ selectedProspectId: ultronProspectId });
        console.log('Ultron [BUG2]: ✅ ID Ultron stocké en storage:', ultronProspectId);

        // 6. Charger la fiche complète avec l'ID Ultron
        console.log('Ultron [CALENDAR]: Chargement fiche complète...');
        await loadProspectDetails(ultronProspectId);
        return;
      } else {
        console.log('Ultron [CALENDAR]: ❌ Aucun prospect trouvé en base');
      }
    } else {
      const errorText = await searchResponse.text();
      console.log('Ultron [CALENDAR]: ❌ Erreur recherche:', searchResponse.status, errorText);
    }
  } catch (error) {
    console.log('Ultron [CALENDAR]: ❌ Exception recherche:', error.message);
  }

  // Fallback : afficher les infos Calendar sans enrichissement
  console.log('Ultron [CALENDAR]: ⚠️ Prospect non trouvé en base, affichage infos Calendar uniquement');
  displayCalendarEventOnly(event);
}

/**
 * Display calendar event info when prospect is not found in database
 */
function displayCalendarEventOnly(event) {
  console.log('Ultron [CALENDAR]: Affichage événement Calendar seul');

  prospectInfo.classList.remove('hidden');
  tabsSection.classList.remove('hidden');

  // Afficher le nom extrait de l'événement
  const prospectName = extractProspectNameFromTitle(event.title);
  document.getElementById('prospect-name').textContent = prospectName || 'Prospect';

  // Afficher le statut de l'événement
  const badge = document.getElementById('prospect-badge');
  if (event.isPast) {
    badge.className = 'badge badge-gray';
    badge.textContent = '📅 RDV Passé';
  } else {
    badge.className = 'badge badge-green';
    badge.textContent = '🔜 RDV Futur';
  }

  // Afficher les détails de l'événement uniquement
  const eventDetails = `
    <div class="prospect-details">
      <div class="info-section">
        <h3>📅 Informations Événement</h3>
        <div class="detail-row">
          <span class="label">Titre:</span>
          <span class="value">${event.title}</span>
        </div>
        <div class="detail-row">
          <span class="label">Date & Heure:</span>
          <span class="value">${formatDisplayDate(event.startDate)}</span>
        </div>
        ${event.location ? `
        <div class="detail-row">
          <span class="label">Lieu:</span>
          <span class="value">${event.location}</span>
        </div>
        ` : ''}
        ${event.meetLink ? `
        <div class="detail-row meet-link-row">
          <span class="label">🎥 Google Meet:</span>
          <span class="value">
            <button onclick="openMeetLink('${event.meetLink}')" class="meet-btn">
              Rejoindre le meeting
            </button>
          </span>
        </div>
        ` : ''}
      </div>

      <div class="info-section">
        <h3>⚠️ Prospect non trouvé</h3>
        <p>Le prospect "<strong>${prospectName}</strong>" n'a pas été trouvé dans la base de données Ultron.</p>
        <p>Vous pouvez toujours utiliser les fonctionnalités générales de transcription et d'analyse.</p>
      </div>
    </div>
  `;

  // Injecter le HTML dans l'onglet overview
  const overviewContent = document.getElementById('prospect-overview');
  if (overviewContent) {
    overviewContent.innerHTML = eventDetails;
  }

  // Vider les autres onglets
  const otherTabs = ['prospect-analysis', 'prospect-interactions'];
  otherTabs.forEach(tabId => {
    const tab = document.getElementById(tabId);
    if (tab) {
      tab.innerHTML = '<p class="loading">Informations non disponibles (prospect non trouvé en base)</p>';
    }
  });

  // Stocker l'événement comme prospect temporaire
  currentProspect = {
    id: event.id,
    prenom: prospectName.split(' ')[0] || '',
    nom: prospectName.split(' ').slice(1).join(' ') || prospectName,
    calendarEvent: event,
    meetLink: event.meetLink,
    isCalendarOnly: true
  };

  console.log('Ultron [CALENDAR]: ✅ Événement Calendar affiché sans enrichissement');
}
