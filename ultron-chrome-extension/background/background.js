// Background service worker for Ultron Meeting Assistant

chrome.runtime.onInstalled.addListener(() => {
  console.log('Ultron Meeting Assistant v2.2.0 installed');

  // Enable side panel
  chrome.sidePanel.setOptions({
    enabled: true,
  });

  // Set default for auto-open
  chrome.storage.local.get(['autoPanel'], (result) => {
    if (result.autoPanel === undefined) {
      chrome.storage.local.set({ autoPanel: true });
    }
  });
});

// Handle messages for opening side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_SIDE_PANEL') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ tabId: tabs[0].id })
          .then(() => sendResponse({ success: true }))
          .catch((err) => sendResponse({ success: false, error: err.message }));
      } else {
        sendResponse({ success: false, error: 'No active tab' });
      }
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'OPEN_SIDE_PANEL_WITH_PROSPECT') {
    // Store the prospect ID to be loaded in side panel
    chrome.storage.local.set({ selectedProspectId: message.prospectId });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ tabId: tabs[0].id })
          .then(() => sendResponse({ success: true }))
          .catch((err) => sendResponse({ success: false, error: err.message }));
      } else {
        sendResponse({ success: false, error: 'No active tab' });
      }
    });
    return true;
  }
});

// Listen for tab updates to detect Google Meet and auto-open side panel
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('meet.google.com')) {
    // Check if user is logged in and auto-open is enabled
    const stored = await chrome.storage.local.get(['userToken', 'autoPanel']);

    console.log('Ultron: Google Meet detected, autoPanel:', stored.autoPanel, 'userToken:', !!stored.userToken);

    if (stored.userToken && stored.autoPanel !== false) {
      // Small delay to ensure page is fully loaded
      setTimeout(() => {
        console.log('Ultron: Opening side panel...');
        chrome.sidePanel.open({ tabId: tabId }).catch((err) => {
          console.log('Ultron: Could not auto-open side panel:', err.message);
        });
      }, 1500);
    }
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TOKEN') {
    chrome.storage.local.get(['userToken'], (result) => {
      sendResponse({ token: result.userToken });
    });
    return true; // Keep channel open for async response
  }

  // UNIFIED TAB CAPTURE METHOD - Get stream ID for getUserMedia
  if (message.type === 'GET_TAB_MEDIA_STREAM_ID') {
    if (!sender.tab?.id) {
      console.error('Ultron Background: No tab ID for capture request');
      sendResponse({ error: 'No tab ID available' });
      return true;
    }

    console.log('Ultron Background: Requesting stream ID for tab', sender.tab.id);

    chrome.tabCapture.getMediaStreamId(
      { targetTabId: sender.tab.id },
      (streamId) => {
        if (chrome.runtime.lastError) {
          console.error('Ultron Background: Failed to get stream ID:', chrome.runtime.lastError.message);
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }

        if (!streamId) {
          console.error('Ultron Background: No stream ID returned');
          sendResponse({ error: 'No stream ID returned from Chrome' });
          return;
        }

        console.log('Ultron Background: Successfully got stream ID:', streamId);
        sendResponse({ streamId });
      }
    );

    return true; // Keep channel open for async response
  }
});
