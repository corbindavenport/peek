chrome.runtime.onInstalled.addListener(async (details) => {
  // Show welcome message
  if (details.reason === 'install' || details.reason === 'update') {
    chrome.tabs.create({ 'url': chrome.runtime.getURL('welcome.html') });
  };
});

// Change preview count on action bar based on requests from peek.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.method === 'changeIcon') {
    if (!request || request.key === 0) {
      chrome.action.setBadgeText({ text: '' });
    } else {
      chrome.action.setBadgeText({ text: request.key });
    }
  } else if (request.method === 'resetIcon') {
    chrome.action.setBadgeText({ text: '' });
  } else {
    sendResponse({});
  }
});

// Check number of previews from peek.js whenever tab changes
chrome.tabs.onActivated.addListener((tab) => {
  chrome.tabs.sendMessage(tab.tabId, { method: 'getPreviews' }, (response) => {
    if (!response || response.data === 0) {
      chrome.action.setBadgeText({ text: '' });
    } else {
      chrome.action.setBadgeText({ text: response.data.toString() });
    }
  });
});