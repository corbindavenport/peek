// Create array for rendered URLs on the page
var renderedPreviews = []

// Create global doc viewer setting
var docViewer

// Reset badge icon
chrome.runtime.sendMessage({ method: 'resetIcon', key: '' })

// Allow background.js to check number of rendered previews
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.method == 'getPreviews') {
    sendResponse({ data: renderedPreviews.length.toString() })
  }
})

// Function for adding 'Powered by Peek' label to popup HTML
function addToolbar(html) {
  // Get settings gear icon
  var toolbar = '<div class="peek-info-banner">Powered by Peek</div>'
  html += toolbar
  return html
}

// Prevent mixed protocol alerts in Chrome
function checkProtocol(url) {
  if (url.includes('https:')) {
    // HTTPS link on HTTP and HTTPS pages
    return true
  } else if (url.startsWith('http:') && window.location.protocol === 'http:') {
    // HTTP link on HTTP page
    return true
  } else {
    // Insecure mixed protocol
    return false
  }
}

// Find the full path of a given URL
function processURL(url) {
  // Fix relative URLs
  if (url.startsWith('/')) {
    url = window.location.protocol + "//" + window.location.host + url
  }
  // Regex to parse Internet Archive URLs: https://regex101.com/r/4F12w7/3
  var regex = /(?:web\.archive\.org\/web\/)(\d*)(\/)(.*)/
  // Fix Internet Archive links
  if (url.includes('//web.archive.org/')) {
    // Get date
    var date = regex.exec(url)[1]
    // Get original URL
    var originalURL = regex.exec(url)[3]
    // Append '_id' to the end of the date, so the Internet Archive returns the original file and not an HTML file
    url = 'https://web.archive.org/web/' + date + 'id_/' + originalURL
  }
  // Fix Imgur links
  if ((url.includes('http://')) && (url.includes('imgur.com'))) {
    url = url.replace('http://', 'https://')
  }
  // Don't continue if checkProtocol returns false
  if (checkProtocol(url)) {
    // Don't continue if the link already has a tooltip, or if the link is a wiki page
    if ((renderedPreviews.includes(url)) || (url.includes('/wiki/File:'))) {
      return null
    } else {
      // Get full URL
      var img = document.createElement('img')
      img.src = url
      url = img.src
      img.src = null
      // Update toolbar icon and return URL
      renderedPreviews.push(url)
      chrome.runtime.sendMessage({ method: "changeIcon", key: renderedPreviews.length.toString() })
      return url
    }
  } else {
    console.log('Cannot generate a preview for ' + url + ' because it is not served over HTTPS, or it is an invalid URL.')
    return 'invalid'
  }
}

// Show preview for invalid URL/mixed content warning
function createErrorPreview(object) {
  tippy(object, {
    content: 'Peek cannot preview this link because it is served over an insecure connection.',
    arrow: true,
    delay: [500, 500]
  })
}

function previewVideo(object) {
  var url = DOMPurify.sanitize(object.getAttribute('href'))
  url = processURL(url)
  if (url === 'invalid') {
    // Show error message
    createErrorPreview(object)
  } else if (!url) {
    // If the URL is null or otherwise invalid, silently fail
    return
  } else {
    console.log('Found video link: ' + url)
    // Allow playback of Imgur GIFV links
    if ((url.endsWith('.gifv')) && (url.includes("imgur.com"))) {
      url = url.replace(".gifv", ".mp4");
    }
    // Create video player
    var player = '<video controls muted controlsList="nodownload nofullscreen noremoteplayback"><source src="' + url + '"></video>'
    // Add toolbar
    player = addToolbar(player)
    // Create popup
    tippy(object, {
      content: player,
      onShow: function (instance) {
        // Play the video after the popup appears
        videoEl = instance.popper.querySelector('video')
        videoEl.play()
      }
    })
  }
}

function previewAudio(object) {
  var url = DOMPurify.sanitize(object.getAttribute('href'))
  url = processURL(url)
  if (url === 'invalid') {
    // Show error message
    createErrorPreview(object)
  } else if (!url) {
    // If the URL is null or otherwise invalid, silently fail
    return
  } else {
    console.log('Found audio link: ' + url)
    // Create audio player
    var player = '<audio controls controlsList="nodownload nofullscreen noremoteplayback"><source src="' + url + '"></audio>'
    // Add toolbar
    player = addToolbar(player)
    // Create popup
    tippy(object, {
      content: player
    })
  }
}

function previewOfficeDocument(object) {
  var url = DOMPurify.sanitize(object.getAttribute('href'))
  url = processURL(url)
  if (url === 'invalid') {
    // Show error message
    createErrorPreview(object)
  } else if (!url) {
    // If the URL is null or otherwise invalid, silently fail
    return
  } else {
    console.log('Found Office document link: ' + url)
    if (docViewer === 'google') {
      var viewer = '<embed src="https://docs.google.com/gview?url=' + encodeURI(url) + '&embedded=true">'
    } else if (docViewer === 'office') {
      var viewer = '<embed src="https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURI(url) + '">'
    }
    // Add toolbar
    viewer = addToolbar(viewer)
    // Create popup
    tippy(object, {
      content: viewer
    })
  }
}

function previewDocument(object) {
  var url = DOMPurify.sanitize(object.getAttribute('href'))
  url = processURL(url)
  if (url === 'invalid') {
    // Show error message
    createErrorPreview(object)
  } else if (!url) {
    // If the URL is null or otherwise invalid, silently fail
    return
  } else {
    console.log('Found document link: ' + url)
    // Render file with the browser's own viewer
    if (url.toLowerCase().endsWith('.pdf')) {
      // Set options for PDF viewer
      if (navigator.userAgent.includes('Firefox')) {
        var viewer = '<embed src="' + url + '#zoom=page-width">'
      } else {
        var viewer = '<embed src="' + url + '#toolbar=0">'
      }
    } else if (url.toLowerCase().endsWith('.txt')) {
      var viewer = '<embed src="' + url + '">'
    } else {
      var viewer = '<img src="' + url + '">'
    }
    // Add toolbar
    viewer = addToolbar(viewer)
    // Create popup
    tippy(object, {
      content: viewer
    })
  }
}

function previewGoogleDocs(object) {
  var url = DOMPurify.sanitize(object.getAttribute('href'))
  url = processURL(url)
  if (url === 'invalid') {
    // Show error message
    createErrorPreview(object)
  } else if (!url) {
    // If the URL is null or otherwise invalid, silently fail
    return
  } else {
    console.log('Found Google Docs link: ' + url)
    // Regex to find the document ID: https://regex101.com/r/1DciHc/2
    var regex = /(?:(\/d\/)|(\/open\?id=)|(srcid=))(?<docsId>.*?)(?:(\/)|(\&)|($))/
    var docId = regex.exec(url)['groups']['docsId']
    // Render the popup
    if (docId) {
      // Create embed
      var viewer = '<embed src="https://docs.google.com/viewer?srcid=' + docId + '&pid=explorer&efh=false&a=v&chrome=false&embedded=true">'
      // Add toolbar
      viewer = addToolbar(viewer)
      // Create popup
      tippy(object, {
        content: viewer
      })
    } else {
      renderedPreviews.splice(renderedPreviews.indexOf(url), 1)
      chrome.runtime.sendMessage({ method: 'changeIcon', key: renderedPreviews.length.toString() })
    }
  }
}

function previewiCloud(object) {
  var url = DOMPurify.sanitize(object.getAttribute('href'))
  url = processURL(url)
  if (url === 'invalid') {
    // Show error message
    createErrorPreview(object)
  } else if (!url) {
    // If the URL is null or otherwise invalid, silently fail
    return
  } else {
    console.log('Found iCloud link: ' + url)
    // Regex to parse iCloud links: https://regex101.com/r/IM4eoX/2
    var regex = /(?:(?<type>pages|numbers|keynote))(?:\/)(?<fileId>.*?)(?:\#|\/|$)/
    var app = regex.exec(url)['groups']['type']
    var id = regex.exec(url)['groups']['fileId']
    var viewer = '<embed src="https://www.icloud.com/' + app + '/' + id + '?embed=true">'
    // Add toolbar
    viewer = addToolbar(viewer)
    // Create popup
    tippy(object, {
      content: viewer
    })
  }
}

function previewWebVideo(object) {
  var url = DOMPurify.sanitize(object.getAttribute('href'))
  url = processURL(url)
  if (url === 'invalid') {
    // Show error message
    createErrorPreview(object)
  } else if (!url) {
    // If the URL is null or otherwise invalid, silently fail
    return
  } else if (url.includes('youtube.com/') || url.includes('youtu.be/')) {
    console.log('Found YouTube link: ' + url)
    // Regex to find the video ID: https://regex101.com/r/qFx13n/1
    var regex = /(?:(v?\=)|(youtu.be\/))(?<videoId>.*?)(&|$)/
    var videoId = regex.exec(url)['groups']['videoId']
    // Render the popup
    if (videoId) {
      // Create embed
      var viewer = '<embed class="video-embed" src="https://www.youtube.com/embed/' + videoId + '?autoplay=1&mute=1&fs=0">'
      // Add toolbar
      viewer = addToolbar(viewer)
      // Create popup
      tippy(object, {
        content: viewer
      })
    } else {
      renderedPreviews.splice(renderedPreviews.indexOf(url), 1)
      chrome.runtime.sendMessage({ method: 'changeIcon', key: renderedPreviews.length.toString() })
    }
  }
}

// Detect links for previews
function loadDOM() {

  // Video files
  var videoLinks = [
    'a[href$=".webm"]',
    'a[href$=".WEBM"]',
    'a[href$=".mp4"]',
    'a[href$=".MP4"]',
    'a[href$=".m4v"]',
    'a[href$=".M4V"]',
    'a[href$=".ogg"]',
    'a[href$=".OGG"]',
    'a[href$=".ogv"]',
    'a[href$=".OGV"]',
    'a[href$=".gifv"]',
    'a[href$=".GIFV"]',
  ]

  // Audio files
  var audioLinks = [
    'a[href$=".mp3"]',
    'a[href$=".MP3"]',
    'a[href$=".m4a"]',
    'a[href$=".M4A"]',
    'a[href$=".oga"]',
    'a[href$=".OGA"]',
    'a[href$=".wav"]',
    'a[href$=".WAV"]'
  ]

  // Documents that have to be rendered by the Docs/Office viewer
  var officeLinks = [
    'a[href$=".doc"]',
    'a[href$=".DOC"]',
    'a[href$=".docx"]',
    'a[href$=".DOCX"]',
    'a[href$=".xls"]',
    'a[href$=".XLS"]',
    'a[href$=".xlsx"]',
    'a[href$=".XLSX"]',
    'a[href$=".ppt"]',
    'a[href$=".PPT"]',
    'a[href$=".pptx"]',
    'a[href$=".PPTX"]',
    'a[href$=".rtf"]',
    'a[href$=".RTF"]'
  ]

  // Documents and images that can be rendered by the browser
  var docLinks = [
    'a[href$=".pdf"]',
    'a[href$=".PDF"]',
    'a[href$=".txt"]',
    'a[href$=".TXT"]',
    'a[href$=".jpeg"]',
    'a[href$=".JPEG"]',
    'a[href$=".jpg"]',
    'a[href$=".JPG"]',
    'a[href$=".png"]',
    'a[href$=".PNG"]',
    'a[href$=".apng"]',
    'a[href$=".APNG"]',
    'a[href$=".svg"]',
    'a[href$=".SVG"]',
    'a[href$=".gif"]',
    'a[href$=".GIF"]',
    'a[href$=".ico"]',
    'a[href$=".ICO"]',
    'a[href$=".bmp"]',
    'a[href$=".BMP"]'
  ]

  // Google Docs links
  var googleLinks = [
    'a[href^="https://docs.google.com/d/"]',
    'a[href^="https://docs.google.com/document/d/"]',
    'a[href^="https://docs.google.com/presentation/d/"]',
    'a[href^="https://docs.google.com/spreadsheets/d/"]',
    'a[href^="https://docs.google.com/drawings/d/"]',
    'a[href^="https://docs.google.com/forms/d/"]',
    'a[href^="https://drive.google.com/open"]'
  ]

  // iCloud links (Apple only allows Keynote files to be embedded right now)
  var appleLinks = [
    //'a[href^="https://www.icloud.com/pages/"]',
    //'a[href^="https://www.icloud.com/numbers/"]',
    'a[href^="https://www.icloud.com/keynote/"]',
  ]

  // Video links
  var webVideoLinks = [
    'a[href^="https://www.youtube.com/watch?v="]',
    'a[href^="https://youtu.be/oEkCCHNvel4"]',
  ]

  // Generate previews

  document.querySelectorAll(videoLinks.toString()).forEach(function (link) {
    previewVideo(link)
  })

  document.querySelectorAll(audioLinks.toString()).forEach(function (link) {
    previewAudio(link)
  })

  document.querySelectorAll(officeLinks.toString()).forEach(function (link) {
    previewOfficeDocument(link)
  })

  document.querySelectorAll(docLinks.toString()).forEach(function (link) {
    previewDocument(link)
  })

  document.querySelectorAll(googleLinks.toString()).forEach(function (link) {
    previewGoogleDocs(link)
  })

  document.querySelectorAll(appleLinks.toString()).forEach(function (link) {
    previewiCloud(link)
  })

  document.querySelectorAll(webVideoLinks.toString()).forEach(function (link) {
    previewWebVideo(link)
  })

}

// Initialize Peek on page load
chrome.storage.sync.get({
  docViewer: 'google'
}, function (data) {
  // Read preference for document viewer from settings
  docViewer = data.docViewer
  // Always render previews below link on Firefox, otherwise the positioning is off
  if (navigator.userAgent.includes('Firefox')) {
    var placementSetting = 'bottom'
  } else {
    var placementSetting = 'top'
  }
  // Set defaults for previews
  tippy.setDefaultProps({
    arrow: true,
    allowHTML: true,
    delay: [500, 500],
    interactive: true,
    placement: placementSetting,
    maxWidth: 600,
    maxHeight: 600,
    theme: 'peek'
  })
  // Initialize previews
  loadDOM()
})