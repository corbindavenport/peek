// Create array for rendered URLs on the page
let renderedPreviews = []

// Video files
const videoLinks = [
  'a[href$=".webm" i]',
  'a[href$=".mp4" i]',
  'a[href$=".m4v" i]',
  'a[href$=".ogg" i]',
  'a[href$=".ogv" i]',
  'a[href$=".gifv" i]',
]

// Audio files
const audioLinks = [
  'a[href$=".mp3" i]',
  'a[href$=".m4a" i]',
  'a[href$=".oga" i]',
  'a[href$=".wav" i]',
]

// Documents that have to be rendered by the Docs/Office viewer
const officeLinks = [
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
const docLinks = [
  'a[href$=".pdf" i]',
  'a[href$=".txt" i]',
]

// Images that can be rendered by the browser
const imgLinks = [
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
const googleLinks = [
  'a[href^="https://docs.google.com/d/"]',
  'a[href^="https://docs.google.com/document/d/"]',
  'a[href^="https://docs.google.com/presentation/d/"]',
  'a[href^="https://docs.google.com/spreadsheets/d/"]',
  'a[href^="https://docs.google.com/drawings/d/"]',
  'a[href^="https://docs.google.com/forms/d/"]',
  'a[href^="https://drive.google.com/open"]'
]

// iCloud links (Apple only allows Keynote files to be embedded right now)
const appleLinks = [
  //'a[href^="https://www.icloud.com/pages/"]',
  //'a[href^="https://www.icloud.com/numbers/"]',
  'a[href^="https://www.icloud.com/keynote/"]',
]

// Video links
const webVideoLinks = [
  'a[href^="https://www.youtube.com/watch?v="]',
  'a[href^="https://youtu.be/"]',
  'a[href^="https://youtube.com/embed/"]',
  'a[href^="https://www.youtube.com/embed/"]',
  'a[href^="https://youtube.com/shorts/"]',
  'a[href^="https://www.youtube.com/shorts/"]',
]

// Reddit links
const redditLinks = [
  'a[href^="https://www.reddit.com/r/"]',
  'a[href^="https://redd.it/"]'
]

// Imgur links
const imgurLinks = [
  'a[href^="https://imgur.com/"]:not(a[href*="/comment"]):not(a[href*="/user"])'
]

// TikTok links
const tiktokLinks = [
  'a[href^="https://www.tiktok.com/"][href*="/video"]'
]

// Mastodon links
// This matches with a lot of false positives, further matching is handled by JS
const mastodonLinks = [
  'a[href^="https://"][href*="/@"]:not(a[href^="https://www.tiktok.com/"]):not(a[href^="https://www.youtube.com/"])'
]

// Allow background.js to check number of rendered previews
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.method == 'getPreviews') {
    sendResponse({ data: renderedPreviews.length })
  }
})

// Unified function for generating previews
function initPreview(inputObject, previewType, peekSettings) {
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
  let tippyTooltip = tippy(inputObject);
  let popupEl = document.createElement('div');
  popupEl.dataset.peekType = previewType;
  // Add preview
  if (previewType === 'ms-office') {
    // Microsoft Office documents
    console.log('Found Office document link:', realUrl, inputObject);
    let popupFrame = document.createElement('iframe');
    popupFrame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    // Open Document Format files can only be opened with Microsoft's viewer, so override user preference
    var ifOfficeOnly = (
      realUrl.href.toLowerCase().endsWith('odt') ||
      realUrl.href.toLowerCase().endsWith('ods') ||
      realUrl.href.toLowerCase().endsWith('odp')
    )
    if (ifOfficeOnly || peekSettings.docViewer === 'office') {
      popupFrame.src = 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURI(realUrl.href);
    } else if (peekSettings.docViewer === 'google') {
      popupFrame.src = 'https://docs.google.com/gview?url=' + encodeURI(realUrl.href) + '&embedded=true';
    }
    popupEl.append(popupFrame);
  } else if (previewType === 'google-docs') {
    // Google Doc links
    console.log('Found Google Doc link:', realUrl, inputObject);
    let embedFrame = document.createElement('iframe');
    embedFrame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    // Regex to find the document ID: https://regex101.com/r/1DciHc/2
    let regex = /(?:(\/d\/)|(\/open\?id=)|(srcid=))(?<docsId>.*?)(?:(\/)|(\&)|($))/
    let docId = regex.exec(realUrl.href)['groups']['docsId']
    // Add frame to tooltip
    embedFrame.src = 'https://docs.google.com/viewer?srcid=' + docId + '&pid=explorer&efh=false&a=v&chrome=false&embedded=true';
    popupEl.append(embedFrame);
  } else if (previewType === 'native-document') {
    // Documents that can be rendered natively by the browser
    console.log('Found document link:', realUrl, inputObject);
    let embedFrame = document.createElement('iframe');
    embedFrame.setAttribute('sandbox', 'allow-scripts');
    embedFrame.src = realUrl.href;
    // Set options for viewer if file is a PDF
    // Firefox documentation: https://github.com/mozilla/pdf.js/wiki/Viewer-options
    if (realUrl.href.toLowerCase().endsWith('.pdf')) {
      if (navigator.userAgent.includes('Firefox')) {
        embedFrame.src += '#zoom=page-width&pagemode=none';
      } else {
        embedFrame.src += '#toolbar=0';
        // The sandbox mode breaks too often with PDF documents in Chromium browsers
        embedFrame.removeAttribute('sandbox');
      }
    }
    // Add embed to tooltip
    popupEl.append(embedFrame)
  } else if (previewType === 'icloud') {
    // iCloud documents
    console.log('Found iCloud link:', realUrl, inputObject);
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
    console.log('Found image link:', realUrl, inputObject);
    let embedEl = document.createElement('img');
    embedEl.src = realUrl.href;
    // Add embed to tooltip
    popupEl.append(embedEl)
  } else if (previewType === 'video') {
    // HTML5 Video
    console.log('Found video link:', realUrl, inputObject);
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
    console.log('Found audio link:', realUrl, inputObject);
    let audioEl = document.createElement('audio');
    // Set audio properties
    audioEl.controls = true;
    audioEl.setAttribute('controlsList', 'nodownload');
    audioEl.src = realUrl.href;
    // Add audio to tooltip
    popupEl.append(audioEl);
  } else if (previewType === 'youtube') {
    // YouTube video
    console.log('Found YouTube video link:', realUrl, inputObject);
    let popupFrame = document.createElement('iframe');
    popupFrame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    // Use to find the video ID: https://regex101.com/r/UG8utp/1
    let regex = /(?:(v?\=)|(youtu.be\/)|(embed\/)|(shorts\/))(?<videoId>.*?)(&|$)/;
    let videoId = regex.exec(realUrl.href)['groups']['videoId'];
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
    console.log('Found Reddit link:', realUrl, inputObject);
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
    };
    // Add frame to tooltip
    popupEl.append(frameEl);
  } else if (previewType === 'imgur') {
    // Imgur link
    console.log('Found Imgur link:', realUrl, inputObject);
    let frameEl = document.createElement('iframe');
    frameEl.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    // Modify original URL to embedded format
    let embedUrl = realUrl;
    if (embedUrl.pathname.endsWith('/')) {
      embedUrl.pathname = embedUrl.pathname.slice(0, -1);
    };
    embedUrl.pathname = embedUrl.pathname.replace('/gallery/', '/a/');
    embedUrl.pathname += '/embed';
    embedUrl.searchParams.set('pub', 'true');
    // Add frame to tooltip
    frameEl.src = embedUrl;
    popupEl.append(frameEl);
  } else if (previewType === 'tiktok') {
    // TikTok link
    console.log('Found TikTok link:', realUrl, inputObject);
    let wrapperEl = document.createElement('div');
    wrapperEl.className = 'peek-tiktok-wrapper';
    let frameEl = document.createElement('iframe');
    frameEl.setAttribute('sandbox', 'allow-scripts');
    // Use to find the video ID: https://regex101.com/r/Gvugg7/1
    let regex = /(?:(video\/))(?<videoId>.*?)(&|\?|$)/;
    let videoId = regex.exec(realUrl.href)['groups']['videoId'];
    frameEl.src = 'https://www.tiktok.com/embed/v2/' + videoId;
    // Add frame to tooltip
    wrapperEl.append(frameEl);
    popupEl.append(wrapperEl);
  } else if (previewType === 'mastodon') {
    // Mastodon link
    const mastodonRegex = /https?:\/\/([a-zA-Z0-9]+\.)?(?<domain>[a-zA-Z0-9]+\.[a-zA-Z0-9]+)\/@(?<username>[a-zA-Z0-9]+)\/(?<postId>\d+)/;
    // Verify link is actually a Mastodon post
    // Regex demo: https://regex101.com/r/vQFw0R/2
    const match = mastodonRegex.exec(realUrl);
    if (match) {
      if (match.groups.domain && match.groups.username && match.groups.postId) {
        console.log('Found Mastodon link:', realUrl, match.groups, inputObject);
      } else {
        console.log('This does not appear to be a Mastodon post link, skipping:', realUrl, inputObject);
        return;
      }
    } else {
      console.log('This does not appear to be a Mastodon post link, skipping:', realUrl, inputObject);
      return;
    }
    // Create embed
    let frameEl = document.createElement('iframe');
    frameEl.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    frameEl.src = 'https://' + match.groups.domain + '/@' + match.groups.username + '/' + match.groups.postId + '/embed';
    // Add frame to tooltip
    popupEl.append(frameEl);
  } else {
    popupEl.innerText = 'There was an error rendering this preview.';
  }
  // Add toolbar
  let toolbarEl = document.createElement('div');
  toolbarEl.className = 'peek-toolbar'
  toolbarEl.innerText = 'Powered by Peek';
  popupEl.prepend(toolbarEl);
  // Add content to tooltip
  tippyTooltip.setContent(popupEl);
  // Update preview counter
  renderedPreviews.push(realUrl.href);
  chrome.runtime.sendMessage({ method: 'changeIcon', key: renderedPreviews.length.toString() });
};

// Initialize Peek on page load
async function initPeek() {
  // Get settings from storage
  const peekSettings = await chrome.storage.sync.get({
    docViewer: 'google'
  });
  // Set defaults for previews
  tippy.setDefaultProps({
    arrow: true,
    allowHTML: true,
    maxWidth: 370,
    delay: [500, 500],
    interactive: true,
    theme: 'peek-unified'
  });
  // Generate video previews
  document.querySelectorAll(videoLinks.toString()).forEach(function (link) {
    initPreview(link, 'video', peekSettings);
  });
  // Generate audio previews
  document.querySelectorAll(audioLinks.toString()).forEach(function (link) {
    initPreview(link, 'audio', peekSettings);
  });
  // Generate previews for MS Office docs and other documents not natively supported
  document.querySelectorAll(officeLinks.toString()).forEach(function (link) {
    initPreview(link, 'ms-office', peekSettings);
  });
  // Genrate previews for documents that the browser can render
  document.querySelectorAll(docLinks.toString()).forEach(function (link) {
    initPreview(link, 'native-document', peekSettings);
  });
  // Generate image previews
  document.querySelectorAll(imgLinks.toString()).forEach(function (link) {
    initPreview(link, 'native-image', peekSettings);
  });
  // Generate Google Docs links previews
  document.querySelectorAll(googleLinks.toString()).forEach(function (link) {
    initPreview(link, 'google-docs', peekSettings);
  });
  // Generate iCloud link previews
  document.querySelectorAll(appleLinks.toString()).forEach(function (link) {
    initPreview(link, 'icloud', peekSettings);
  });
  // Generae YouTube link previews
  document.querySelectorAll(webVideoLinks.toString()).forEach(function (link) {
    initPreview(link, 'youtube', peekSettings);
  });
  // Generate Reddit link previews, except on Reddit.com itself
  if (!(window.location.hostname === 'www.reddit.com')) {
    document.querySelectorAll(redditLinks.toString()).forEach(function (link) {
      initPreview(link, 'reddit', peekSettings);
    })
  };
  // Generate Imgur link previews, except on Imgur itself
  if (!(window.location.hostname === 'www.imgur.com')) {
    document.querySelectorAll(imgurLinks.toString()).forEach(function (link) {
      initPreview(link, 'imgur', peekSettings);
    })
  };
  // Generate TikTok link previews, except on TikTok itself
  if (!(window.location.hostname === 'www.tiktok.com')) {
    document.querySelectorAll(tiktokLinks.toString()).forEach(function (link) {
      initPreview(link, 'tiktok', peekSettings);
    })
  };
  // Generate Mastodon link previews
  document.querySelectorAll(mastodonLinks.toString()).forEach(function (link) {
    initPreview(link, 'mastodon', peekSettings);
  })
};

initPeek();