/*
The MIT License (MIT)

Copyright (c) 2017 Corbin Davenport

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

chrome.runtime.onInstalled.addListener(function(details) {
	if (localStorage.getItem("version") != chrome.runtime.getManifest().version) {
		chrome.tabs.create({'url': chrome.extension.getURL('welcome.html')});
		localStorage["version"] = chrome.runtime.getManifest().version;
	}
	if (localStorage.getItem("docviewer") === null || localStorage.getItem("docviewer") === "") {
		localStorage["docviewer"] = "google";
	}
	if (localStorage.getItem("console") === null || localStorage.getItem("console") === "") {
		localStorage["console"] = "true";
	}
	if (localStorage.getItem("console") === null || localStorage.getItem("console") === "") {
		localStorage["console"] = "true";
	}
	if (localStorage.getItem("previewlimit") === null || localStorage.getItem("previewlimit") === "") {
		localStorage["previewlimit"] = "true";
	}
	chrome.browserAction.setBadgeText({text: ""});
	chrome.browserAction.setTitle({title: "No previews on this page.\n\nClick the icon to open Peek settings."});
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.method == "getLocalStorage") {
		sendResponse({data: localStorage[request.key]});
	} else if (request.method == "changeIcon") {
		if ((request == undefined) || (request.key == 0)) {
			chrome.browserAction.setBadgeText({text: ""});
			chrome.browserAction.setTitle({title: "No previews on this page.\n\nClick the icon to open Peek settings."});
		} else {
			chrome.browserAction.setBadgeText({text: request.key});
			chrome.browserAction.setTitle({title: "Peek has rendered " + request.key + " previews on this page.\n\nClick the icon to open Peek settings."});
		}
	} else if (request.method == "resetIcon") {
		chrome.browserAction.setBadgeText({text: ""});
		chrome.browserAction.setTitle({title: "No previews on this page.\n\nClick the icon to open Peek settings."});
	} else {
		sendResponse({});
	}
});

chrome.browserAction.onClicked.addListener(function() {
	 window.open(chrome.extension.getURL("settings.html"));
});

chrome.tabs.onActivated.addListener(function(tabId, changeInfo, tab) {
	// Check number of previews from contentscript.js whenever tab changes
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {method: "getPreviews"}, function(response) {
			if ((response == undefined) || (response.data == 0)) {
				chrome.browserAction.setBadgeText({text: ""});
				chrome.browserAction.setTitle({title: "No previews on this page.\n\nClick the icon to open Peek settings."});
			} else {
				chrome.browserAction.setBadgeText({text: response.data});
				chrome.browserAction.setTitle({title: "Peek has rendered " + response.data + " previews on this page.\n\nClick the icon to open Peek settings."});
			}
		});
	});
});