// Create array for rendered URLs on the page
var renderedPreviews = []

// Create global doc viewer setting
var docViewer

// Reset badge icon
chrome.runtime.sendMessage({ method: 'resetIcon', key: '' })

// Allow background.js to check number of rendered previews
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.method == 'getPreviews') {
    sendResponse({ data: renderedPreviews.length })
  }
})

// Unified function for generating previews
function initPreview(inputObject, previewType) {
  // Get the full original URL
  let inputUrl = DOMPurify.sanitize(inputObject.getAttribute('href'));
  let realUrl = new URL(inputUrl, document.location.href);
  // Exit early if the URL isn't valid
  // TODO: Show error visual error message
  if (!realUrl.href) {
    console.error('Cannot generate a preview for ' + url + ' because it is an invalid URL.');
    return;
  } else if (realUrl.href.startsWith('http:') && (window.location.protocol === 'https')) {
    console.error('Cannot generate a preview for ' + url + ' because it is not served over HTTPS.');
    return;
  }
  // Create main container element and Tippy instance
  let tippyTooltip = tippy(inputObject, {
    theme: 'peek-unified'
  });
  let popupEl = document.createElement('div');
  popupEl.dataset.peekType = previewType;
  // Add preview
  if (previewType === 'ms-office') {
    // Microsoft Office documents
    console.log('Found Office document link:', realUrl);
    let popupFrame = document.createElement('iframe');
    popupFrame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    // Open Document Format files can only be opened with Microsoft's viewer, so override user preference
    var ifOfficeOnly = (
      realUrl.href.toLowerCase().endsWith('odt') ||
      realUrl.href.toLowerCase().endsWith('ods') ||
      realUrl.href.toLowerCase().endsWith('odp')
    )
    if (ifOfficeOnly || docViewer === 'office') {
      popupFrame.src = 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURI(realUrl.href);
    } else if (docViewer === 'google') {
      popupFrame.src = 'https://docs.google.com/gview?url=' + encodeURI(realUrl.href) + '&embedded=true';
    }
    popupEl.append(popupFrame);
  } else if (previewType === 'native-document') {
    // Documents that can be rendered natively by the browser
    console.log('Found document link:', realUrl);
    let embedEl = document.createElement('embed');
    embedEl.src = realUrl.href;
    // Set options for viewer if file is a PDF
    if (realUrl.href.toLowerCase().endsWith('.pdf')) {
      if (navigator.userAgent.includes('Firefox')) {
        embedEl.src += '#zoom=page-width';
      } else {
        embedEl.src += '#toolbar=0'
      }
    }
    // Add embed to tooltip
    popupEl.append(embedEl)
  } else if (previewType === 'icloud') {
    // iCloud documents
    console.log('Found iCloud link:', realUrl);
    let embedFrame = document.createElement('iframe');
    embedFrame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    // Modify URL to show it in embedded format
    let embedUrl = realUrl;
    embedUrl.searchParams.set('embed', 'true');
    // Add frame to tooltip
    embedFrame.src = embedUrl.href;
    popupEl.append(embedFrame);
  } else if (previewType === 'native-image') {
    // Documents that can be rendered natively by the browser
    console.log('Found image link:', realUrl);
    let embedEl = document.createElement('img');
    embedEl.src = realUrl.href;
    // Add embed to tooltip
    popupEl.append(embedEl)
  } else if (previewType === 'video') {
    // HTML5 Video
    console.log('Found video link:', realUrl);
    let popupVideo = document.createElement('video');
    // Set video properties
    popupVideo.controls = true;
    popupVideo.muted = true;
    popupVideo.disablePictureInPicture = true;
    popupVideo.setAttribute('controlsList', 'nodownload nofullscreen');
    popupVideo.src = realUrl.href;
    // Add video to tooltip and play it on activation
    popupEl.append(popupVideo);
    tippyTooltip.setProps({
      onShow: function () {
        popupVideo.play();
      }
    });
  } else if (previewType === 'audio') {
    // Audio files
    console.log('Found audio link:', realUrl);
    let audioEl = document.createElement('audio');
    // Set audio properties
    audioEl.controls = true;
    audioEl.setAttribute('controlsList', 'nodownload');
    audioEl.src = realUrl.href;
    // Add audio to tooltip
    popupEl.append(audioEl);
  } else if (previewType === 'youtube') {
    // YouTube video
    console.log('Found YouTube video link:', realUrl)
    let popupFrame = document.createElement('iframe');
    popupFrame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    // Use to find the video ID: https://regex101.com/r/UG8utp/1
    let regex = /(?:(v?\=)|(youtu.be\/)|(embed\/)|(shorts\/))(?<videoId>.*?)(&|$)/
    let videoId = regex.exec(realUrl.href)['groups']['videoId']
    popupFrame.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&mute=1&fs=0&modestbranding=1';
    // Add custom properties for YouTube Shorts
    if (realUrl.href.includes('shorts')) {
      popupFrame.classList.add('peek-embed-portrait');
      popupFrame.src += '&loop=1';
    }
    // Add video to tooltip
    popupEl.append(popupFrame);
  } else if (previewType === 'reddit') {
    // Reddit link
    console.log('Found Reddit link:', realUrl)
    let frameEl = document.createElement('iframe');
    frameEl.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    // Modify original URL to embedded format
    let embedUrl = realUrl;
    embedUrl.hostname = 'www.redditmedia.com';
    embedUrl.searchParams.set('embed', 'true');
    embedUrl.searchParams.set('showmedia', 'true');
    embedUrl.searchParams.set('depth', '1');
    frameEl.src = embedUrl;
    // Modify URL to match system theme
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      embedUrl.searchParams.set('theme', 'dark');
    }
    // Add frame to tooltip
    frameEl.src = embedUrl;
    popupEl.append(frameEl);
  } else {
    popupEl.innerText = 'There was an error rendering this preview.';
  }
  // Add toolbar
  // TODO: Add buttons to right side
  let toolbarEl = document.createElement('div');
  toolbarEl.className = 'peek-toolbar'
  toolbarEl.innerText = 'Powered by Peek';
  popupEl.prepend(toolbarEl);
  // Add content to tooltip
  tippyTooltip.setContent(popupEl);
};

// Function for adding 'Powered by Peek' label to popup HTML
function addToolbar(html) {
  // Get settings gear icon
  var toolbar = '<div class="peek-info-banner">Powered by Peek</div>'
  html += toolbar
  return html
}

// Prevent mixed protocol warnings
function checkProtocol(url) {
  if (url.startsWith('http:') && window.location.protocol === 'https:') {
    // HTTP link on HTTPS page
    return false
  } else {
    // HTTPS link on HTTP page, HTTPS on HTTPS, etc.
    return true
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

// Detect links for previews
function loadDOM() {

  // Video files
  var videoLinks = [
    'a[href$=".webm" i]',
    'a[href$=".mp4" i]',
    'a[href$=".m4v" i]',
    'a[href$=".ogg" i]',
    'a[href$=".ogv" i]',
    'a[href$=".gifv" i]',
  ]

  // Audio files
  var audioLinks = [
    'a[href$=".mp3" i]',
    'a[href$=".m4a" i]',
    'a[href$=".oga" i]',
    'a[href$=".wav" i]',
  ]

  // Documents that have to be rendered by the Docs/Office viewer
  var officeLinks = [
    'a[href$=".doc" i]',
    'a[href$=".docx" i]',
    'a[href$=".xls" i]',
    'a[href$=".xlsx" i]',
    'a[href$=".ppt" i]',
    'a[href$=".pptx" i]',
    'a[href$=".rtf" i]',
    'a[href$=".odt" i]',
    'a[href$=".ods" i]',
    'a[href$=".odp" i]',
  ]

  // Documents and images that can be rendered by the browser
  var docLinks = [
    'a[href$=".pdf" i]',
    'a[href$=".txt" i]',
  ]

  // Images that can be rendered by the browser
  var imgLinks = [
    'a[href$=".jpeg" i]',
    'a[href$=".jpg" i]',
    'a[href$=".png" i]',
    'a[href$=".apng" i]',
    'a[href$=".svg" i]',
    'a[href$=".gif" i]',
    'a[href$=".ico" i]',
    'a[href$=".bmp" i]',
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
    'a[href^="https://youtu.be/"]',
    'a[href^="https://youtube.com/embed/"]',
    'a[href^="https://www.youtube.com/embed/"]',
    'a[href^="https://youtube.com/shorts/"]',
    'a[href^="https://www.youtube.com/shorts/"]',
  ]

  // Reddit links
  var redditLinks = [
    'a[href^="https://www.reddit.com/r/"]',
    'a[href^="https://redd.it/"]'
  ]

  // Generate previews

  document.querySelectorAll(videoLinks.toString()).forEach(function (link) {
    initPreview(link, 'video')
  })

  document.querySelectorAll(audioLinks.toString()).forEach(function (link) {
    initPreview(link, 'audio')
  })

  document.querySelectorAll(officeLinks.toString()).forEach(function (link) {
    initPreview(link, 'ms-office')
  })

  document.querySelectorAll(docLinks.toString()).forEach(function (link) {
    initPreview(link, 'native-document')
  })

  document.querySelectorAll(imgLinks.toString()).forEach(function (link) {
    initPreview(link, 'native-image')
  })

  document.querySelectorAll(googleLinks.toString()).forEach(function (link) {
    previewGoogleDocs(link)
  })

  document.querySelectorAll(appleLinks.toString()).forEach(function (link) {
    initPreview(link, 'icloud')
  })

  document.querySelectorAll(webVideoLinks.toString()).forEach(function (link) {
    initPreview(link, 'youtube')
  })

  document.querySelectorAll(redditLinks.toString()).forEach(function (link) {
    if (!window.location.hostname === 'www.reddit.com') {
      initPreview(link, 'reddit')
    }
  })

}

// Initialize Peek on page load
chrome.storage.sync.get({
  docViewer: 'google',
  previewSize: 400,
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
    maxWidth: data.previewSize,
    maxHeight: data.previewSize,
    theme: 'peek'
  })
  // Set width through injecting CSS code because Tippy doesn't have a property for it
  var customCSS = document.createElement('style')
  customCSS.innerHTML = ".tippy-box[data-theme~='peek'] {width: " + data.previewSize + "px !important;} .tippy-box[data-theme~='peek'] embed {height: " + (data.previewSize - 80) + "px !important;}"
  document.body.appendChild(customCSS)
  // Initialize previews
  loadDOM()
})