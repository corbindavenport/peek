chrome.runtime.onInstalled.addListener(function (details) {
  // Show welcome page after an update
  chrome.storage.sync.get({
    version: '0'
  }, function (data) {
    // Show welcome page after an update
    if (data.version != chrome.runtime.getManifest().version) {
      // Open welcome page
      chrome.tabs.create({ 'url': chrome.runtime.getURL('welcome.html') })
      // Set version number
      chrome.storage.sync.set({
        version: chrome.runtime.getManifest().version
      })
    }

  })
})

// Open settings page when the Peek toolbar button is clicked
chrome.action.onClicked.addListener(function () {
  chrome.runtime.openOptionsPage()
})

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.method == 'changeIcon') {
    if ((request == undefined) || (request.key == 0)) {
      chrome.action.setBadgeText({ text: '' })
    } else {
      chrome.action.setBadgeText({ text: request.key })
    }
  } else if (request.method == 'resetIcon') {
    chrome.action.setBadgeText({ text: '' })
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
          chrome.action.setBadgeText({ text: '' })
        } else {
          chrome.action.setBadgeText({ text: response.data })
        }
      })
    } catch {
      // Silently fail if communication can't be established with the content script
      chrome.action.setBadgeText({ text: '' })
    }
  })
})