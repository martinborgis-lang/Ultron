// Background service worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('Ultron Meeting Assistant installed');
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
});
