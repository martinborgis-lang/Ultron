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

  // Ajouter bouton side panel si pas déjà présent
  if (!document.getElementById('open-sidepanel-btn')) {
    const sidePanelBtn = document.createElement('button');
    sidePanelBtn.id = 'open-sidepanel-btn';
    sidePanelBtn.className = 'open-sidepanel-btn';
    sidePanelBtn.textContent = '📋 Ouvrir le panneau Ultron';
    sidePanelBtn.style.cssText = `
      width: 100%;
      padding: 12px;
      margin: 10px 0;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    `;

    sidePanelBtn.onmouseover = () => {
      sidePanelBtn.style.transform = 'translateY(-1px)';
      sidePanelBtn.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
    };
    sidePanelBtn.onmouseout = () => {
      sidePanelBtn.style.transform = 'translateY(0)';
      sidePanelBtn.style.boxShadow = 'none';
    };

    sidePanelBtn.onclick = async () => {
      console.log('[popup] 🔥 Bouton side panel cliqué');
      try {
        // Ouvrir le side panel
        await chrome.sidePanel.open({ windowId: (await chrome.windows.getCurrent()).id });
        console.log('[popup] ✅ Side panel ouvert avec succès');

        // Optionnel : ne pas fermer le popup automatiquement
        // Laisser l'utilisateur décider
      } catch (error) {
        console.error('[popup] ❌ Erreur ouverture side panel:', error);
        alert('Impossible d\'ouvrir le panneau. Vérifiez que l\'extension est activée.');
      }
    };

    // Insérer le bouton dans loggedSection après les éléments existants
    loggedSection.appendChild(sidePanelBtn);
  }
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

    // Si warning (ex: session Google expirée) ou 0 événements, fallback vers CRM
    if (data.warning) {
      console.warn('Ultron [POPUP]: ⚠️ Warning API:', data.warning);
    }

    if (events.length === 0) {
      console.log('Ultron [POPUP]: 0 événements Calendar, fallback vers prospects CRM...');
      await loadProspectsLegacy();
      return;
    }

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

      // Essayer de trouver un prospect correspondant en base d'abord
      let prospectId = null;
      try {
        console.log('Ultron [POPUP]: Recherche prospect en base pour:', prospectName);
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

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          prospectId = searchData.prospect?.id;
          console.log('Ultron [POPUP]: Prospect trouvé en base:', prospectId ? 'OUI' : 'NON');
        }
      } catch (error) {
        console.log('Ultron [POPUP]: Erreur recherche prospect:', error.message);
      }

      // Utiliser la nouvelle fonction pour ouvrir le side panel
      await openProspectInSidePanel(prospectId || eventId, prospectName, meetLink);
    });

    prospectsList.appendChild(div);
  });

  console.log('Ultron [POPUP]: ✅ Événements affichés dans le popup:', events.length);
}

/**
 * Open prospect in side panel instead of new window
 */
async function openProspectInSidePanel(prospectId, prospectName, meetLink) {
  console.log('[POPUP] Ouverture side panel pour:', prospectName);
  console.log('[POPUP] Prospect ID:', prospectId);
  console.log('[POPUP] Meet Link:', meetLink || 'AUCUN');

  try {
    // 1. Sauvegarder le prospect sélectionné pour que le side panel le charge
    await chrome.storage.local.set({
      selectedProspectId: prospectId,
      selectedProspectName: prospectName,
      selectedMeetLink: meetLink
    });
    console.log('[POPUP] ✅ Données prospect sauvegardées dans storage');

    // 2. Chercher un onglet Google Meet déjà ouvert
    const tabs = await chrome.tabs.query({ url: 'https://meet.google.com/*' });
    console.log('[POPUP] Onglets Meet trouvés:', tabs.length);

    let sidePanelOpened = false;

    if (tabs.length > 0) {
      // 3a. Si un onglet Meet existe, l'activer et ouvrir le side panel dessus
      const meetTab = tabs[0];
      console.log('[POPUP] Activation de l\'onglet Meet existant:', meetTab.id);

      await chrome.tabs.update(meetTab.id, { active: true });
      await chrome.windows.update(meetTab.windowId, { focused: true });

      try {
        await chrome.sidePanel.open({ tabId: meetTab.id });
        console.log('[POPUP] ✅ Side panel ouvert sur onglet Meet existant');
        sidePanelOpened = true;
      } catch (e) {
        console.log('[POPUP] Side panel erreur:', e.message);
      }
    } else if (meetLink && meetLink !== '') {
      // 3b. Si pas d'onglet Meet mais on a un lien, ouvrir le Meet
      console.log('[POPUP] Création nouvel onglet Meet avec:', meetLink);
      const newTab = await chrome.tabs.create({ url: meetLink });
      console.log('[POPUP] ✅ Nouvel onglet Meet créé:', newTab.id);
      sidePanelOpened = true; // Le side panel s'ouvrira auto via background.js onUpdated

    } else {
      // 3c. Pas de Meet - essayer d'ouvrir sur l'onglet actif
      console.log('[POPUP] ⚠️ Pas de lien Meet, ouverture side panel sur onglet actif');
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab) {
        try {
          await chrome.sidePanel.open({ tabId: activeTab.id });
          console.log('[POPUP] ✅ Side panel ouvert sur onglet actif');
          sidePanelOpened = true;
        } catch (e) {
          console.log('[POPUP] Erreur ouverture side panel:', e.message);
        }
      }
    }

    // Ne fermer le popup QUE si le side panel a été ouvert avec succès
    if (sidePanelOpened) {
      console.log('[POPUP] Fermeture du popup (side panel ouvert)');
      window.close();
    } else {
      console.log('[POPUP] ⚠️ Side panel non ouvert, popup reste affiché');
      // Feedback visuel à l'utilisateur
      const btn = document.querySelector('.prep-btn:focus, .prep-btn:active');
      if (btn) {
        btn.textContent = '⚠️ Ouvrez Meet';
        btn.style.background = '#f59e0b';
        setTimeout(() => {
          btn.textContent = 'Ouvrir';
          btn.style.background = '';
        }, 3000);
      }
    }

  } catch (error) {
    console.error('[POPUP] Erreur openProspectInSidePanel:', error);
    // En cas d'erreur, fallback vers l'ancienne méthode
    if (meetLink) {
      chrome.tabs.create({ url: meetLink });
    }
  }
}
