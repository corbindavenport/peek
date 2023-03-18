// Read settings from storage
chrome.storage.sync.get({
  docViewer: 'google',
}, function (data) {
  // Document viewer
  document.querySelector('#doc-viewer').value = data.docViewer;
});

// Save settings after any input change
document.querySelectorAll('input,select').forEach(function (el) {
  el.addEventListener('change', function () {
    chrome.storage.sync.set({
      // Document viewer
      docViewer: document.querySelector('#doc-viewer').value,
    })
  })
})