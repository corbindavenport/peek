// Read settings from storage
chrome.storage.sync.get({
  docViewer: 'google',
  previewSize: 400,
}, function (data) {
  // Document viewer
  document.querySelector('#doc-viewer').value = data.docViewer
  // Preview size
  document.querySelector('#preview-size').value = data.previewSize
})

// Save settings after any input change
document.querySelectorAll('input,select').forEach(function(el) {
  el.addEventListener('change', function() {
    chrome.storage.sync.set({
      // Document viewer
      docViewer: document.querySelector('#doc-viewer').value,
      // Preview size
      previewSize: document.querySelector('#preview-size').value
    })
  })
})

// Show instructions for leaving a review based on the browser being used
var useragent = navigator.userAgent
var review = document.querySelector('.review-info')
if (useragent.includes("Firefox")) {
	review.innerHTML = 'Leaving a review on the <a href="https://addons.mozilla.org/en-US/firefox/addon/peek-preview/" target="_blank">Firefox add-ons site</a> is also greatly appreciated!'
} else if (useragent.includes("Chrome")) {
	review.innerHTML = 'Leaving a review on the <a href="https://chrome.google.com/webstore/detail/peek/bfpogemllmpcpclnadighnpeeaegigjk" target="_blank">Chrome Web Store</a> is also greatly appreciated!'
}