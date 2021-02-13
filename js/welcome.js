// Add version number to welcome page
document.querySelector(".version").innerHTML = chrome.runtime.getManifest().version

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