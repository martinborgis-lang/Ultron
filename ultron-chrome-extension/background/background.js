// Background service worker for Ultron Meeting Assistant

chrome.runtime.onInstalled.addListener(() => {
  console.log('Ultron Meeting Assistant v2.1 installed');

  // Enable side panel for Google Meet
  chrome.sidePanel.setOptions({
    enabled: true,
  });
});

// Open side panel when clicking extension icon on Google Meet
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('meet.google.com')) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
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

// Listen for tab updates to detect Google Meet
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('meet.google.com')) {
    // Notify content script
    chrome.tabs.sendMessage(tabId, { type: 'MEET_DETECTED' }).catch(() => {
      // Content script not yet loaded, this is normal
    });
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

  if (message.type === 'START_TAB_CAPTURE') {
    startTabCapture(sender.tab.id)
      .then(streamId => sendResponse({ streamId }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep channel open for async response
  }

  if (message.type === 'STOP_TAB_CAPTURE') {
    // Nothing special needed - content script will stop the stream
    sendResponse({ success: true });
    return true;
  }
});

/**
 * Start capturing tab audio
 * @param {number} tabId - Tab ID to capture
 * @returns {Promise<string>} Stream ID for getUserMedia
 */
async function startTabCapture(tabId) {
  return new Promise((resolve, reject) => {
    // Check if we can capture
    chrome.tabCapture.getCapturedTabs((tabs) => {
      const alreadyCapturing = tabs.some(t => t.tabId === tabId && t.status === 'active');

      if (alreadyCapturing) {
        reject(new Error('Tab is already being captured'));
        return;
      }

      // Start capture
      chrome.tabCapture.capture(
        {
          audio: true,
          video: false,
          audioConstraints: {
            mandatory: {
              chromeMediaSource: 'tab',
            },
          },
        },
        (stream) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (!stream) {
            reject(new Error('Failed to capture tab audio'));
            return;
          }

          // Get the stream ID
          const tracks = stream.getAudioTracks();
          if (tracks.length === 0) {
            reject(new Error('No audio tracks available'));
            return;
          }

          // We need to use a different approach for MV3
          // Create an offscreen document to handle the stream
          createOffscreenAndCapture(stream)
            .then(streamId => resolve(streamId))
            .catch(err => reject(err));
        }
      );
    });
  });
}

/**
 * Create offscreen document for audio processing
 * (Required for Manifest V3)
 */
let offscreenDocumentCreated = false;

async function createOffscreenAndCapture(stream) {
  // For MV3, we need to handle this differently
  // The content script will receive the stream directly through a different mechanism

  // Store stream info for content script to access
  const streamId = `ultron-${Date.now()}`;

  // Since we can't pass the stream directly, we'll use a workaround
  // The content script will use getDisplayMedia or tabCapture directly

  return streamId;
}

// Alternative approach: Use chrome.tabCapture.getMediaStreamId
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TAB_MEDIA_STREAM_ID') {
    if (!sender.tab?.id) {
      sendResponse({ error: 'No tab ID' });
      return true;
    }

    chrome.tabCapture.getMediaStreamId(
      { targetTabId: sender.tab.id },
      (streamId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse({ streamId });
      }
    );

    return true; // Keep channel open for async response
  }
});
