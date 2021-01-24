// Read settings from storage
chrome.storage.sync.get({
  docViewer: 'google'
}, function (data) {
  document.querySelector('#docviewer input[value="' + data.docViewer + '"]').checked = true
})

// Save settings after any input change
document.querySelectorAll('input').forEach(function(el) {
  el.addEventListener('change', function() {
    chrome.storage.sync.set({
      docViewer: document.querySelector('#docviewer input:checked').value
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