/*
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see http://www.gnu.org/licenses/.
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