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
document.querySelectorAll('input,select').forEach(function (el) {
  el.addEventListener('change', function () {
    chrome.storage.sync.set({
      // Document viewer
      docViewer: document.querySelector('#doc-viewer').value,
      // Preview size
      previewSize: document.querySelector('#preview-size').value
    })
  })
})

// Link buttons
document.querySelectorAll('.link-btn').forEach(function (el) {
  el.addEventListener('click', function () {
    chrome.tabs.create({ url: el.getAttribute('data-url') })
  })
})

// Show credits
fetch('https://corbin.io/supporters.json').then(function (response) {
  response.json().then(function (data) {
    var creditsList = 'Diamond supporters: '
    for (var i = 0; i < data['supporters'].length; i++) {
      creditsList += data['supporters'][i] + ', '
    }
    creditsList = creditsList.substring(0, creditsList.length - 2)
    document.getElementById('peek-credits').innerText = creditsList
  })
})
  .catch(function (err) {
    document.getElementById('peek-credits').innerText = 'There was an error fetching Peek supporters.'
  })