// Add version number to welcome page
document.querySelector(".version").innerHTML = chrome.runtime.getManifest().version

// Show instructions for leaving a review based on the browser being used
var useragent = navigator.userAgent
var review = document.querySelector('.review-info')
if (useragent.includes("Firefox")) {
	review.innerHTML = 'Leaving a review on the <a href="https://addons.mozilla.org/en-US/firefox/addon/peek-preview/" target="_blank">Firefox add-ons site</a> is also greatly appreciated!'
} else if (useragent.includes("Chrome")) {
	review.innerHTML = 'Leaving a review on the <a href="https://chrome.google.com/webstore/detail/peek/bfpogemllmpcpclnadighnpeeaegigjk" target="_blank">Chrome Web Store</a> is also greatly appreciated!'
}