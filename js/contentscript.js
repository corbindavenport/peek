/*
The MIT License (MIT)

Copyright (c) 2017 Corbin Davenport

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Create array for already-rendered URLs on the page
var rendered = [];
var previewlimit = 20;
// Reset badge icon
chrome.runtime.sendMessage({method: "resetIcon", key: ""});
// Check preview limit setting
chrome.runtime.sendMessage({method: "getLocalStorage", key: "previewlimit"}, function(response) {
	if (response.data === "false") {
		previewlimit = 500;
	}
});

// Allow background.js to check number of rendered previews
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.method == "getPreviews") {
		sendResponse({data: rendered.length.toString()});
	}
});

// Only allow previews of HTTPS files on HTTPS pages, but allow mixed content on HTTP pages
function checkProtocol(url) {
	if (window.location.protocol === "https:") {
		if (url.includes("https:")) {
			return true;
		} else {
			return false;
		}
	} else {
		return true;
	}
}

function log(string) {
	chrome.runtime.sendMessage({method: "getLocalStorage", key: "console"}, function(response) {
		if (response.data === "true") {
			console.log("%c[Peek] " + string, "color: #4078c0");
		}
	});
}

function findURL(url){
	var img = document.createElement('img');
	img.src = url; // Set string url
	url = img.src; // Get qualified url
	img.src = null; // No server request
	// Don't continue if checkProtocol returns false
	if (checkProtocol(url)) {
		// Don't continue if the link already has a tooltip, if Peek has reached the preview limit, or if the link is a page on Wikimedia
		if ((rendered.includes(url)) || (rendered.length >= previewlimit) || (url.includes("commons.wikimedia.org/wiki/File:"))) {
			return null;
		} else {
			rendered.push(url);
			chrome.runtime.sendMessage({method: "changeIcon", key: rendered.length.toString()});
			return url;
		}
	} else {
		log("Cannot generate a preview for " + url + " because it is not served over HTTPS.");
		return "invalid";
	}
}

// Show warning for HTTP previews on HTTPS sites
function previewInvalidlink(object) {
	$(object).tooltipster({
		interactive: true,
		delay: ['0', '0'],
		theme: 'tooltipster-peek-warning',
		content: 'Peek cannot preview this link because it is served over an insecure connection.'
	});
}

// Google Docs viewer for files NOT on Google Docs (miscdocs)
function previewDocs(object) {
	var url = findURL(object.attr("href"));
	if (url === "invalid") {
		previewInvalidlink(object);
	} else if (url != null) {
		log("Found supported document link: " + url);
		$(object).tooltipster({
			interactive: true,
			delay: ['0', '500'],
			theme: 'tooltipster-peek',
			content: $('<embed data-type="miscdocs" style="border: 0px; width: 400px; height: 300px;" src="https://docs.google.com/gview?url=' + url + '&embedded=true"><div style="font-family: Roboto !important; font-size: 14px !important; text-align: left !important; line-height: 14px !important; color: #FFF !important; padding: 4px !important; margin-top: 3px !important; max-width: 400px !important;">Powered by Peek<span class="peekpopup" title="Preview this document in a new window" data-url="' + url + '"></span><span class="peeksettings" title="Open Peek extension settings"></span></div>')
		});
	}
}

// Google Docs viewer for files HOSTED on Google Docs (googledocs)
function previewHostedDocs(object) {
	var url = findURL(object.attr("href"));
	if (url != null) {
		var docsid;
		if (url.indexOf("/edit") >= 0) {
			docsid = url.substring(url.lastIndexOf("/d/")+3,url.lastIndexOf("/edit")); // Most Google Docs files
		} else if (url.indexOf("/open") >= 0) {
			docsid = url.substring(url.lastIndexOf("/open?id=")+9); // Most Google Docs files
		} else if (url.indexOf("/preview") >= 0) {
			docsid = url.substring(url.lastIndexOf("/document/d/")+12,url.lastIndexOf("/preview")); // Docs preview links
		} else if (url.indexOf("/viewer") >= 0) {
			docsid = url.substring(url.lastIndexOf("srcid=")+6,url.lastIndexOf("&")); // Docs viewer links
		} else {
			docsid = url.substring(url.lastIndexOf("/d/")+3,url.lastIndexOf("/viewform")); // Forms
		}
		if (url === "invalid") {
			previewInvalidlink(object);
		} else if (docsid != "ht") { // Fix for bug where Google search results would generate preview for mis-matched Docs link
			log("Found Google Docs link: " + url + "\n[Peek] ID of above Google Docs link identified as: " + docsid);
			$(object).tooltipster({
				interactive: true,
				delay: ['0', '500'],
				theme: 'tooltipster-peek',
				content: $('<embed data-type="googledocs" style="border: 0px; width: 400px; height: 300px;" src="https://docs.google.com/viewer?srcid=' + docsid + '&pid=explorer&efh=false&a=v&chrome=false&embedded=true"><div style="font-family: Roboto !important; font-size: 14px !important; text-align: left !important; line-height: 14px !important; color: #FFF !important; padding: 4px !important; margin-top: 3px !important; max-width: 400px !important;">Powered by Peek<span class="peekpopup" title="Preview this document in a new window" data-url="' + url + '"></span><span class="peeksettings" title="Open Peek extension settings"></span></div>')
			});
		} else {
			rendered.splice(rendered.indexOf(url), 1);
			chrome.runtime.sendMessage({method: "changeIcon", key: rendered.length.toString()});
		}
	}
}

// Office Online viewer
function previewOffice(object) {
	var url = findURL(object.attr("href"));
	if (url === "invalid") {
		previewInvalidlink(object);
	} else if (url != null) {
		log("Found supported document link: " + url);
		$(object).tooltipster({
			interactive: true,
			delay: ['0', '500'],
			theme: 'tooltipster-peek',
			content: $('<embed data-type="officeviewer" style="border: 0px; width: 400px; height: 300px;" src="https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURI(url) + '"><div style="font-family: Roboto !important; font-size: 14px !important; text-align: left !important; line-height: 14px !important; color: #FFF !important; padding: 4px !important; margin-top: 3px !important; max-width: 400px !important;">Powered by Peek<span class="peekpopup" title="Preview this document in a new window"></span><span class="peeksettings" title="Open Peek extension settings"></span></div>')
		});
	}
}

// HTML5 video player
function previewVideo(object, type) {
	var url = findURL(object.attr("href"));
	if (url === "invalid") {
		previewInvalidlink(object);
	} else if (url != null) {
		if ((url.endsWith('.gifv')) && (url.indexOf("imgur.com") > -1)) {
			// Use MP4 video for Imgur GIFV links
			url = url.replace(".gifv", ".mp4");
		}
		log("Found supported video link: " + url);
		$(object).tooltipster({
			interactive: true,
			delay: ['0', '500'],
			theme: 'tooltipster-peek',
			content: $('<video data-type="html5video" controls controlsList="nodownload nofullscreen"><source src="' + url + '" type="' + type + '"></video><div style="font-family: Roboto !important; font-size: 14px !important; text-align: left !important; line-height: 14px !important; color: #FFF !important; padding: 4px !important; margin-top: 3px !important; max-width: 400px !important;">Powered by Peek<span class="peekpopup" title="Preview this document in a new window"></span><span class="peeksettings" title="Open Peek extension settings"></span></div>')
		});
	}
}

// Gfycat links
function previewGfycat(object, type) {
	var url = findURL(object.attr("href"));
	if (url === "invalid") {
		previewInvalidlink(object);
	} else if (url != null) {
		var re = /(?:http:|https:|)(?:\/\/|)(?:gfycat\.com\/(?:\w*\/)*)(\w+$)/gi;
		var gfycat = (re.exec(url)[1]);
		log("Found supported Gfycat link: " + gfycat);
		$.getJSON( "https://gfycat.com/cajax/get/" + gfycat, function(data) {
			$(object).tooltipster({
				interactive: true,
				delay: ['0', '500'],
				theme: 'tooltipster-peek',
				content: $('<video data-type="gfycat" data-gfyid="' + data.gfyItem.gfyName + '" controls controlsList="nodownload nofullscreen" loop id="' + gfycat + '" loop><source src="' + data.gfyItem.webmUrl + '" type="video/webm"></video><div style="font-family: Roboto !important; font-size: 14px !important; text-align: left !important; line-height: 14px !important; color: #FFF !important; padding: 4px !important; margin-top: 3px !important; max-width: 400px !important;">Powered by Peek<span class="peekpopup" title="Preview this document in a new window"></span><span class="peeksettings" title="Open Peek extension settings"></span></div>')
			});
		});
	}
}

// Giphy links
function previewGiphy(object, type) {
	var url = findURL(object.attr("href"));
	if (url === "invalid") {
		previewInvalidlink(object);
	} else if (url != null) {
		var re = /https?:\/\/(?|media\.giphy\.com\/media\/([^ \/\n]+)\/giphy\.gif|i\.giphy\.com\/([^ \/\n]+)\.gif|giphy\.com\/gifs\/(?:.*-)?([^ \/\n]+))/ig;
		re = re.replace(/\(\d*\)|\/\(P\)\//g, "");
		var giphyid = (re.exec(url)[1]);
		log("Found supported Giphy link: " + giphyid);
		$(object).tooltipster({
			interactive: true,
			delay: ['0', '500'],
			theme: 'tooltipster-peek',
			content: $('<embed data-type="giphy" style="border: 0px; width: 400px; height: 300px;" src="https://giphy.com/embed/' + giphyid + '"><div style="font-family: Roboto !important; font-size: 14px !important; text-align: left !important; line-height: 14px !important; color: #FFF !important; padding: 4px !important; margin-top: 3px !important; max-width: 400px !important;">Powered by Peek<span class="peekpopup" title="Preview this document in a new window"></span><span class="peeksettings" title="Open Peek extension settings"></span></div>')
		});
	}
}

// HTML5 audio player
function previewAudio(object, type) {
	var url = findURL(object.attr("href"));
	if (url === "invalid") {
		previewInvalidlink(object);
	} else if (url != null) {
		log("Found supported audio link: " + url);
		$(object).tooltipster({
			interactive: true,
			delay: ['0', '500'],
			theme: 'tooltipster-peek',
			content: $('<audio data-type="html5audio" controls controlsList="nodownload nofullscreen"><source src="' + url + '" type="' + type + '"></audio><div style="font-family: Roboto !important; font-size: 14px !important; text-align: left !important; line-height: 14px !important; color: #FFF !important; padding: 4px !important; margin-top: 3px !important; max-width: 400px !important;">Powered by Peek<span class="peekpopup" title="Preview this document in a new window"></span><span class="peeksettings" title="Open Peek extension settings"></span></div>')
		});
	}
}

// Peek buttons
$(document).on('click', ".peeksettings", function() {
	window.open(chrome.extension.getURL("settings.html"));
	return false;
});
$(document).on('click', ".peekpopup", function() {
	// Preloader GIF for video player
	var preloader = "data:image/gif;base64,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cmllcy9jbGFzcy5teXNxbC5waHA8L2I+IG9uIGxpbmUgPGI+Njg8L2I+PGJyIC8+CjxiciAvPgo8Yj5XYXJuaW5nPC9iPjogIG15c3FsX3F1ZXJ5KCkgWzxhIGhyZWY9J2Z1bmN0aW9uLm15c3FsLXF1ZXJ5Jz5mdW5jdGlvbi5teXNxbC1xdWVyeTwvYT5dOiBBIGxpbmsgdG8gdGhlIHNlcnZlciBjb3VsZCBub3QgYmUgZXN0YWJsaXNoZWQgaW4gPGI+L2hvbWUvYWpheGxvYWQvd3d3L2xpYnJhaXJpZXMvY2xhc3MubXlzcWwucGhwPC9iPiBvbiBsaW5lIDxiPjY4PC9iPjxiciAvPgo8YnIgLz4KPGI+V2FybmluZzwvYj46ICBteXNxbF9xdWVyeSgpIFs8YSBocmVmPSdmdW5jdGlvbi5teXNxbC1xdWVyeSc+ZnVuY3Rpb24ubXlzcWwtcXVlcnk8L2E+XTogQ2FuJ3QgY29ubmVjdCB0byBsb2NhbCBNeVNRTCBzZXJ2ZXIgdGhyb3VnaCBzb2NrZXQgJy92YXIvcnVuL215c3FsZC9teXNxbGQuc29jaycgKDIpIGluIDxiPi9ob21lL2FqYXhsb2FkL3d3dy9saWJyYWlyaWVzL2NsYXNzLm15c3FsLnBocDwvYj4gb24gbGluZSA8Yj42ODwvYj48YnIgLz4KPGJyIC8+CjxiPldhcm5pbmc8L2I+OiAgbXlzcWxfcXVlcnkoKSBbPGEgaHJlZj0nZnVuY3Rpb24ubXlzcWwtcXVlcnknPmZ1bmN0aW9uLm15c3FsLXF1ZXJ5PC9hPl06IEEgbGluayB0byB0aGUgc2VydmVyIGNvdWxkIG5vdCBiZSBlc3RhYmxpc2hlZCBpbiA8Yj4vaG9tZS9hamF4bG9hZC93d3cvbGlicmFpcmllcy9jbGFzcy5teXNxbC5waHA8L2I+IG9uIGxpbmUgPGI+Njg8L2I+PGJyIC8+CjxiciAvPgo8Yj5XYXJuaW5nPC9iPjogIG15c3FsX3F1ZXJ5KCkgWzxhIGhyZWY9J2Z1bmN0aW9uLm15c3FsLXF1ZXJ5Jz5mdW5jdGlvbi5teXNxbC1xdWVyeTwvYT5dOiBDYW4ndCBjb25uZWN0IHRvIGxvY2FsIE15U1FMIHNlcnZlciB0aHJvdWdoIHNvY2tldCAnL3Zhci9ydW4vbXlzcWxkL215c3FsZC5zb2NrJyAoMikgaW4gPGI+L2hvbWUvYWpheGxvYWQvd3d3L2xpYnJhaXJpZXMvY2xhc3MubXlzcWwucGhwPC9iPiBvbiBsaW5lIDxiPjY4PC9iPjxiciAvPgo8YnIgLz4KPGI+V2FybmluZzwvYj46ICBteXNxbF9xdWVyeSgpIFs8YSBocmVmPSdmdW5jdGlvbi5teXNxbC1xdWVyeSc+ZnVuY3Rpb24ubXlzcWwtcXVlcnk8L2E+XTogQSBsaW5rIHRvIHRoZSBzZXJ2ZXIgY291bGQgbm90IGJlIGVzdGFibGlzaGVkIGluIDxiPi9ob21lL2FqYXhsb2FkL3d3dy9saWJyYWlyaWVzL2NsYXNzLm15c3FsLnBocDwvYj4gb24gbGluZSA8Yj42ODwvYj48YnIgLz4K";
	if ($(this).parent().parent().find("embed").attr("data-type") == "miscdocs") {
		// Google Docs viewer for files NOT on Google Docs (miscdocs)
		var url = $(this).parent().parent().find("embed").attr("src");
		var windowhtml = window.open("", url, "width=500,height=400");
		var doctitle;
		windowhtml.document.write('<html><head><title>Peek Preview</title><style>html, body {margin: 0 !important; padding: 0px !important} embed {width: 100% !important; height: 100% !important}</style></head><body><embed src="' + url + '"></embed></body></html>');
		$.getJSON("https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22" + encodeURIComponent(url) + "%22%20and%20compat%3D%22html5%22%20and%20xpath%3D'%2F%2Ftitle'&format=json&callback=", function(data) {
				windowhtml.document.title = "Peek Preview - " + data['query']['results']['title'];
		});
	} else if ($(this).parent().parent().find("embed").attr("data-type") == "googledocs") {
		// Google Docs viewer for files HOSTED on Google Docs (googledocs)
		var url = $(this).parent().parent().find("embed").attr("src");
		var windowhtml = window.open("", url, "width=500,height=400");
		var doctitle;
		windowhtml.document.write('<html><head><title>Peek Preview</title><style>html, body {margin: 0 !important; padding: 0px !important} embed {width: 100% !important; height: 100% !important}</style></head><body><embed src="' + url + '"></embed></body></html>');
		$.getJSON("https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22" + encodeURIComponent(url) + "%22%20and%20compat%3D%22html5%22%20and%20xpath%3D'%2F%2Fmeta%5B%40property%3D%22og%3Atitle%22%5D%2F%40content'&format=json&callback=", function(data) {
				windowhtml.document.title = "Peek Preview - " + data['query']['results']['meta']['content'];
		});
	} else if ($(this).parent().parent().find("embed").attr("data-type") == "officeviewer") {
		// Office Online viewer
		var url = $(this).parent().parent().find("embed").attr("src");
		var windowhtml = window.open("", url, "width=500,height=400");
		var doctitle;
		windowhtml.document.write('<html><head><title>Peek Preview</title><style>html, body {margin: 0 !important; padding: 0px !important} embed {width: 100% !important; height: 100% !important}</style></head><body><embed src="' + url + '"></embed></body></html>');
	} else if ($(this).parent().parent().find("video").attr("data-type") == "html5video") {
		// HTML5 video player
		var url = $(this).parent().parent().find("source").attr("src");
		var filename = url.substring(url.lastIndexOf('/')+1);
		var type = $(this).parent().parent().find("source").attr("type");
		var windowhtml = window.open("", url, "width=500,height=400");
		var doctitle;
		windowhtml.document.write('<html><head><title>Peek Preview - ' + filename + '</title><style>html,body{margin:0!important;padding:0!important;background:#212121!important}video{width:100%!important;height:100%!important}video,audio{box-shadow:inset 0 0 0 1px #212121!important;width:100%!important;height:100%!important}video{background:url("' + preloader + '") no-repeat center #424242!important}</style></head><body><video controls><source src="' + url + '" type="' + type + '"></video></body></html>');
	} else if ($(this).parent().parent().find("video").attr("data-type") == "gfycat") {
		// Gfycat link
		var gfyid = $(this).parent().parent().find("video").attr("data-gfyid");
		var windowhtml = window.open("", url, "width=500,height=400");
		windowhtml.document.write('<html><head><title>Peek Preview - ' + gfyid + '</title><style>html, body {margin: 0 !important; padding: 0px !important} embed {width: 100% !important; height: 100% !important}</style></head><body><embed src="https://gfycat.com/ifr/' + gfyid + '"></embed></body></html>');
	} else if ($(this).parent().parent().find("embed").attr("data-type") == "flash") {
		// F4Player
		var url = $(this).parent().parent().find("embed").attr("data-url");
		var filename = url.substring(url.lastIndexOf('/')+1);
		var windowhtml = window.open("", url, "width=500,height=400");
		windowhtml.document.write('<html><head><title>Peek Preview - ' + filename + '</title><style>html, body {margin: 0 !important; padding: 0px !important} embed {width: 100% !important; height: 100% !important}</style></head><body><embed data-type="flash" type="application/x-shockwave-flash" src="http://gokercebeci.com/data/dev/f4player/player.swf?v1.3.5" class="flashplayer" flashvars="skin=http://gokercebeci.com/data/dev/f4player/skins/mySkin.swf&video=' + url + '" allowscriptaccess="always" allowfullscreen="false" bgcolor="#424242"/></body></html>');
	} else if ($(this).parent().parent().find("audio").attr("data-type") == "html5audio") {
		// HTML5 audio player
		var url = $(this).parent().parent().find("source").attr("src");
		var filename = url.substring(url.lastIndexOf('/')+1);
		var type = $(this).parent().parent().find("source").attr("type");
		var windowhtml = window.open("", url, "width=500,height=60");
		var doctitle;
		windowhtml.document.write('<html><head><title>Peek Preview - ' + filename + '</title><style>html,body{margin:0!important;padding:0!important;background:#212121!important}audio{width:100%!important;height:100%!important}video,audio{box-shadow:inset 0 0 0 1px #212121!important;width:100%!important;height:100%!important}video{background:url("' + preloader + '") no-repeat center #424242!important}</style></head><body><audio controls><source src="' + url + '" type="' + type + '"></video></body></html>');
	} else {
		alert("There was an error generating a popup.");
	}
});

function reloadTooltips() {
	// Video files
	$("a[href$='.webm']").each(function() {
		previewVideo($(this), "video/webm");
	});
	$("a[href$='.mp4']").each(function() {
		previewVideo($(this), "video/mp4");
	});
	$("a[href$='.m4v']").each(function() {
		previewVideo($(this), "video/mp4");
	});
	$("a[href$='.ogg']").each(function() {
		previewVideo($(this), "video/ogg");
	});
	$("a[href$='.ogv']").each(function() {
		previewVideo($(this), "video/ogg");
	});
	$("a[href$='.gifv']").each(function() {
		if ( (window.location.href.indexOf("reddit.com") > -1) && ($("body").hasClass("res")) ) {
			log("Reddit Enhancement Suite extension detected, disabling GIFV preview.");
		} else {
			previewVideo($(this), "video/mp4");
		}
	});
	// Audio files
	$("a[href$='.mp3']").each(function() {
		previewAudio($(this), "audio/mpeg");
	});
	$("a[href$='.m4a']").each(function() {
		previewAudio($(this), "audio/mp4");
	});
	$("a[href$='.oga']").each(function() {
		previewAudio($(this), "audio/ogg");
	});
	$("a[href$='.wav']").each(function() {
		previewAudio($(this), "audio/wav");
	});
	// Google Docs links
	$("a[href^='https://docs.google.com/d'],a[href^='https://drive.google.com/open']").each(function() {
		previewHostedDocs($(this));
	});
	// Gfycat links
	$("a[href^='http://gfycat.com/'],a[href^='https://gfycat.com/']").each(function() {
		if ( (window.location.href.indexOf("reddit.com") > -1) && ($("body").hasClass("res")) ) {
			log("Reddit Enhancement Suite extension detected, disabling Gfycat preview");
		} else {
			previewGfycat($(this));
		}
	});
	// Giphy links
	$("a[href*='i.giphy.com'],a[href*='media.giphy.com'],a[href*='giphy.com/gifs']").each(function() {
		previewGiphy($(this));
	});
	// Office documents
	chrome.runtime.sendMessage({method: "getLocalStorage", key: "docviewer"}, function(response) {
		if (response.data === "google") {
			$("a[href$='.doc']").each(function() {
				previewDocs($(this));
			});
			$("a[href$='.docx']").each(function() {
				previewDocs($(this));
			});
			$("a[href$='.xls']").each(function() {
				previewDocs($(this));
			});
			$("a[href$='.xlsx']").each(function() {
				previewDocs($(this));
			});
			$("a[href$='.ppt']").each(function() {
				previewDocs($(this));
			});
			$("a[href$='.pptx']").each(function() {
				previewDocs($(this));
			});
		} else {
			$("a[href$='.doc']").each(function() {
				previewOffice($(this));
			});
			$("a[href$='.docx']").each(function() {
				previewOffice($(this));
			});
			$("a[href$='.xls']").each(function() {
				previewOffice($(this));
			});
			$("a[href$='.xlsx']").each(function() {
				previewOffice($(this));
			});
			$("a[href$='.ppt']").each(function() {
				previewOffice($(this));
			});
			$("a[href$='.pptx']").each(function() {
				previewOffice($(this));
			});
		}
	});
	// Other Documents
	$("a[href$='.pdf']").each(function() {
		previewDocs($(this));
	});
	$("a[href$='.rtf']").each(function() {
		previewDocs($(this));
	});
}

// Initialize tooltips when URL changes (fix for Google search results)
window.addEventListener("hashchange", function() {
	console.log("onhashchange");
	var rendered = [];
	chrome.runtime.sendMessage({method: "resetIcon", key: ""});
	reloadTooltips();
}, false);

// Initialize tooltips every time DOM is modified
var observer = new MutationObserver(function(mutations) {
	mutations.forEach(function(mutation) {
		var newNodes = mutation.addedNodes; // DOM NodeList
			if( newNodes !== null ) { // If there are new nodes added
				log("DOM change detected, reinitializing previews");
			reloadTooltips();
			}
	});
});

var observerConfig = {
	attributes: true,
	childList: true
};

// Initialize tooltips for initial page load
$(document).ready(function() {
	reloadTooltips();
	if ((window.location.href.indexOf("google.com/search") != -1) && (navigator.userAgent.toLowerCase().indexOf('chrome') > -1)) {
		// Fix for Google search results not working properly, but this doesn't work in Opera for some strange reason
		window.addEventListener('message', function(e) {
				if (typeof e.data === 'object' && e.data.type === 'sr') {
					rendered = [];
						reloadTooltips();
				}
		});
	} else {
		// All other pages
		observer.observe(document, observerConfig);
	}
});