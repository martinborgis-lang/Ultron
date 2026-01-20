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
const prospectsList = document.getElementById('prospects-list');
const autoPanelCheckbox = document.getElementById('auto-panel');
const transcriptionCheckbox = document.getElementById('transcription-enabled');
const openPanelBtn = document.getElementById('open-panel-btn');

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
  transcriptionCheckbox.checked = stored.transcriptionEnabled || false;

  // Check if on Google Meet
  checkMeetStatus();
});

// Event listeners
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
autoPanelCheckbox.addEventListener('change', saveSettings);
transcriptionCheckbox.addEventListener('change', saveSettings);
openPanelBtn.addEventListener('click', handleOpenPanel);

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

      await chrome.storage.local.set({ userToken, userEmail });

      showLoggedInUI();
      loadProspects();

      // Notify content script if on Google Meet
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && tab.url.includes('meet.google.com')) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'USER_LOGGED_IN',
            token: userToken,
          });
        }
      } catch (e) {
        console.log('Could not notify content script:', e);
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
      // Show open panel button when on Google Meet
      openPanelBtn.classList.remove('hidden');
    } else {
      meetStatus.textContent = 'Pas sur Google Meet';
      meetStatus.classList.add('inactive');
      meetStatus.classList.remove('active');
      openPanelBtn.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error checking meet status:', error);
  }
}

async function handleOpenPanel() {
  try {
    // Open the side panel instead of the injected panel
    chrome.runtime.sendMessage({
      type: 'OPEN_SIDE_PANEL',
    }, (response) => {
      if (response && response.success) {
        window.close();
      } else {
        console.log('Could not open side panel:', response?.error);
        alert('Impossible d\'ouvrir le panneau lateral. Verifiez que vous etes sur Chrome 114+.');
      }
    });
  } catch (error) {
    console.error('Error opening panel:', error);
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
  try {
    const response = await fetch(`${ULTRON_API_URL}/api/extension/prospects`, {
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
          <button class="prep-btn">Preparer</button>
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
  } catch (error) {
    prospectsList.innerHTML = '<p class="loading">Erreur de chargement</p>';
  }
}

async function saveSettings() {
  await chrome.storage.local.set({
    autoPanel: autoPanelCheckbox.checked,
    transcriptionEnabled: transcriptionCheckbox.checked,
  });

  // Notify content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url && tab.url.includes('meet.google.com')) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'SETTINGS_UPDATED',
      autoPanel: autoPanelCheckbox.checked,
      transcriptionEnabled: transcriptionCheckbox.checked,
    });
  }
}
