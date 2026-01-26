const ULTRON_API_URL = 'https://ultron-murex.vercel.app';

// State
let isLoggedIn = false;
let userToken = null;
let userEmail = null;

// DOM Elements
const loginSection = document.getElementById('login-section');
const loggedSection = document.getElementById('logged-section');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginError = document.getElementById('login-error');
const userEmailSpan = document.getElementById('user-email');
const meetStatus = document.getElementById('meet-status');
const meetHint = document.getElementById('meet-hint');
const prospectsList = document.getElementById('prospects-list');
const autoPanelCheckbox = document.getElementById('auto-panel');

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  const stored = await chrome.storage.local.get(['userToken', 'userEmail', 'autoPanel', 'transcriptionEnabled']);

  if (stored.userToken && stored.userEmail) {
    isLoggedIn = true;
    userToken = stored.userToken;
    userEmail = stored.userEmail;
    showLoggedInUI();
    loadProspects();
  }

  autoPanelCheckbox.checked = stored.autoPanel !== false;

  // Check if on Google Meet
  checkMeetStatus();
});

// Event listeners
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
autoPanelCheckbox.addEventListener('change', saveSettings);

async function handleLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    loginError.textContent = 'Veuillez remplir tous les champs';
    return;
  }

  loginBtn.textContent = 'Connexion...';
  loginBtn.disabled = true;
  loginError.textContent = '';

  try {
    const response = await fetch(`${ULTRON_API_URL}/api/auth/extension-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok && data.token) {
      userToken = data.token;
      userEmail = email;
      isLoggedIn = true;

      // Vérifier que c'est bien un token Supabase (HS256)
      try {
        const headerBase64 = userToken.split('.')[0];
        const headerJson = atob(headerBase64);
        const header = JSON.parse(headerJson);
        console.log('Ultron [LOGIN]: Token reçu - Algorithme:', header.alg);
        if (header.alg !== 'HS256') {
          console.error('Ultron [LOGIN]: ⚠️ ERREUR - Token non-Supabase reçu! Algo:', header.alg);
        } else {
          console.log('Ultron [LOGIN]: ✅ Token Supabase valide (HS256)');
        }
      } catch (e) {
        console.log('Ultron [LOGIN]: Impossible de décoder le token:', e.message);
      }

      console.log('Ultron [LOGIN]: Sauvegarde token dans storage...');
      await chrome.storage.local.set({ userToken, userEmail });
      console.log('Ultron [LOGIN]: ✅ Token sauvegardé');

      showLoggedInUI();
      loadProspects();

      // Notifier le sidepanel et le content script du nouveau token
      try {
        console.log('Ultron [LOGIN]: Broadcast TOKEN_UPDATED...');
        // Broadcast à tous les contextes de l'extension
        chrome.runtime.sendMessage({ type: 'TOKEN_UPDATED', token: userToken });

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && tab.url.includes('meet.google.com')) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'USER_LOGGED_IN',
            token: userToken,
          });
        }
      } catch (e) {
        console.log('Ultron [LOGIN]: Notification broadcast:', e.message);
      }
    } else {
      loginError.textContent = data.error || 'Erreur de connexion';
    }
  } catch (error) {
    loginError.textContent = 'Erreur de connexion au serveur';
  }

  loginBtn.textContent = 'Se connecter';
  loginBtn.disabled = false;
}

async function handleLogout() {
  await chrome.storage.local.remove(['userToken', 'userEmail']);
  isLoggedIn = false;
  userToken = null;
  userEmail = null;
  showLoginUI();
}

function showLoggedInUI() {
  loginSection.classList.add('hidden');
  loggedSection.classList.remove('hidden');
  userEmailSpan.textContent = userEmail;
}

function showLoginUI() {
  loginSection.classList.remove('hidden');
  loggedSection.classList.add('hidden');
  emailInput.value = '';
  passwordInput.value = '';
}

async function checkMeetStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url && tab.url.includes('meet.google.com')) {
      meetStatus.textContent = 'Sur Google Meet';
      meetStatus.classList.add('active');
      meetStatus.classList.remove('inactive');
      meetHint.classList.remove('hidden');
    } else {
      meetStatus.textContent = 'Pas sur Google Meet';
      meetStatus.classList.add('inactive');
      meetStatus.classList.remove('active');
      meetHint.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error checking meet status:', error);
  }
}

function openPreparePopup(prospectId) {
  // Open in a small popup window instead of full tab
  chrome.windows.create({
    url: `${ULTRON_API_URL}/meeting/prepare/${prospectId}`,
    type: 'popup',
    width: 450,
    height: 700,
    left: 100,
    top: 100,
  });
}

async function loadProspects() {
  // Nouvelle approche: charger les événements Google Calendar au lieu des prospects statiques
  await loadCalendarEvents();
}

async function loadCalendarEvents() {
  const apiUrl = `${ULTRON_API_URL}/api/extension/calendar-events`;
  console.log('Ultron [POPUP]: === CHARGEMENT ÉVÉNEMENTS RDV ===');
  console.log('Ultron [POPUP]: URL API:', apiUrl);

  try {
    console.log('Ultron [POPUP]: Token actuel:', userToken ? 'présent (' + userToken.substring(0, 20) + '...)' : 'ABSENT');

    if (!userToken) {
      console.error('Ultron [POPUP]: ❌ PAS DE TOKEN - Impossible d\'appeler l\'API');
      throw new Error('Token non disponible - veuillez vous reconnecter');
    }

    console.log('Ultron [POPUP]: Envoi requête fetch...');
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    console.log('Ultron [POPUP]: Réponse reçue - Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ultron [POPUP]: ❌ ERREUR API - Status:', response.status);
      console.error('Ultron [POPUP]: ❌ ERREUR API - Body:', errorText);

      // Si Google Calendar non configuré, fallback vers l'ancienne API prospects
      if (response.status === 400 && errorText.includes('Google Calendar non configuré')) {
        console.warn('Ultron [POPUP]: ⚠️ Google Calendar non configuré, fallback vers prospects');
        await loadProspectsLegacy();
        return;
      }

      throw new Error(`Erreur ${response.status}`);
    }

    const data = await response.json();
    const events = data.events || [];

    console.log('Ultron [POPUP]: ✅ Événements RDV reçus:', events.length);
    console.log('Ultron [POPUP]: Liste des événements:');
    events.forEach((e, i) => {
      const status = e.isPast ? 'PASSÉ' : 'FUTUR';
      const meetStatus = e.meetLink ? 'MEET ✓' : 'NO MEET';
      console.log(`  ${i + 1}. ${e.prospectName} - ${formatDisplayDate(e.startDate)} (${status}, ${meetStatus})`);
    });

    // Afficher les événements dans le popup
    displayEventsInPopup(events);

    console.log('Ultron [POPUP]: === FIN CHARGEMENT ÉVÉNEMENTS RDV ===');

  } catch (error) {
    console.error('Ultron [POPUP]: ❌ EXCEPTION:', error.message);
    console.log('Ultron [POPUP]: Fallback vers l\'ancienne API prospects');
    await loadProspectsLegacy();
  }
}

/**
 * Legacy function to load prospects from the old API
 * Used as fallback when Google Calendar is not configured
 */
async function loadProspectsLegacy() {
  const apiUrl = `${ULTRON_API_URL}/api/extension/prospects`;
  console.log('Ultron [POPUP-LEGACY]: === FALLBACK VERS ANCIENNE API PROSPECTS ===');

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('API Error');
    }

    const data = await response.json();

    if (data.prospects && data.prospects.length > 0) {
      prospectsList.innerHTML = '';

      data.prospects.forEach(p => {
        const div = document.createElement('div');
        div.className = 'prospect-item';
        div.innerHTML = `
          <div>
            <div class="name">${p.prenom || p.firstName || ''} ${p.nom || p.lastName || ''}</div>
            <div class="date">${p.date_rdv || 'Date non definie'}</div>
          </div>
          <button class="prep-btn">Ouvrir</button>
        `;

        // Add event listener properly
        const btn = div.querySelector('.prep-btn');
        btn.addEventListener('click', async () => {
          // Open side panel with this prospect selected
          chrome.runtime.sendMessage({
            type: 'OPEN_SIDE_PANEL_WITH_PROSPECT',
            prospectId: p.id,
          }, (response) => {
            if (response && response.success) {
              window.close();
            } else {
              // Fallback: open in popup window if side panel fails
              openPreparePopup(p.id);
            }
          });
        });

        prospectsList.appendChild(div);
      });
    } else {
      prospectsList.innerHTML = '<p class="loading">Aucun RDV prevu</p>';
    }

    console.log('Ultron [POPUP-LEGACY]: === FIN FALLBACK LEGACY ===');

  } catch (error) {
    console.error('Ultron [POPUP-LEGACY]: ❌ EXCEPTION:', error.message);
    prospectsList.innerHTML = '<p class="loading">Erreur de chargement</p>';
  }
}

async function saveSettings() {
  await chrome.storage.local.set({
    autoPanel: autoPanelCheckbox.checked,
  });
}

// ========================
// CALENDAR HELPER FUNCTIONS
// ========================

/**
 * Format date for display in popup
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
 * Display calendar events in popup with enhanced UI
 */
function displayEventsInPopup(events) {
  if (!events || events.length === 0) {
    prospectsList.innerHTML = '<p class="loading">Aucun RDV trouvé dans le calendrier</p>';
    return;
  }

  prospectsList.innerHTML = '';

  events.forEach(event => {
    const div = document.createElement('div');
    div.className = 'prospect-item';

    // Formater l'affichage avec icônes
    const isFuture = !event.isPast;
    const hasMeet = !!event.meetLink;

    const statusIcon = isFuture ? '🔜' : '📅';
    const meetIcon = hasMeet ? ' 🎥' : '';
    const dateStr = formatDisplayDate(event.startDate);

    div.innerHTML = `
      <div>
        <div class="name">${statusIcon} ${event.prospectName}${meetIcon}</div>
        <div class="date">${dateStr}</div>
      </div>
      <button class="prep-btn" data-event-id="${event.id}" data-meet-link="${event.meetLink || ''}" data-prospect-name="${event.prospectName}">
        ${hasMeet ? 'Ouvrir Meet' : 'Ouvrir'}
      </button>
    `;

    // Add event listener with enhanced functionality
    const btn = div.querySelector('.prep-btn');
    btn.addEventListener('click', async () => {
      const meetLink = btn.dataset.meetLink;
      const prospectName = btn.dataset.prospectName;
      const eventId = btn.dataset.eventId;

      // Si l'événement a un lien Google Meet, l'ouvrir directement
      if (meetLink && meetLink !== '') {
        console.log('Ultron [POPUP]: Ouverture du lien Meet:', meetLink);
        chrome.tabs.create({ url: meetLink });
        window.close();
        return;
      }

      // Sinon, essayer d'ouvrir le side panel ou fallback
      try {
        // Tenter de trouver un prospect correspondant en base pour le side panel
        const searchResponse = await fetch(`${ULTRON_API_URL}/api/extension/search-prospect`, {
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

        let prospectId = null;
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          prospectId = searchData.prospect?.id;
        }

        if (prospectId) {
          // Open side panel with this prospect selected
          chrome.runtime.sendMessage({
            type: 'OPEN_SIDE_PANEL_WITH_PROSPECT',
            prospectId: prospectId,
          }, (response) => {
            if (response && response.success) {
              window.close();
            } else {
              // Fallback: open in popup window if side panel fails
              openPreparePopup(prospectId);
            }
          });
        } else {
          // Prospect non trouvé en base, ouvrir une nouvelle recherche Google
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(prospectName + ' contact')}`;
          chrome.tabs.create({ url: searchUrl });
          window.close();
        }
      } catch (error) {
        console.error('Ultron [POPUP]: Erreur lors de l\'ouverture:', error);
        // Fallback final: recherche Google
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(prospectName)}`;
        chrome.tabs.create({ url: searchUrl });
        window.close();
      }
    });

    prospectsList.appendChild(div);
  });

  console.log('Ultron [POPUP]: ✅ Événements affichés dans le popup:', events.length);
}
