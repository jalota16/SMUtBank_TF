function parseCSVFromFile() {
	var start, end;

	console.log("pressed");
	if (!$('#filesParseCSV')[0].files.length) {
		alert("Please choose at least one file to parse.");
	} else {
		$("#results > tbody").empty();
		$('#filesParseCSV')
				.parse(
						{

							delimiter : ",",
							header : false,
							dynamicTyping : true,
							config : {
								error : function(file, inputElem, reason) {

								},
								complete : function(data, file, inputElem,
										event) {
									printTable(data);

								}
							},
							before : function(file, inputElem) {
								// console.log(file);
								// console.log(inputElem);
								start = now();
								var name = file.name;
								var n = name.indexOf('.');
								var custName = name.substring(0, n != -1 ? n
										: name.length);
								//var realCustomerId = custName.split("_")[2];
								//if (!isNumber(realCustomerId)) {
								//	$('#cusNameFromFile')
								//			.text(
								//					"File Name Invalid: Please use this format: corp_name_customerid.csv");
								//} else {
								//	if (1 === 1) {
								//		$('#cusNameFromFile').text(
								//				"Customer Id: "
								//						+ realCustomerId);
								//	}
								//}

								// TO DO
								// call rest to check if customer exist or not

								// just add a dummy statement for now. we will
								// just sat that the rest
								// call is alright for now
							},

						});

	}
	end = now();
	console.log("start:" + start);
	console.log("end:" + end);
}

function parseCSVFromFile1() {
	console.log("pressed");
	if (!$('#filesParseCSV')[0].files.length) {
		alert("Please choose at least one file to parse.");

	} else {

		$('#filesParseCSV')
				.parse(
						{
							config : userConfig(),
							before : function(file, inputElem) {
								console.log(file);
								console.log(inputElem);
								var name = file.name;
								var n = name.indexOf('.');
								var custName = name.substring(0, n != -1 ? n
										: name.length);
								///var realCustomerId = custName.split("_")[2];
								//if (!isNumber(realCustomerId)) {
								//	$('#cusNameFromFile')
								//			.append(
								//					"File Name Invalid: Please use this format: corp_name_customerid.csv");
								//} else {
								//	if (1 === 1) {
								//		$('#cusNameFromFile').append(
								//				"Customer Id: "
								//						+ realCustomerId);
								//	}
								//}

								// TO DO
								// call rest to check if customer exist or not

								// just add a dummy statement for now. we will
								// just sat that the rest
								// call is alright for now
							},
							error : function(file, inputElem, reason) {

							},
							complete : function(data, file, inputElem, event) {
								console.log("COMPLETE1", data, file, inputElem,
										event);
								render(data);

							},

						});

	}
}

function printTable(results) {

	var error = false;
	$.each(results.data, function(i, el) {

		// check if row is empty
		if (el.length > 1) {
			var row = $("<tr/>");
			$.each(el, function(j, cell) {

				if (!checkDateformat(el[2])) {
					error = true;
					el[1] = "<b>" + el[2] + "</b> <--- Invalid date.";
				}

				// check if payment amount is number
				if (!isNumber(el[3])) {

					error = true;
					el[2] = "<b>" + el[3] + "</b> Integers only";

				} 
				if (decimalPlaces(el[3]) > 2) {
					// check if it's exactly two decimal places
					error = true;
					el[2] = "<b>" + el[3] + "</b> Two decimal places only";
					
				} 
				if (isNegative(el[3])) {
					error = true;
					el[2] = "<b>" + el[3] + "</b> Positive numbers only";
				}

				// draw cells
				if (cell !== "") {
					// console.log(error);
					if (error === true) {
						row.append($("<td/>").html(cell));
						row.attr("bgcolor", "#FF6666");

					} else {
						row.append($("<td/>").text(cell));
					}
				}
			});
			$("#results tbody").append(row);

		}

		// /if error is true, add reset button...

	});
	$("#results").attr("border", "1");

	console.log(error);
	if (error === true) {
		// got error,
		$("#submitParseCSV").css("visibility", "visible");
		$("#resetUploadfunction").css("visibility", "visible");
		$("#uploadParsedCSVFile").css("visibility", "hidden");
		$("#csvErrors")
				.text(
						"Errors have been detected with the CSV file. Please correct the errors and try again.");

	} else {
		// no error, allow user to upload file
		// hide current parse file
		// display the upload button
		$("#submitParseCSV").css("visibility", "hidden");
		$("#uploadParsedCSVFile").css("visibility", "visible");
		$("#resetUploadfunction").css("visibility", "visible");
		$("#csvErrors").empty();
		$("#csvErrors")
		.text(
				"No errors found with the payment instructions, proceeding to upload!");
		uploadFileViaAjax();
		 
	}

}

function sleep(milliseconds) {
	  var start = new Date().getTime();
	  for (var i = 0; i < 1e7; i++) {
	    if ((new Date().getTime() - start) > milliseconds){
	      break;
	    }
	  }
	}

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}
function now() {
	return typeof window.performance !== 'undefined' ? window.performance.now()
			: 0;
}
function decimalPlaces(num) {
	var match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
	if (!match) {
		return 0;
	}
	return Math.max(0,
	// Number of digits right of decimal point.
	(match[1] ? match[1].length : 0)
	// Adjust for scientific notation.
	- (match[2] ? +match[2] : 0));
}

function isNegative(number) {
	return number < 0;
}

function checkDateformat(date) {

	var date_regex = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;

	if (!date_regex.test(date)) {
		return false;
	} else {

		var dateSplit = date.split("-");

		// check if date is correct length
		if (dateSplit[0].length !== 4) {  //year
			return false;
		}
		if (dateSplit[1].length !== 2) {  //month
			return false;
		}
		if (dateSplit[2].length !== 2) {   ///day
			return false;
		}
		 
		var date = Date.parse(date);

		// check if date is logical = data cannot be before today's date
		if (new Date() >= date) {
			return false;
		}

	}
	return true;

}

function uploadFileViaAjax() {

	var form = new FormData();
	form.append("filesParseCSV", $("#filesParseCSV")[0].files[0]);

	$.ajax({
		url : "./PaymentsFileUploadServlet",
		type : "POST",
		data : form,
		async : false,
		cache : false,
		contentType : 'multipart/form-data',
		enctype : 'multipart/form-data',
		processData : false, // tell jQuery not to process the data
		contentType : false,
		success : function(data) {
			// alert(data.upload)
			if (data.upload === "true") {
				// upload succesful, clear screen and reset uplaod
				var modal = new myPop();
	            modal.popOut("<p>Upload Succesful!</p>");
				//alert("Upload succesful");
				resetUploadArea();
			}else if (data.upload === "false"){
				var modal = new myPop();
	            modal.popOut("<p>Upload Unsuccesful Due To System Error</p>");
				//alert("Upload succesful");
				resetUploadArea();
			}else {
				var modal = new myPop();
	            modal.popOut("<p>Unload Unsuccesful, Please Check Errors And Rectify Them</p>");
				$("#csvErrors").text("Unload Unsuccesful, Please Check Errors And Rectify Them");
				$("#results > tbody").empty();
//				var header = "<tr  bgcolor='#D0D0D0'><th>Line Number</th><th>Instrument Type</th>" +
//						"<th>Date</th><th>Amount</th><th>Currency</th><th>Sender BIC Code</th>" +
//						"<th>Sender Account Number</th><th>Receiver BIC Code</th>" +
//						"<th>Receiver Account Number</th><th>Reference Number</th>" +
//						"<th>Comment</th></tr>";
				var header = "<tr  bgcolor='#D0D0D0'><th>Line Number</th><th>Instrument Type</th>" +	// AM 20150520 remove Currency column
				"<th>Date</th><th>Amount</th><th>Sender BIC Code</th>" +
				"<th>Sender Account Number</th><th>Receiver BIC Code</th>" +
				"<th>Receiver Account Number</th><th>Reference Number</th>" +
				"<th>Comment</th></tr>";
				$("#results").append(header);
				console.log(data.upload);
				$("#results tbody").append(data.upload);				
				$("#results").attr("border", "1");
				$("#results").append(header);
				$("#uploadParsedCSVFile").css("visibility", "hidden");
			}
		}
	});

	return false;
}

function showButtons() {
	$("#submitParseCSV").css("visibility", "visible");
	$("#resetUploadfunction").css("visibility", "visible");
	$("#uploadParsedCSVFile").css("visibility", "hidden");
}

function resetUploadArea() {
	// clear the table.
	// reset the buttons

	// empty table
	$("#results > tbody").empty();

	// empty customer name
	$('#cusNameFromFile').empty();

	$("#csvErrors").empty();

	// reset form
	$("#filesParseCSV").replaceWith($("#filesParseCSV").clone());

	// update buttons
	$("#submitParseCSV").css("visibility", "hidden");
	$("#resetUploadfunction").css("visibility", "hidden");
	$("#uploadParsedCSVFile").css("visibility", "hidden");

}


