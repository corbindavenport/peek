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

// Function for logging info
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
  var img = document.createElement('img')
  img.src = url
  url = img.src
  img.src = null
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
    log('Found video link: ' + url)
    // Allow playback of Imgur GIFV links
    if ((url.endsWith('.gifv')) && (url.includes("imgur.com"))) {
			url = url.replace(".gifv", ".mp4");
		}
    // Create video player
    var player = '<video controls muted controlsList="nodownload nofullscreen noremoteplayback"><source src="' + url + '"></video>'
    // Create popup
    tippy(object, {
      content: player,
      interactive: true,
      arrow: true,
      theme: 'peek',
      delay: [500, 500],
      onShow: function(instance) {
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
    log('Found audio link: ' + url)
    // Create audio player
    var player = '<audio controls controlsList="nodownload nofullscreen noremoteplayback"><source src="' + url + '"></video>'
    // Create popup
    tippy(object, {
      content: player,
      interactive: true,
      arrow: true,
      theme: 'peek',
      delay: [500, 500]
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
    log('Found Office document link: ' + url)
    // TODO
  }
}

function previewMiscDocument(object) {
  var url = DOMPurify.sanitize(object.getAttribute('href'))
  url = processURL(url)
  if (url === 'invalid') {
    // Show error message
    createErrorPreview(object)
  } else if (!url) {
    // If the URL is null or otherwise invalid, silently fail
    return
  } else {
    log('Found document link: ' + url)
    // TODO
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
    log('Found document link: ' + url)
    // Render file with the browser's own viewer
    if (url.toLowerCase().endsWith('.pdf') || url.toLowerCase().endsWith('.txt')) {
      var viewer = '<embed src="' + url + '#toolbar=0">'
    } else {
      var viewer = '<img src="' + url + '">'
    }
    // Create popup
    tippy(object, {
      content: viewer,
      interactive: true,
      arrow: true,
      theme: 'peek',
      delay: [500, 500]
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
    log('Found Google Docs link: ' + url)
    // Find the file ID
    var docsid;
		if (url.indexOf("/edit") >= 0) {
			docsid = url.substring(url.lastIndexOf("/d/") + 3, url.lastIndexOf("/edit")); // Most Google Docs files
		} else if (url.indexOf("/open") >= 0) {
			docsid = url.substring(url.lastIndexOf("/open?id=") + 9); // Most Google Docs files
		} else if (url.indexOf("/preview") >= 0) {
			docsid = url.substring(url.lastIndexOf("/document/d/") + 12, url.lastIndexOf("/preview")); // Docs preview links
		} else if (url.indexOf("/viewer") >= 0) {
			docsid = url.substring(url.lastIndexOf("srcid=") + 6, url.lastIndexOf("&")); // Docs viewer links
		} else {
			docsid = url.substring(url.lastIndexOf("/d/") + 3, url.lastIndexOf("/viewform")); // Forms
    }
    // Render the popup
    if (docsid != 'ht') { // Fix for bug where Google search results would generate preview for mis-matched Docs link
			// Create embed
      var viewer = '<embed src="https://docs.google.com/viewer?srcid=' + docsid + '&pid=explorer&efh=false&a=v&chrome=false&embedded=true">'
      // Create popup
      tippy(object, {
        content: viewer,
        interactive: true,
        arrow: true,
        theme: 'peek',
        delay: [500, 500]
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
    'a[href^="https://docs.google.com/d"]',
    'a[href^="https://drive.google.com/open"]'
  ]

  // Files that can only be renderd by Google Docs viewer
  // Source: https://gist.github.com/tzmartin/1cf85dc3d975f94cfddc04bc0dd399be#google-docs-viewer
  var miscLinks = [
    'a[href$=".pages"]',
    'a[href$=".PAGES"]',
    'a[href$=".ai"]',
    'a[href$=".AI"]',
    'a[href$=".psd"]',
    'a[href$=".PSD"]',
    'a[href$=".tiff"]',
    'a[href$=".TIFF"]',
    'a[href$=".dxf"]',
    'a[href$=".DXF"]',
    'a[href$=".eps"]',
    'a[href$=".EPS"]',
    'a[href$=".ps"]',
    'a[href$=".PS"]',
    'a[href$=".ttf"]',
    'a[href$=".TTF"]',
    'a[href$=".xps"]',
    'a[href$=".XPS"]',
    'a[href$=".zip"]',
    'a[href$=".ZIP"]',
    'a[href$=".rar"]',
    'a[href$=".RAR"]',
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

  document.querySelectorAll(miscLinks.toString()).forEach(function (link) {
    previewMiscDocument(link)
  })

  document.querySelectorAll(googleLinks.toString()).forEach(function (link) {
    previewGoogleDocs(link)
  })

}

// Initialize Peek on page load
loadDOM()