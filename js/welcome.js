// Add version number to welcome page
document.querySelector('.version').innerHTML = chrome.runtime.getManifest().version;