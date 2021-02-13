chrome.runtime.onInstalled.addListener(function (details) {
  // Show welcome page after an update
  chrome.storage.sync.get({
    version: '0'
  }, function (data) {
    // Show welcome page after an update
    if (data.version != chrome.runtime.getManifest().version) {
      // Open welcome page
      chrome.tabs.create({ 'url': chrome.extension.getURL('welcome.html') })
      // Set version number
      chrome.storage.sync.set({
        version: chrome.runtime.getManifest().version
      })
    }

  })
})

// Open settings page when the Peek toolbar button is clicked
chrome.browserAction.onClicked.addListener(function () {
  chrome.tabs.create({
    url: chrome.extension.getURL('settings.html')
  })
})

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.method == 'changeIcon') {
    if ((request == undefined) || (request.key == 0)) {
      chrome.browserAction.setBadgeText({ text: '' })
    } else {
      chrome.browserAction.setBadgeText({ text: request.key })
    }
  } else if (request.method == 'resetIcon') {
    chrome.browserAction.setBadgeText({ text: '' })
  } else {
    sendResponse({})
  }
})

chrome.tabs.onActivated.addListener(function (tabId, changeInfo, tab) {
  // Check number of previews from contentscript.js whenever tab changes
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    try {
      chrome.tabs.sendMessage(tabs[0].id, { method: 'getPreviews' }, function (response) {
        if ((response == undefined) || (response.data == 0)) {
          chrome.browserAction.setBadgeText({ text: '' })
        } else {
          chrome.browserAction.setBadgeText({ text: response.data })
        }
      })
    } catch {
      // Silently fail if communication can't be established with the content script
      chrome.browserAction.setBadgeText({ text: '' })
    }
  })
})