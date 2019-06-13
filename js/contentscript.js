// Create array for rendered URLs on the page
var renderedPreviews = []

// Reset badge icon
chrome.runtime.sendMessage({ method: 'resetIcon', key: '' })

// Allow background.js to check number of rendered previews
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

  if (request.method == 'getPreviews') {
    sendResponse({ data: renderedPreviews.length.toString() })
  }

})

function log(string) {

 console.log("%c[Peek] " + string, "color: #4078c0")

}

// Prevent mixed protocol alerts in Chrome
function checkProtocol(url) {
  if (url.includes('https:')) {
    // HTTPS link on HTTP and HTTPS pages
    return true
  } else if (url.includes('http:') && window.location.protocol === 'http:') {
    // HTTP link on HTTP page
    return true
  } else {
    // Insecure mixed protocol
    return false
  }
}

// Find the full path of a given URL
function processURL(url) {
  var img = document.createElement('img')
  img.src = url
  url = img.src
  img.src = null
  // Don't continue if checkProtocol returns false
  if (checkProtocol(url)) {
    // Don't continue if the link already has a tooltip, or if the link is a page on Wikimedia
    if ((renderedPreviews.includes(url)) || (url.includes('commons.wikimedia.org/wiki/File:'))) {
      return null
    } else {
      renderedPreviews.push(url)
      chrome.runtime.sendMessage({ method: "changeIcon", key: renderedPreviews.length.toString() })
      return url
    }
  } else {
    log('Cannot generate a preview for ' + url + ' because it is not served over HTTPS.')
    return 'invalid'
  }
}

// Show preview for invalid URL/mixed content warning
function createErrorPreview(object) {
  // TODO: Make this an actual preview
}

function previewVideo(object) {
  var url = DOMPurify.sanitize(object.getAttribute('href'))
  url = processURL(url)
  if (url === 'invalid') {
    // Show error message
    createErrorPreview(object)
  } else {
    log('Found video link: ' + url)
    // TODO
  }
}

function previewAudio(object) {
  var url = DOMPurify.sanitize(object.getAttribute('href'))
  url = processURL(url)
  if (url === 'invalid') {
    // Show error message
    createErrorPreview(object)
  } else {
    log('Found audio link: ' + url)
    // TODO
  }
}

function previewDocument(object) {
  var url = DOMPurify.sanitize(object.getAttribute('href'))
  url = processURL(url)
  if (url === 'invalid') {
    // Show error message
    createErrorPreview(object)
  } else {
    log('Found document link: ' + url)
    // TODO
  }
}

function previewPDF(object) {
  var url = DOMPurify.sanitize(object.getAttribute('href'))
  url = processURL(url)
  if (url === 'invalid') {
    // Show error message
    createErrorPreview(object)
  } else {
    log('Found PDF link: ' + url)
    // TODO
  }
}

function previewGoogleDocs(object) {
  var url = DOMPurify.sanitize(object.getAttribute('href'))
  url = processURL(url)
  if (url === 'invalid') {
    // Show error message
    createErrorPreview(object)
  } else {
    log('Found Google Docs link: ' + url)
    // TODO
  }
}

// Detect links for previews
function loadDOM() {

  // Video links
  var videoLinks = [
    'a[href$=".webm"]',
    'a[href$=".mp4"]',
    'a[href$=".m4v"]',
    'a[href$=".ogg"]',
    'a[href$=".ogv"]',
  ]

  // Audio links
  var audioLinks = [
    'a[href$=".mp3"]',
    'a[href$=".m4a"]',
    'a[href$=".oga"]',
    'a[href$=".wav"]',
  ]

  // Document links
  var docLinks = [
    'a[href$=".doc"]',
    'a[href$=".docx"]',
    'a[href$=".xls"]',
    'a[href$=".xlsx"]',
    'a[href$=".ppt"]',
    'a[href$=".pptx"]',
    'a[href$=".rtf"]',
  ]

  // PDF links
  var pdfLinks = ['a[href$=".pdf"]']

  // Google Docs links
  var googleLinks = ['a[href^="https://docs.google.com/d"],a[href^="https://drive.google.com/open"]']

  // Generate previews
  document.querySelectorAll(videoLinks.toString()).forEach(function (link) {
    previewVideo(link)
  })
  document.querySelectorAll(audioLinks.toString()).forEach(function (link) {
    previewAudio(link)
  })
  document.querySelectorAll(docLinks.toString()).forEach(function (link) {
    previewDocument(link)
  })
  document.querySelectorAll(pdfLinks.toString()).forEach(function (link) {
    previewPDF(link)
  })
  document.querySelectorAll(googleLinks.toString()).forEach(function (link) {
    previewGoogleDocs(link)
  })

}

// Initialize Peek on page load
loadDOM()