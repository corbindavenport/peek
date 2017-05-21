/*
The MIT License (MIT)

Copyright (c) 2017 Corbin Davenport

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

$(window).on('load', function() {
  $("#bitcoin").hide();
  if ($("input[value='google']")) {
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
  }
});

$(document).on('change', "input", function() {
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
});

$(document).on('click', "input[value='Donate via Bitcoin']", function() {
  $("#bitcoin").show();
});

$(document).on('click', "input[value='Donate via PayPal']", function() {
  window.open('https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=4SZVSMJKDS35J&lc=US&item_name=Peek%20Donation&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted', '_blank');
});
