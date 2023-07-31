chrome.runtime.onInstalled.addListener(async (details) => {
  // Show welcome message
  if (details.reason === 'install' || details.reason === 'update') {
    chrome.tabs.create({ 'url': chrome.runtime.getURL('welcome.html') });
  };
});

// Change preview count on action bar based on messages from peek.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.method === 'changeIcon') {
    if (!message || message.key === 0) {
      chrome.action.setBadgeText({ text: '' });
    } else {
      chrome.action.setBadgeText({ text: message.key });
    }
  } else if (message.method === 'resetIcon') {
    chrome.action.setBadgeText({ text: '' });
  } else if (message.method === 'openWindow') {
    chrome.windows.create({
      url: message.key,
      width: 800,
      height: 800,
      left: 50,
      top: 50,
      type: 'popup'
    });
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