// Read settings from localStorage
if (localStorage.getItem("docviewer") === "google") {
  $("input[value='google']").prop("checked", true);
} else {
  $("input[value='office']").prop("checked", true);
}
if (localStorage.getItem("gifpreview") === "on") {
  $("input[value='on']").prop("checked", true);
} else {
  $("input[value='off']").prop("checked", true);
}
if (localStorage.getItem("console") === "true") {
  $("input[value='console']").prop("checked", true);
}
if (localStorage.getItem("previewlimit") === "true") {
  $("input[value='previewlimit']").prop("checked", true);
}

// Save settings after any input change
$(document).on('change', "input", function () {
  localStorage["docviewer"] = $("#docviewer input[type='radio']:checked").val();
  if ($("#console input").is(":checked")) {
    localStorage["console"] = "true";
  } else {
    localStorage["console"] = "false";
  }
  if ($("#previewlimit input").is(":checked")) {
    localStorage["previewlimit"] = "true";
  } else {
    localStorage["previewlimit"] = "false";
  }
})

// Show instructions for leaving a review based on the browser being used
var useragent = navigator.userAgent;

// Opera has to be checked before Chrome, because Opera has both "Chrome" and "OPR" in the user agent string
var review = document.querySelector('.review-info')
if (useragent.includes("OPR")) {
  review.innerHTML = 'Leaving a review on the <a href="https://addons.opera.com/en/extensions/details/peek/" target="_blank">Opera add-ons site</a> is also greatly appreciated!'
} else if (useragent.includes("Chrome")) {
  review.innerHTML = 'Leaving a review on the <a href="https://chrome.google.com/webstore/detail/peek/bfpogemllmpcpclnadighnpeeaegigjk" target="_blank">Chrome Web Store</a> is also greatly appreciated!'
}