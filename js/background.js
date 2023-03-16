chrome.runtime.onInstalled.addListener(async (details) => {
  // Show welcome message
  if (details.reason === 'install' || details.reason === 'update') {
    chrome.tabs.create({ 'url': chrome.runtime.getURL('welcome.html') });
  };
});

// Open settings page when the Peek toolbar button is clicked
chrome.action.onClicked.addListener(function () {
  chrome.runtime.openOptionsPage();
});

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

chrome.tabs.onActivated.addListener((tab) => {
  // Check number of previews from peek.js whenever tab changes
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    try {
      chrome.tabs.sendMessage(tabs[0].id, { method: 'getPreviews' }, (response) => {
        console.log(response)
        if (!response || response.data === 0) {
          chrome.action.setBadgeText({ text: '' });
        } else {
          chrome.action.setBadgeText({ text: response.data });
        }
      });
    } catch {
      // Silently fail if communication can't be established with the content script
      chrome.action.setBadgeText({ text: '' });
    }
  });
});