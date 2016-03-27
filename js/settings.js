/*
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see http://www.gnu.org/licenses/.
*/

$(window).load(function() {
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
  }
});

$(document).on('change', "input", function() {
  localStorage["docviewer"] = $("#docviewer input[type='radio']:checked").val();
  if ($("#console input").is(":checked")) {
    localStorage["console"] = "true";
  } else {
    localStorage["console"] = "false";
  }
});

$(document).on('click', "input[value='Donate via Bitcoin']", function() {
  $("#bitcoin").show();
});

$(document).on('click', "input[value='Donate via PayPal']", function() {
  window.open('https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=4SZVSMJKDS35J&lc=US&item_name=Peek%20Donation&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted', '_blank');
});
