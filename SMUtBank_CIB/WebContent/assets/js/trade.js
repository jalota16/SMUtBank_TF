var trade = {};
var LC = {};

LC.LCList = null;
fundTransfer.customerID = null;
trade.retrievedLC = null;
trade.selectedLCList = null;
trade.selectedLCs = null;
var exporterIDToFind = null;
var importerIDToFind = null;
var binaryData = null;
var docsArr = [];
var ictr = 0;
var htmlcode = "";
var systemCustomerID = 0;
var systemBankID = 0;

trade.init = function() {
	trade.stencils = {
		tradeMain : stencil.define("tradeMain", "#main"),
		tradeMenu : stencil.define("tradeMenu", "#tradeContainer"),
		importerPage : stencil.define("importerPage", "#tradeContainer"),
		exporterPage : stencil.define("exporterPage", "#tradeContainer"),
		applyLC : stencil.define("applyLC", "#importerFunctions"),
		acknowledgeLC : stencil.define("acknowledgeLC", "#exporterFunctions"),
		amendLCapplication : stencil.define("amendLCapplication",
				"#importerFunctions"),
		LCEnquiry : stencil.define("LCEnquiry", "#importerFunctions"),
		LCList : stencil.define("LCList", "#LCList"),
		LClistError : stencil.define("LClistError", "none"),
		LCListHeader : stencil.define("LCListHeader", "#LCListHeader"),
		searchLCList : stencil.define("searchLCList", "#searchLCList"),
		addLC : stencil.define("addLC", "none"),
		LCDetailsToAddStencil : stencil.define("LCDetailsToAddStencil",
				"#LCDetailsToAdd"),
		importerNotifications : stencil.define("importerNotifications",
				"#importerFunctions"),
				exporterNotifications : stencil.define("exporterNotifications",
				"#exporterFunctions"),
		LCEnquiryExp : stencil.define("LCEnquiryExp", "#exporterFunctions"),
		LCListExp : stencil.define("LCListExp", "#LCListExp"),
		LClistErrorExp : stencil.define("LClistErrorExp", "none"),
		LCListHeaderExp : stencil.define("LCListHeaderExp", "#LCListHeaderExp"),
		searchLCListExp : stencil.define("searchLCListExp", "#searchLCListExp"),
		exporterAccRejBtn : stencil.define("exporterAccRejBtn",
				"#exporterAccRejBtn"),
		teachingMenuImporter : stencil.define("teachingMenuImporter",
		"#importerFunctions"),
		teachingMenuExporter: stencil.define("teachingMenuExporter","#exporterFunctions"),
		LCTeach: stencil.define("LCTeach","none"),
		TRTeach: stencil.define("TRTeach","none"),
		SGTeach: stencil.define("SGTeach","none"),
		BGTeach: stencil.define("BGTeach","none"),
		BDTeach: stencil.define("BDTeach","none"),
		uploadMainPage: stencil.define("uploadMainPage","#exporterFunctions"),
		LCDetailsToAddAmendStencil: stencil.define("LCDetailsToAddAmendStencil",
		"#LCDetailsToAddAmend"),
		addAmendLC: stencil.define("addAmendLC", "none"),
		ShippersGuaranteePage: stencil.define("ShippersGuaranteePage","#importerFunctions"),
		addSG : stencil.define("addSG", "none"),
		SGDetailsToAddStencil : stencil.define("SGDetailsToAddStencil",
		"#SGDetailsToAdd")
	};
};

trade.buildPage = function() {
	trade.stencils.tradeMain.render({});
	trade.buildTradeMenu();

};

trade.buildTradeMenu = function() {
	trade.stencils.tradeMenu.render({});
	$("#main").fadeIn();
};

trade.buildImporterPage = function() {
	trade.stencils.importerPage.render({});
	trade.stencils.teachingMenuImporter.render({});

};

trade.buildLCApplicationPage = function() {

	trade.stencils.applyLC.render({});
	// console.log(fundTransfer.getCustomerID());

	document.getElementById("expiryPlace").innerHTML = ui.getCountryOptions();
	document.getElementById("shipDest").innerHTML = ui.getCountryOptions();
	document.getElementById("currency").innerHTML = ui.getCurrencyOptions();
	document.getElementById("date").innerHTML = Date();

	$('#importerAccNum')
			.keyup(
					function() {

						var populater = function(response, extras) {

							console.log(response.esbStatus);
							var message = "";

							message = response.esbStatus;
							console.log(message);
							console.log(response);
							if (response.esbStatus == "invocation successful") {
								importerIDToFind = response["customerID1"];
								systemCustomerID = response["customerID1"];
								systemBankID = response["bankID"];
								var populater = function(responseForImp, extras) {

									console.log(responseForImp.esbStatus);
									var message = "";

									message = responseForImp.esbStatus;
									console.log(message);
									console.log(responseForImp);
									document.getElementById("importerNameAdd").style.color = 'black';
									document.getElementById("importerNameAdd").innerHTML = responseForImp["givenName1"]
											+ ", " + responseForImp["city1"];

								};
								var payload = '{"ServiceDomain":"Party","OperationName":"Party_Customer_Read", "customerID":"'
										+ importerIDToFind + '"}';
								console.log(importerIDToFind);
								network
										.doESB(
												populater,
												"Party_Customer_ReadResponse",
												'["streetAddress1","city","givenName"]',
												payload, null, true);

								// document.getElementById("importerNameAdd").style.color='black';
								// document.getElementById("importerNameAdd").innerHTML
								// = importerIDToFind;

							} else {
								document.getElementById("importerNameAdd").style.color = 'red';
								document.getElementById("importerNameAdd").innerHTML = "Please Enter a valid Account number!";
							}

						};
						var payload = '{"ServiceDomain":"Account","OperationName":"Account_Deposit_Read", "accountID":"'
								+ document.getElementById("importerAccNum").value
								+ '"}';

						network.doESB(populater,
								"Account_Deposit_ReadResponse",
								'["customerID"]', payload, null, true);

					});

	$('#benAccountNumber')
			.keyup(
					function() {

						var populater = function(response, extras) {

							console.log(response.esbStatus);
							var message = "";

							message = response.esbStatus;
							console.log(message);
							console.log(response);
							if (response.esbStatus == "invocation successful") {
								exporterIDToFind = response["customerID1"];
								var populater = function(response, extras) {

									console.log(response.esbStatus);
									var message = "";

									message = response.esbStatus;
									console.log(message);
									console.log(response);
									//document.getElementById("benNameAddress").style.color = 'black';
									//document.getElementById("benNameAddress").innerHTML = response["givenName1"]
											+ ", " + response["city1"];

								};
								var payload = '{"ServiceDomain":"Party","OperationName":"Party_Customer_Read", "customerID":"'
										+ exporterIDToFind + '"}';
								console.log(exporterIDToFind);
								network
										.doESB(
												populater,
												"Party_Customer_ReadResponse",
												'["streetAddress1","city","givenName"]',
												payload, null, true);

								// document.getElementById("benNameAddress").style.color='black';
								// document.getElementById("benNameAddress").innerHTML
								// = exporterIDToFind;
							} else {
								//document.getElementById("benNameAddress").style.color = 'red';
								//document.getElementById("benNameAddress").innerHTML = "No Such Account Number!";
							}

						};
						var payload = '{"ServiceDomain":"Account","OperationName":"Account_Deposit_Read", "accountID":"'
								+ document.getElementById("benAccountNumber").value
								+ '"}';

						network.doESB(populater,
								"Account_Deposit_ReadResponse",
								'["customerID"]', payload, null, true);

					});

};


trade.buildExporterPage = function() {
	trade.stencils.exporterPage.render({});
	trade.stencils.teachingMenuExporter.render({});

};

trade.addLC = function() {

	var modal = new myPop();
	var LCData = [];
	var expiryDate = document.getElementById("expiryDate").value;
	var expiryPlace = document.getElementById("expiryPlace").value;
	var amount = document.getElementById("amount").value;

	var currency = document.getElementById("currency").value;
	var revocable = document.getElementById("revocable").value;
	var confirmation = document.getElementById("confirmed").value;
	var shipTo = document.getElementById("shipDest").value;
	var docsReq = document.getElementById("invoicesAndDocs").value;
	var goodsDesc = document.getElementById("specialInstruct").value;
	var addConditions = document.getElementById("goodsDescription").value;
	var shipPeriod = document.getElementById("shipPeriod").value;
	LCData.push({
		expiryDate : expiryDate,
		expiryPlace : expiryPlace,
		amount : amount,
		currency : currency,
		revocable : revocable,
		confirmation : confirmation,
		shipTo : shipTo,
		docsReq : docsReq,
		goodsDesc : goodsDesc,
		addConditions : addConditions,
		shipPeriod : shipPeriod

	});
	var isValid = true;
	var errorMsg = [];
	var ctr = 0;

	if (amount == "") {
		errorMsg[ctr] = "Please enter a valid Amount in figures";
		ctr++;
		isValid = false;
	}
	if (expiryDate == "") {
		errorMsg[ctr] = "Please choose a valid Expiry Date";
		ctr++;
		isValid = false;
	}
	if (shipPeriod == "") {
		errorMsg[ctr] = "Please enter a valid shipment period";
		ctr++;
		isValid = false;
	}
	if (shipTo == "") {
		errorMsg[ctr] = "Please enter a valid shipment destination";
		ctr++;
		isValid = false;

	}
	if (isValid == true) {
		document.getElementById("applyMessage").innerHTML = " ";
		modal.popOut(trade.stencils.addLC.render(LCData, "string"));

	} else {
		console.log(errorMsg);
		document.getElementById("applyMessage").innerHTML = "<div id = 'LCCreateerror' class='alert alert-danger' role='alert'></div>";
		document.getElementById("LCCreateerror").innerHTML = "<ul style= 'list-style-type:none;' id = 'errorList'><li id = '1'></li><li id = '2'></li><li id = '3'></li><li id = '4'></li></ul>";
		if (errorMsg[0] != undefined) {
			document.getElementById("1").innerHTML = errorMsg[0];
		}
		if (errorMsg[1] != undefined) {
			document.getElementById("2").innerHTML = errorMsg[1];
		}
		if (errorMsg[2] != undefined) {
			document.getElementById("3").innerHTML = errorMsg[2];
		}
		if (errorMsg[3] != undefined) {
			document.getElementById("4").innerHTML = errorMsg[3];
		}
	}

	trade.stencils.LCDetailsToAddStencil.render(LCData);
};

trade.applyLC = function() {
	
	var populater = function(response, extras) {
		console.log(response.esbStatus);
		var message = "";
		if (response.esbStatus == "invocation successful") {
			trade.triggerBPMApplyLC(response["ns:ref_num1"]);
			trade.buildNotificationsPage(response["ns:ref_num1"]);
			ui.closePopup();
			systemCustomerID = response["CustomerId"];
			systemBankID = response["bankID"];
			
			console.log("++++" + importerIDToFind);
			console.log("++++" + exporterIDToFind);
			

		} else if (response.esbStatus == "record not found"
				|| response.esbStatus == "input Account ID not exist")
			message = "Not Valid";
		else
			message = response.esbStatus;
	};

	var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LC_Create", "importer_ID":"'
			+ importerIDToFind
			+ '", "exporter_ID":"'
			+ exporterIDToFind
			+ '", "importer_account_num":"'
			+ document.getElementById("importerAccNum").value
			+ '", "exporter_account_num":"'
			+ document.getElementById("benAccountNumber").value
			+ '", "expiry_date":"'
			+ document.getElementById("expiryDateM").value
			+ '", "expiry_place":"'
			+ document.getElementById("expiryPlaceM").value
			+ '", "confirmed":"'
			+ document.getElementById("confirmedM").value
			+ '", "revocable":"'
			+ document.getElementById("revocableM").value
			+ '", "amount":"'
			+ document.getElementById("amountM").value
			+ '", "currency":"'
			+ document.getElementById("currencyM").value
			+ '", "applicable_rules":"'
			+ "?"
			+ '", "partial_shipments":"'
			+ false
			+ '", "ship_destination":"'
			+ document.getElementById("shipToM").value
			+ '", "ship_date":"'
			+ "2015-07-01"
			+ '", "ship_period":"'
			+ document.getElementById("shipPeriodM").value
			+ '", "goods_description":"'
			+ document.getElementById("goodsDescM").value
			+ '", "docs_required":"'
			+ "?"
			+ '", "additional_conditions":"'
			+ document.getElementById("addConditionsM").value
			+ '", "sender_to_receiver_info":"' + "?" + '"}';
	network.doESB(populater, "Trade_LC_CreateResponse",
			'["ns:status","ns:ref_num"]', payload, null, true);

};

trade.triggerBPMApplyLC = function(ref_num){
	console.log(ref_num);
	var populater = function(response,extras){
		console.log("WORKS!");
		console.log(response);
		
	};
	
	
	var payload = '{"ServiceDomain":"BPM","OperationName":"BPM_LC_Issue", "RefNum":"'
		+ ref_num + '"}';

network.doESB(populater,"BPM_LC_IssueResponse",'[]', payload, null, true);
	
};


trade.buildLCAmendementApplicationPage = function() {

	trade.stencils.amendLCapplication.render({});
	document.getElementById("expiryPlace").innerHTML = ui.getCountryOptions();
	document.getElementById("shipDest").innerHTML = ui.getCountryOptions();
	document.getElementById("currency").innerHTML = ui.getCurrencyOptions();
	$('#amendRefNum').keyup(function(){
		trade.getAmendDetails(document.getElementById('amendRefNum').value);
	});

};

trade.getAmendDetails = function(amend_ref_num){
	var populater = function(response, extras) {
		console.log(response);
		console.log("status is: "+response["ns:status1"]);
		if(response.esbStatus == "invocation successful"){
			
			document.getElementById("errorMsg").style.color = "black";
			document.getElementById("errorMsg").innerHTML = "";
			//set parameters
			document.getElementById("amount").value = response["ns:amount1"];
			document.getElementById("currency").value = response["ns:currency1"];
			document.getElementById("expiryDate").value = response["ns:expiry_date1"];
			document.getElementById("expiryPlace").value = response["ns:expiry_place1"];
			document.getElementById("importerAccNum").value = response["ns:importer_account_num1"];
			document.getElementById("benAccountNumber").value = response["ns:exporter_account_num1"];
			document.getElementById("confirmed").value = response["ns:confirmed1"];
			document.getElementById("revocable").value = response["ns:revocable1"];
			document.getElementById("shipPeriod").value = response["ns:ship_period1"];
			document.getElementById("shipDest").value = response["ns:ship_destination1"];
			document.getElementById("addConditions").value = response["ns:additional_conditions1"];
			document.getElementById("goodsDescription").value = response["ns:goods_description1"];
			document.getElementById("importerID").value = response["ns:importer_ID1"];
			document.getElementById("exporterID").value = response["ns:exporter_ID1"];
			
			
		} else {
			document.getElementById("errorMsg").style.color = "red";
			document.getElementById("errorMsg").innerHTML = "Invalid LC Reference Number";
			
			
		}

	};
	// var customerID = document.getElementById("customerID").value;
	// var startDate = document.getElementById("startDate").value;
	// var endDate = document.getElementById("endDate").value;
	// console.log(customerID);
	var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LC_Read", "ref_num":"'
			+ amend_ref_num + '"}';

	network
			.doESB(
					populater,
					"Trade_LC_ReadResponse",
					'["ns:status","ns:goods_description","ns:additional_conditions","ns:ship_period","ns:ship_destination","ns:confirmed","ns:revocable","ns:expiry_date","ns:ref_num","ns:status","ns:ship_date","ns:currency","ns:amount","ns:creation_datetime","ns:expiry_place","ns:importer_account_num","ns:exporter_account_num","ns:importer_ID","ns:exporter_ID"]',
					payload, null, true);
	
};

trade.amendAddLC = function() {

	var modal = new myPop();
	var LCData = [];
	var amend_ref_num = document.getElementById("amendRefNum").value;
	var expiryDate = document.getElementById("expiryDate").value;
	var expiryPlace = document.getElementById("expiryPlace").value;
	var amount = document.getElementById("amount").value;

	var currency = document.getElementById("currency").value;
	var revocable = document.getElementById("revocable").value;
	var confirmation = document.getElementById("confirmed").value;
	var shipTo = document.getElementById("shipDest").value;
	var docsReq = document.getElementById("invoicesAndDocs").value;
	var goodsDesc = document.getElementById("addConditions").value;
	var addConditions = document.getElementById("goodsDescription").value;
	var shipPeriod = document.getElementById("shipPeriod").value;
	var importerID = document.getElementById("importerID").value;
	var exporterID = document.getElementById("exporterID").value;
	LCData.push({
		importerID: importerID,
		exporterID: exporterID,
		amend_ref_num: amend_ref_num,
		expiryDate : expiryDate,
		expiryPlace : expiryPlace,
		amount : amount,
		currency : currency,
		revocable : revocable,
		confirmation : confirmation,
		shipTo : shipTo,
		docsReq : docsReq,
		goodsDesc : goodsDesc,
		addConditions : addConditions,
		shipPeriod : shipPeriod

	});
	var isValid = true;
	var errorMsg = [];
	var ctr = 0;

	if (amount == "") {
		errorMsg[ctr] = "Please enter a valid Amount in figures";
		ctr++;
		isValid = false;
	}
	if (expiryDate == "") {
		errorMsg[ctr] = "Please choose a valid Expiry Date";
		ctr++;
		isValid = false;
	}
	if (shipPeriod == "") {
		errorMsg[ctr] = "Please enter a valid shipment period";
		ctr++;
		isValid = false;
	}
	if (shipTo == "") {
		errorMsg[ctr] = "Please enter a valid shipment destination";
		ctr++;
		isValid = false;

	}
	if (isValid == true) {
		document.getElementById("applyMessage").innerHTML = " ";
		modal.popOut(trade.stencils.addAmendLC.render(LCData, "string"));

	} else {
		console.log(errorMsg);
		document.getElementById("applyMessage").innerHTML = "<div id = 'LCCreateerror' class='alert alert-danger' role='alert'></div>";
		document.getElementById("LCCreateerror").innerHTML = "<ul style= 'list-style-type:none;' id = 'errorList'><li id = '1'></li><li id = '2'></li><li id = '3'></li><li id = '4'></li></ul>";
		if (errorMsg[0] != undefined) {
			document.getElementById("1").innerHTML = errorMsg[0];
		}
		if (errorMsg[1] != undefined) {
			document.getElementById("2").innerHTML = errorMsg[1];
		}
		if (errorMsg[2] != undefined) {
			document.getElementById("3").innerHTML = errorMsg[2];
		}
		if (errorMsg[3] != undefined) {
			document.getElementById("4").innerHTML = errorMsg[3];
		}
	}

	trade.stencils.LCDetailsToAddAmendStencil.render(LCData);
};

trade.amendLC = function() {
	
	var populater = function(response, extras) {
		console.log(response.esbStatus);
		var message = "";
		if (response.esbStatus == "invocation successful") {
			Date.prototype.yyyymmdd = function() {
				   var yyyy = this.getFullYear().toString();
				   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
				   var dd  = (this.getDate()+2).toString();
				   return yyyy + "-" + (mm[1]?mm:"0"+mm[0]) + "-" + (dd[1]?dd:"0"+dd[0]); // padding
				  };

				d = new Date();
				console.log();
			trade.triggerBPMAmendLC(document.getElementById("importerID").value, document.getElementById("amend_ref_num").value,"2015-08-01",d.yyyymmdd());
			//trade.triggerBPMAmendLC(response["ns:ref_num1"]);
			trade.buildNotificationsPage(response["ns:ref_num1"]);
			ui.closePopup();
			
			//console.log("++++" + importerIDToFind);
			//console.log("++++" + exporterIDToFind);
			

		} else if (response.esbStatus == "record not found"
				|| response.esbStatus == "input Account ID not exist")
			message = "Not Valid";
		else
			message = response.esbStatus;
	};

	var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LC_Update", "ref_num":"'
				+  document.getElementById("amend_ref_num").value
				+  '", "importer_ID":"'
			+ document.getElementById("importerID").value
			+ '", "exporter_ID":"'
			+ document.getElementById("exporterID").value
			+ '", "importer_account_num":"'
			+ document.getElementById("importerAccNum").value
			+ '", "exporter_account_num":"'
			+ document.getElementById("benAccountNumber").value
			+ '", "expiry_date":"'
			+ document.getElementById("expiryDate").value
			+ '", "expiry_place":"'
			+ document.getElementById("expiryPlaceM").value
			+ '", "confirmed":"'
			+ document.getElementById("confirmedM").value
			+ '", "revocable":"'
			+ document.getElementById("revocableM").value
			+ '", "amount":"'
			+ document.getElementById("amountM").value
			+ '", "currency":"'
			+ document.getElementById("currencyM").value
			+ '", "applicable_rules":"'
			+ "?"
			+ '", "partial_shipments":"'
			+ false
			+ '", "ship_destination":"'
			+ document.getElementById("shipToM").value
			+ '", "ship_date":"'
			+ "2015-07-01"
			+ '", "ship_period":"'
			+ document.getElementById("shipPeriodM").value
			+ '", "goods_description":"'
			+ document.getElementById("goodsDescM").value
			+ '", "docs_required":"'
			+ "?"
			+ '", "additional_conditions":"'
			+ document.getElementById("addConditionsM").value
			+ '", "sender_to_receiver_info":"' + "?" + '"}';
	network.doESB(populater, "Trade_LC_UpdateResponse",
			'["ns:status","ns:ref_num"]', payload, null, true);

};

trade.triggerBPMAmendLC = function(party_id,ref_num,startDate,endDate){
	console.log("BPM ref "+ref_num);
	var populater = function(response,extras){
		console.log("WORKS!");
		console.log(response);
		
	};
	
	
	var payload = '{"ServiceDomain":"BPM","OperationName":"BPM_LCAmendment_Issue", "Customer_ID":"'
		+ 206 
		+ '", "ref_num":"'
		+ "*"
		+ '", "Start_DateTime":"'
		+ "2015-01-01 00:00:00"
		+'", "End_DateTime":"'
		+ "2016-01-01 00:00:00"
		+'"}';

network.doESB(populater,"BPM_LCAmendment_IssueResponse",'[]', payload, null, true);
	
};

trade.buildLCEnquiryPage = function() {
	trade.stencils.LCEnquiry.render({});

};

trade.getLCList = function() {

	var populater = function(response, extras) {
		console.log(response.esbStatus);
		var message = "";
		LC.LCList = response;
		message = response.esbStatus;
		console.log(message);
		console.log(response);
		console.log(extras);
		var LCData = [];
		if (response["ns:ref_num.length"] > 0) {
			for (var i = 1; i <= response["ns:ref_num.length"]; i++) {
				// var searchterm = document.getElementById("LCSearch").value;
				// if(response["ns:ref_num" + i] == searchterm ||
				// response["ns:status" + i] == searchterm ){
				LCData.push({
					LC_ref_num : response["ns:ref_num" + i],
					LC_currency : response["ns:currency" + i],
					LC_status : response["ns:status" + i],
					LC_amount : response["ns:amount" + i],
					LC_ship_date : response["ns:ship_date" + i],
					LC_creation : response["ns:creation_datetime" + i]

				});
				// }
			}
			trade.stencils.searchLCList.render({});
			trade.stencils.LCListHeader.render({});
			trade.stencils.LCList.render(LCData);
			$('#LCSearch')
					.keyup(
							function() {
								var valThis = this.value.toLowerCase(), length = this.value.length;

								$('.LCList>li')
										.each(
												function() {
													console.log("Reached");
													var text = $(this).attr(
															'id'), textL = text
															.toLowerCase();
													// htmlR = '<b>' +
													// text.substr(0, length) +
													// '</b>' +
													// text.substr(length);

													(textL.indexOf(valThis) == 0) ? $(
															this).show()
															: $(this).hide();

												});
								console.log(valThis);

							});
			// document.getElementById("doGiroDelete").style.display = '';
		} else {

			$("#LCList").empty().append(trade.stencils.LClistError.render({
				errorMessage : "You have no LCs"
			}, "fragment"));
			// document.getElementById("doGiroDelete").style.display = 'none';
		}

	};
	var customerID = document.getElementById("customerID").value;
	var startDate = document.getElementById("startDate").value;
	var endDate = document.getElementById("endDate").value;
	console.log(customerID);
	var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LCList_Read", "customer_ID":"'
			+ customerID
			+ '", "start_datetime":"'
			+ startDate
			+ '", "end_datetime":"' + endDate + '"}';

	network.doESB(populater,
			"Trade_LCList_ReadResponse",
			'["ns:ref_num","ns:status","ns:ship_date","ns:currency","ns:amount","ns:creation_datetime"]',
			payload, null, true);

};

// Exporter Functions

trade.acknowledgeLCApplicationPage = function() {
	console.log("reached ackno");
	trade.stencils.acknowledgeLC.render({});
};

trade.getLCListSorted = function() {

	var populater = function(response, extras) {
		console.log(response.esbStatus);
		var message = "";
		LC.LCList = response;
		message = response.esbStatus;
		console.log(message);
		console.log(response);
		console.log(extras);
		var LCData = [];
		if (response["ns:ref_num.length"] > 0) {
			for (var i = 1; i <= response["ns:ref_num.length"]; i++) {
				// var searchterm = document.getElementById("LCSearch").value;
				// if(response["ns:ref_num" + i] == searchterm ||
				// response["ns:status" + i] == searchterm ){
				LCData.push({
					LC_ref_num : response["ns:ref_num" + i],
					LC_currency : response["ns:currency" + i],
					LC_status : response["ns:status" + i],
					LC_amount : response["ns:amount" + i],
					LC_ship_date : response["ns:ship_date" + i],
					LC_creation : response["ns:creation_datetime" + i]

				});

				// }
			}
			function compare(a, b) {
				if (a.LC_status < b.LC_status)
					return -1;
				if (a.LC_status > b.LC_status)
					return 1;
				return 0;
			}

			LCData.sort(compare);

			trade.stencils.searchLCList.render({});
			trade.stencils.LCListHeader.render({});
			trade.stencils.LCList.render(LCData);

			// document.getElementById("doGiroDelete").style.display = '';
		} else {

			$("#LCList").empty().append(trade.stencils.LClistError.render({
				errorMessage : "You have no LCs"
			}, "fragment"));
			// document.getElementById("doGiroDelete").style.display = 'none';
		}

	};
	var customerID = document.getElementById("customerID").value;
	var startDate = document.getElementById("startDate").value;
	var endDate = document.getElementById("endDate").value;
	console.log(customerID);
	var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LCList_Read", "customer_ID":"'
			+ customerID
			+ '", "start_datetime":"'
			+ startDate
			+ '", "end_datetime":"' + endDate + '"}';

	network
			.doESB(
					populater,
					"Trade_LCList_ReadResponse",
					'["ns:ref_num","ns:status","ns:ship_date","ns:currency","ns:amount","ns:creation_datetime"]',
					payload, null, true);

};
trade.getLCListSortedByRef = function() {

	var populater = function(response, extras) {
		console.log(response.esbStatus);
		var message = "";
		LC.LCList = response;
		message = response.esbStatus;
		console.log(message);
		console.log(response);
		console.log(extras);
		var LCData = [];
		if (response["ns:ref_num.length"] > 0) {
			for (var i = 1; i <= response["ns:ref_num.length"]; i++) {
				// var searchterm = document.getElementById("LCSearch").value;
				// if(response["ns:ref_num" + i] == searchterm ||
				// response["ns:status" + i] == searchterm ){
				LCData.push({
					LC_ref_num : response["ns:ref_num" + i],
					LC_currency : response["ns:currency" + i],
					LC_status : response["ns:status" + i],
					LC_amount : response["ns:amount" + i],
					LC_ship_date : response["ns:ship_date" + i],
					LC_creation : response["ns:creation_datetime" + i]

				});

				// }
			}
			function compare(a, b) {
				if (a.LC_ref_num < b.LC_ref_num)
					return -1;
				if (a.LC_ref_num > b.LC_ref_num)
					return 1;
				return 0;
			}

			LCData.sort(compare);

			trade.stencils.searchLCList.render({});
			trade.stencils.LCListHeader.render({});
			trade.stencils.LCList.render(LCData);

			// document.getElementById("doGiroDelete").style.display = '';
		} else {

			$("#LCList").empty().append(trade.stencils.LClistError.render({
				errorMessage : "You have no LCs"
			}, "fragment"));
			// document.getElementById("doGiroDelete").style.display = 'none';
		}

	};
	var customerID = document.getElementById("customerID").value;
	var startDate = document.getElementById("startDate").value;
	var endDate = document.getElementById("endDate").value;
	console.log(customerID);
	var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LCList_Read", "customer_ID":"'
			+ customerID
			+ '", "start_datetime":"'
			+ startDate
			+ '", "end_datetime":"' + endDate + '"}';

	network
			.doESB(
					populater,
					"Trade_LCList_ReadResponse",
					'["ns:ref_num","ns:status","ns:ship_date","ns:currency","ns:amount","ns:creation_datetime"]',
					payload, null, true);

};
trade.getLCListSortedByCreationDate = function() {

	var populater = function(response, extras) {
		console.log(response.esbStatus);
		var message = "";
		LC.LCList = response;
		message = response.esbStatus;
		console.log(message);
		console.log(response);
		console.log(extras);
		var LCData = [];
		if (response["ns:ref_num.length"] > 0) {
			for (var i = 1; i <= response["ns:ref_num.length"]; i++) {
				// var searchterm = document.getElementById("LCSearch").value;
				// if(response["ns:ref_num" + i] == searchterm ||
				// response["ns:status" + i] == searchterm ){
				LCData.push({
					LC_ref_num : response["ns:ref_num" + i],
					LC_currency : response["ns:currency" + i],
					LC_status : response["ns:status" + i],
					LC_amount : response["ns:amount" + i],
					LC_ship_date : response["ns:ship_date" + i],
					LC_creation : response["ns:creation_datetime" + i]

				});

				// }
			}
			function compare(a, b) {
				if (a.LC_creation < b.LC_creation)
					return -1;
				if (a.LC_creation > b.LC_creation)
					return 1;
				return 0;
			}

			LCData.sort(compare);

			trade.stencils.searchLCList.render({});
			trade.stencils.LCListHeader.render({});
			trade.stencils.LCList.render(LCData);

			// document.getElementById("doGiroDelete").style.display = '';
		} else {

			$("#LCList").empty().append(trade.stencils.LClistError.render({
				errorMessage : "You have no LCs"
			}, "fragment"));
			// document.getElementById("doGiroDelete").style.display = 'none';
		}

	};
	var customerID = document.getElementById("customerID").value;
	var startDate = document.getElementById("startDate").value;
	var endDate = document.getElementById("endDate").value;
	console.log(customerID);
	var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LCList_Read", "customer_ID":"'
			+ customerID
			+ '", "start_datetime":"'
			+ startDate
			+ '", "end_datetime":"' + endDate + '"}';

	network
			.doESB(
					populater,
					"Trade_LCList_ReadResponse",
					'["ns:ref_num","ns:status","ns:ship_date","ns:currency","ns:amount","ns:creation_datetime"]',
					payload, null, true);

};
trade.getLCListSearch = function() {

	var populater = function(response, extras) {
		console.log(response.esbStatus);
		var message = "";
		LC.LCList = response;
		message = response.esbStatus;
		console.log(message);
		console.log(response);
		console.log(extras);
		var LCData = [];
		if (response["ns:ref_num.length"] > 0) {
			for (var i = 1; i <= response["ns:ref_num.length"]; i++) {

				var searchterm = document.getElementById("LCSearch").value;
				if (response["ns:status" + i] == searchterm) {
					LCData.push({
						LC_ref_num : response["ns:ref_num" + i],
						LC_currency : response["ns:currency" + i],
						LC_status : response["ns:status" + i],
						LC_amount : response["ns:amount" + i],
						LC_ship_date : response["ns:ship_date" + i],
						LC_creation : response["ns:creation_datetime" + i]

					});
				}
			}
			trade.stencils.searchLCList.render({});
			trade.stencils.LCListHeader.render({});
			trade.stencils.LCList.render(LCData);

			// document.getElementById("doGiroDelete").style.display = '';
		} else {

			$("#LCList").empty().append(trade.stencils.LClistError.render({
				errorMessage : "You have no LCs"
			}, "fragment"));
			// document.getElementById("doGiroDelete").style.display = 'none';
		}

	};
	var customerID = document.getElementById("customerID").value;
	var startDate = document.getElementById("startDate").value;
	var endDate = document.getElementById("endDate").value;
	console.log(customerID);
	var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LCList_Read", "customer_ID":"'
			+ customerID
			+ '", "start_datetime":"'
			+ startDate
			+ '", "end_datetime":"' + endDate + '"}';

	network
			.doESB(
					populater,
					"Trade_LCList_ReadResponse",
					'["ns:ref_num","ns:status","ns:ship_date","ns:currency","ns:amount","ns:creation_datetime"]',
					payload, null, true);

};

// Notifications For Importer

trade.buildNotificationsPage = function(ref_num) {
	if (ref_num == undefined) {

		ref_num = 217;
	}
	var populater = function(response, extras) {
		console.log(response.esbStatus);
		var message = "";
		LCData = [];
		message = response.esbStatus;
		console.log(message);
		console.log(response);
		// console.log(extras);

		if (response["ns:ref_num.length"] > 0) {
			for (var i = 1; i <= response["ns:ref_num.length"]; i++) {
				// var searchterm = document.getElementById("LCSearch").value;
				// if(response["ns:ref_num" + i] == searchterm ||
				// response["ns:status" + i] == searchterm ){
				LCData.push({
					LC_ref_num : response["ns:ref_num" + i],
					LC_currency : response["ns:currency" + i],
					LC_status : response["ns:status" + i],
					LC_amount : response["ns:amount" + i],
					LC_ship_date : response["ns:ship_date" + i],
					LC_creation : response["ns:creation_datetime" + i]

				});
				// }
			}
			console.log(LCData);
			trade.stencils.importerNotifications.render(LCData);
			// trade.stencils.searchLCList.render({});
			// trade.stencils.LCListHeader.render({});
			// trade.stencils.LCList.render(LCData);
			/*
			 * $('#LCSearch').keyup(function () { var valThis =
			 * this.value.toLowerCase(), length = this.value.length;
			 * 
			 * $('.LCList>li').each(function () { console.log("Reached"); var
			 * text = $(this).attr('id'), textL = text.toLowerCase(); //htmlR = '<b>' +
			 * text.substr(0, length) + '</b>' + text.substr(length);
			 * 
			 * (textL.indexOf(valThis) == 0) ? $(this).show() : $(this).hide();
			 * 
			 * }); console.log(valThis);
			 * 
			 * });
			 */
			// document.getElementById("doGiroDelete").style.display = '';
		} else {

			$("#LCList").empty().append(trade.stencils.LClistError.render({
				errorMessage : "You have no LCs"
			}, "fragment"));
			// document.getElementById("doGiroDelete").style.display = 'none';
		}

	};
	// var customerID = document.getElementById("customerID").value;
	// var startDate = document.getElementById("startDate").value;
	// var endDate = document.getElementById("endDate").value;
	// console.log(customerID);
	var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LC_Read", "ref_num":"'
			+ ref_num + '"}';

	network
			.doESB(
					populater,
					"Trade_LC_ReadResponse",
					'["ns:ref_num","ns:status","ns:ship_date","ns:currency","ns:amount","ns:creation_datetime"]',
					payload, null, true);

	// document.getElementById("importNotificationsBtn").style.background='#999999';

};

/* Exporter Functions */

trade.buildLCAdvisePage = function() {
	trade.stencils.LCEnquiryExp.render({});

};

trade.getLCListForAdvise = function() {

	var populater = function(response, extras) {
		console.log(response.esbStatus);
		var message = "";
		LC.LCList = response;
		message = response.esbStatus;
		console.log(message);
		console.log(response);
		console.log(extras);
		var LCData = [];
		var ctr = 0;
		var counter = 0;
		if (response["ns:ref_num.length"] > 0) {
			// document.getElementById("customerID").innerHTML
			var fullID = document.getElementById("customerID").value;
			while (fullID.length < 10) {
				fullID = "0" + fullID;

			}
			console.log(document.getElementById("customerID").value);
			// document.getElementById("customerID").innerHTML = fullID;
			console.log(fullID);
			for (var i = 1; i <= response["ns:ref_num.length"]; i++) {
				// var searchterm = document.getElementById("LCSearch").value;
				// if(response["ns:ref_num" + i] == searchterm ||
				// response["ns:status" + i] == searchterm ){
				
				if (response["ns:status" + i] == "ADVISED"
						&& response["ns:exporter_ID" + i] == fullID) {
					ctr++;
					LCData.push({
						LC_ref_num : response["ns:ref_num" + i],
						LC_ID : response["ns:LC_ID" + i],
						LC_currency : response["ns:currency" + i],
						LC_status : response["ns:status" + i],
						LC_amount : response["ns:amount" + i],
						LC_ship_date : response["ns:ship_date" + i],
						LC_creation : response["ns:creation_datetime" + i],
						LC_importerID : response["ns:importer_ID" + i],
						LC_exporterID: response["ns:exporter_ID" + i],
						LC_importerAccount : response["ns:importer_account_num" + i],
						LC_exporterAccount: response["ns:exporter_account_num" + i],
						LC_expiry_place: response["ns:expiry_place" + i],
						LC_issue_date: response["ns:issue_date" + i],
						LC_confirmed: response["ns:confirmed" + i],
						LC_revocable: response["ns:revocable" + i],
						LC_ship_destination: response["ns:ship_destination" + i],
						LC_ship_date: response["ns:ship_date" + i],
						LC_ship_period: response["ns:ship_period" + i],
						LC_ship_destination: response["ns:ship_destination" + i],
						LC_expiry_date: response["ns:expiry_date" + i],
						ctx: counter

					});
				}
				counter++;
				console.log(LCData);

				// }
			}
			trade.stencils.searchLCListExp.render({});
			trade.stencils.LCListHeaderExp.render({});
			trade.stencils.LCListExp.render(LCData);
			trade.stencils.exporterAccRejBtn.render(LCData);
			if (ctr == 0) {

				$("#LCListExp")
						.empty()
						.append(
								trade.stencils.LClistError
										.render(
												{
													errorMessage : "You have no LCs that are pending review"
												}, "fragment"));
			}
			$('#LCSearchExp')
					.keyup(
							function() {
								var valThis = this.value.toLowerCase(), length = this.value.length;

								$('.LCListExp>li')
										.each(
												function() {
													console.log("Reached");
													var text = $(this).attr(
															'id'), textL = text
															.toLowerCase();
													// htmlR = '<b>' +
													// text.substr(0, length) +
													// '</b>' +
													// text.substr(length);

													(textL.indexOf(valThis) == 0) ? $(
															this).show()
															: $(this).hide();

												});
								console.log(valThis);

							});
			// document.getElementById("doGiroDelete").style.display = '';
		} else {

			$("#LCListExp").empty().append(trade.stencils.LClistError.render({
				errorMessage : "You have no LCs that are pending review"
			}, "fragment"));
			// document.getElementById("doGiroDelete").style.display = 'none';
		}

	};
	var customerID = document.getElementById("customerID").value;
	var startDate = document.getElementById("startDate").value;
	var endDate = document.getElementById("endDate").value;
	console.log(customerID);
	var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LCList_Read", "ref_num":"'
		+ "*"
		+ '", "customer_ID":"'
			+ customerID
			+ '", "start_datetime":"'
			+ startDate
			+ '", "end_datetime":"' + endDate + '"}';

	network.doESB(
					populater,
					"Trade_LCList_ReadResponse",
					'["ns:LC_ID","ns:ref_num","ns:status","ns:ship_date","ns:currency","ns:amount","ns:creation_datetime","ns:exporter_ID","ns:importer_account_num","ns:exporter_account_num","ns:expiry_place","ns:issue_date","ns:issue_date","ns:confirmed","ns:revocable","ns:ship_destination","ns:ship_date","ns:ship_period","ns:ship_destination","ns:expiry_date"]',
					payload, null, true);

	 $(function() {
		 console.log("Reached selectable");
	        $("#LCListExp").selectable({
	            stop: function() {
	                trade.selectedLCs = [];
	                $(".ui-selected", $("#LCListExp")).each(function() {
	                    if($(this).attr('id') != null && $(this).attr('id').indexOf("LCIndex") != -1) {
	                        var itemId = $(this).attr('id');
	                        var item = itemId.replace("LCIndex", "");
	                        trade.selectedLCs.push(item);
	                    }
	                });
	            }
	        });
	    });

};

trade.exporterAcceptRejectLC = function(acceptBoolean) {

	if (acceptBoolean == true) {
		trade.sendAcknowledgement(document.getElementById("ref_num").value,"accepted");
		var populater = function(response,extras){
			
			trade.buildExporterNotificationsPage(document.getElementById("ref_num").value,response["ns:status1"]);
			
			
		}
		var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LCStatus_Update", "ref_num":"'
			+ document.getElementById("ref_num").value
			+ '", "status":"'
			+ "AUTH_ACCEPT" + '"}';

		network.doESB(populater,"Trade_LCStatus_UpdateResponse",'["ns:status"]', payload, null, true);	
	}else{
		trade.sendAcknowledgement(document.getElementById("ref_num").value,"rejected");
		var populater = function(response,extras){
			
			console.log("Rejected!");
			trade.buildExporterNotificationsPage(document.getElementById("ref_num").value);
		}
		var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LCStatus_Update", "ref_num":"'
			+ document.getElementById("ref_num").value
			+ '", "status":"'
			+ "AUTH_REJECT" + '"}';

	network.doESB(populater,"Trade_LCStatus_UpdateResponse",'["ns:status"]', payload, null, true);	
	
	}
	
};
/*
	if (acceptBoolean == true) {
		 //Approve LC
 		var populater = function(response, extras) {
 			
 			console.log(response.esbStatus);
 			console.log(document.getElementById("LC_ID").value);
 		};
 
 		console.log(document.getElementById("ref_num").value);
 		var payload ='{"ServiceDomain":"Trade","OperationName":"Trade_MT730_Produce","LC_ID":"'
 	 		+ 104
 	 		+ '","ref_num":"'
 	 		+ 104
 	 		+ '","creation_datetime":"'
 	 		+ document.getElementById("creation").value
 	 		+ '",  "status":"'
 	 		+ "AUTH_ACCEPT"
 	 		+ '", "importer_ID":"'
 		+ 265
 		+ '", "importer_account_num":"'
 		+ document.getElementById("importerAccNum").value
 		+ '", "exporter_ID":"'
 		+ document.getElementById("exporterID").value
 		+ '", "exporter_account_num":"'
 		+ document.getElementById("benAccountNumber").value
 		+ '", "expiry_date":"'
 		+ document.getElementById("expiry_date").value
 		+ '", "expiry_place":"'
 		+ document.getElementById("expiry_place").value
 		+ '", "issue_date":"'
 		+ "2015-06-07"
 		+ '", "confirmed":"'
 		+ document.getElementById("confirmed").value
 		+ '", "revocable":"'
 		+ document.getElementById("revocable").value
 		+ '", "amount":"'
 		+ document.getElementById("amount").value
 		+ '", "currency":"'
 		+ document.getElementById("currency").value
 		+ '", "applicable_rules":"'
 		+ ""
 		+ '", "partial_shipments":"'
 		+ false
 		+ '", "ship_destination":"'
 		+ document.getElementById("ship_dest").value
 		+ '", "ship_date":"'
 		+ document.getElementById("ship_date").value
 		+ '", "ship_period":"'
 		+ document.getElementById("ship_period").value
 		+ '", "docs_required":"'
 		+ ""
 		+ '", "sender_to_receiver_info":"' + "" + '"}';
   
 	  network.doESB(populater, "Trade_MT730_ProduceResponse",'[]',payload, null, true);
	 
	 } else {
		  //Reject LC
		 //var populater = function(response, extras) {
			  //console.log(response);

 		//};

		
 		// var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LCList_Read", "customer_ID":"' + customerID + '", "start_datetime":"' + startDate +
//		 '", "end_datetime":"' + endDate + '"}';
//		 
//		  network.doESB(populater, "Trade_LCList_ReadResponse",
//		 '["ns:ref_num","ns:status","ns:ship_date","ns:currency","ns:amount","ns:creation_datetime","ns:exporter_ID"]',
//		  payload, null, true);
		 
	}*/


trade.sendAcknowledgement = function(ref_num,status){
	console.log("Reached Ack with ref "+ref_num + "and "+ status);
		console.log("reached accepted");
		console.log(document.getElementById("creation").value);
		 //Approve LC
		var populater = function(response, extras) {
			
			console.log("THIS"+response.esbStatus);
			console.log(document.getElementById("LC_ID").value);
		};

		//console.log(document.getElementById("ref_num").value);
		var payload ='{"ServiceDomain":"Trade","OperationName":"Trade_MT730_Produce","LC_ID":"'
	 		+document.getElementById("LC_ID").value
	 		+ '","ref_num":"'
	 		+ document.getElementById("ref_num").value
	 		+ '","creation_datetime":"'
	 		+ document.getElementById("creation").value
	 		+ '",  "status":"'
	 		+ "AUTH_ACCEPT"
	 		+ '", "importer_ID":"'
		+ document.getElementById("importerID").value
		+ '", "importer_account_num":"'
		+ document.getElementById("importerAccNum").value
		+ '", "exporter_ID":"'
		+ document.getElementById("exporterID").value
		+ '", "exporter_account_num":"'
		+ document.getElementById("benAccountNumber").value
		+ '", "expiry_date":"'
		+ document.getElementById("expiry_date").value
		+ '", "expiry_place":"'
		+ document.getElementById("expiry_place").value
		+ '", "issue_date":"'
		+ "2015-06-07"
		+ '", "confirmed":"'
		+ document.getElementById("confirmed").value
		+ '", "revocable":"'
		+ document.getElementById("revocable").value
		+ '", "amount":"'
		+ document.getElementById("amount").value
		+ '", "currency":"'
		+ document.getElementById("currency").value
		+ '", "applicable_rules":"'
		+ "xyz"
		+ '", "partial_shipments":"'
		+ 0
		+ '", "ship_destination":"'
		+ document.getElementById("ship_dest").value
		+ '", "ship_date":"'
		+ "150701"
		+ '", "ship_period":"'
		+ document.getElementById("ship_period").value+" days"
		+ '", "docs_required":"'
		+ ""
		+ '", "issuing_bank_id":"'
		+ 1
		+ '", "advising_bank_id":"'
		+ 1
		+ '", "sender_to_receiver_info":"' + "" + '"}';
  
	  network.doESB(populater, "Trade_MT730_ProduceResponse",'["ns:ref_num"]',payload, null, true);

	//issuing_bank_id
};



trade.buildExporterNotificationsPage = function(ref_num,passed_status) {
	//if (ref_num == undefined) {

		//ref_num = 70;
	//}
	var statusdisplay = "";
	if(passed_status == "AUTH_ACCEPT"){
		statusdisplay = "Accepted"
			//console.log(status);
	}else if(passed_status == "AUTH_REJECT"){
		statusdisplay = "Rejected"
			//console.log(status);
	}
	var populater = function(response, extras) {
		console.log(response.esbStatus);
		var message = "";
		LCData = [];
		message = response.esbStatus;
		console.log(message);
		console.log(response);
		// console.log(extras);

		if (response["ns:ref_num.length"] > 0) {
			for (var i = 1; i <= response["ns:ref_num.length"]; i++) {
				// var searchterm = document.getElementById("LCSearch").value;
				// if(response["ns:ref_num" + i] == searchterm ||
				// response["ns:status" + i] == searchterm ){
				LCData.push({
					LC_ref_num : response["ns:ref_num" + i],
					LC_currency : response["ns:currency" + i],
					LC_status : response["ns:status" + i],
					LC_amount : response["ns:amount" + i],
					LC_ship_date : response["ns:ship_date" + i],
					LC_creation : response["ns:creation_datetime" + i],
					status: statusdisplay

				});
				// }
			}
			console.log(LCData);
			trade.stencils.exporterNotifications.render(LCData);
			// trade.stencils.searchLCList.render({});
			// trade.stencils.LCListHeader.render({});
			// trade.stencils.LCList.render(LCData);
			/*
			 * $('#LCSearch').keyup(function () { var valThis =
			 * this.value.toLowerCase(), length = this.value.length;
			 * 
			 * $('.LCList>li').each(function () { console.log("Reached"); var
			 * text = $(this).attr('id'), textL = text.toLowerCase(); //htmlR = '<b>' +
			 * text.substr(0, length) + '</b>' + text.substr(length);
			 * 
			 * (textL.indexOf(valThis) == 0) ? $(this).show() : $(this).hide();
			 * 
			 * }); console.log(valThis);
			 * 
			 * });
			 */
			// document.getElementById("doGiroDelete").style.display = '';
		} else {

			$("#LCList").empty().append(trade.stencils.LClistError.render({
				errorMessage : "You have no LCs"
			}, "fragment"));
			// document.getElementById("doGiroDelete").style.display = 'none';
		}

	};
	// var customerID = document.getElementById("customerID").value;
	// var startDate = document.getElementById("startDate").value;
	// var endDate = document.getElementById("endDate").value;
	// console.log(customerID);
	var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LC_Read", "ref_num":"'
			+ ref_num + '"}';

	network.doESB(populater,"Trade_LC_ReadResponse",
			'["ns:ref_num","ns:status","ns:ship_date","ns:currency","ns:amount","ns:creation_datetime"]',
					payload, null, true);

	// document.getElementById("importNotificationsBtn").style.background='#999999';

};


trade.popDetails = function(nameOfDoc){
	console.log("reached POP");
	if(nameOfDoc == "LC"){
		var modal = new myPop();
		modal.popOut(trade.stencils.LCTeach.render({},"string"));
		
	} 
	if(nameOfDoc == "BG"){
		var modal = new myPop();
		modal.popOut(trade.stencils.BGTeach.render({},"string"));
		
			
		}
	if(nameOfDoc == "SG"){
		var modal = new myPop();
		modal.popOut(trade.stencils.SGTeach.render({},"string"));
		
		
	}
	if(nameOfDoc == "TR"){
		var modal = new myPop();
		modal.popOut(trade.stencils.TRTeach.render({},"string"));
		
		
	}
	if(nameOfDoc == "BD"){
		var modal = new myPop();
		modal.popOut(trade.stencils.BDTeach.render({},"string"));
		
		
	}
	
	
};

trade.buildUploadDocsPage = function(){
	
	trade.stencils.uploadMainPage.render({});
	
};

trade.readImage = function(){
		
		var filesSelected = document.getElementById("filePicker").files;//$('#')[0].files;
		if (filesSelected.length > 0) {
	            var fileToLoad = filesSelected[0];
	            var fileReader = new FileReader();
	            fileReader.onload = function(fileLoadedEvent) {
	                var srcData = fileLoadedEvent.target.result; // <--- data: base64	
	                //console.log(srcData);
	                var result = srcData.split(",");
	                document.getElementById("base64textarea").value = result[1];
	                binaryData = result[1];
	                //console.log("HERE "+result[1]);
	            };
	            fileReader.readAsDataURL(fileToLoad);
	        }
		
		//console.log("textarea: "+document.getElementById("base64textarea").value);
		
		var filename = encodeURIComponent($("#filePicker").val().replace("C:\\fakepath\\",""));
		//console.log(filename);
		//binaryData = document.getElementById("base64textarea").value;
		trade.storeDocument();
		
};

trade.storeDocument = function(){
	
	var populater = function(response,extras){
		
		
		var documentadd = {};
		documentadd = response;
		docsArr[ictr] = response;
		 docsArr[ictr]["ns:documentType"] = document.getElementById("documentType").value;
		console.log("This is the array "+ictr);
		console.log(document.getElementById("documentType").value);
		ictr++;
		console.log(docsArr);
		if(response.esbStatus == "invocation successful"){
			var BPMResponse = response;
			//trade.triggerBPMDocPres(BPMResponse);
			trade.buildDownloadTable(docsArr);
			deleteDoc.onclick = function(){
		    	var arrayIndex = +this.name;
		    	console.log(arrayIndex);
		    	docsArr.splice(arrayIndex, 1);
		    	console.log(docsArr);
		    	trade.buildDownloadTable(docsArr);
		    	ictr--;
		    };
		}
		
	};
	
	var payload ='{"ServiceDomain":"CMS","OperationName":"CMS_Document_Store","filename":"'
 		+ encodeURIComponent($("#filePicker").val().replace("C:\\fakepath\\",""))
 		+ '","party_id":"'
 		+ document.getElementById("partyID").value
 		+ '","document_type_id":"'
 		+ document.getElementById("documentType").value
 		+ '", "MyBinaryData":"'
 		+ binaryData + '"}';


		network.doESB(populater,"CMS_Document_StoreResponse",'["ns:date_uploaded","ns:filename","ns:url","ns:size","ns:version"]', payload, null, false);

};

trade.buildDownloadTable = function(docsArr){
	console.log(docsArr);
	var htmlcode = "";
	for(var i = 0;i<docsArr.length;i++){
		if(i == 0){
			htmlcode += "<tr>";
		    htmlcode += "<th>Filename</th>";
		    htmlcode += "<th>Version</th>";
		    htmlcode += "<th>Document Type</th>";
		    htmlcode += "<th>Date Uploaded</th>";
		    htmlcode += "<th>File Size</th>";
		    htmlcode += "<th>Link</th>";
		    htmlcode += "<th>Delete</th>";
		    htmlcode += "</tr>";
		}
		    
		    htmlcode += "<tr>";
		    htmlcode += "<td id='filename'>" + docsArr[i]["ns:filename1"] + "</td>";
		    htmlcode += "<td id='version'>" + docsArr[i]["ns:version1"] + "</td>";
		    htmlcode += "<td id='document_type_id'>" + docsArr[i]["ns:documentType"] + "</td>";
		    htmlcode += "<td id='date_uploaded'>" + docsArr[i]["ns:date_uploaded1"] + "</td>";
		    htmlcode += "<td id='size'>" + docsArr[i]["ns:size1"] + "</td>";
		    htmlcode += "<td id='url'><a href='"+docsArr[i]["ns:url1"]+"' target='_blank' style='color:green'><span class='icon-download' aria-hidden='true'></span> Download</a> </td>";
		    htmlcode += "<td id ='delete'><button id = 'deleteDoc' name = '"+ i +"' type='btn-tbank'  name=''><span class='icon-trash' aria-hidden='true'></span> Delete</button></td>"
		    htmlcode += "</tr>";
		    
		    
	}
	  $("#document_table").html(htmlcode);
	  
	  submitAll.onclick = function(){
		  
		  trade.triggerDocPres(docsArr);
		  console.log(systemBankID + " "+ systemCustomerID)
	  };
	
};

trade.triggerDocPres = function(BPMResponse) {
	//console.log(BPMResponse);
	
	//----------------//
	//Read LC Details
	var populater = function(response, extras) {
		if(response.esbStatus == "invocation successful"){
			var partyID = response["ns:importer_ID1"];
			if(response["ns:confirmed1"] == "true" || response["ns:confirmed1"] == 1){
				trade.triggerBPMDocPres(BPMResponse,partyID);
			} else {
				trade.triggerBWDocPres(BPMResponse,partyID);
			}
			
		}

	};
	var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LC_Read", "ref_num":"'
			+ document.getElementById("doc_ref_num").value + '"}';

	network.doESB(populater,"Trade_LC_ReadResponse",'["ns:status","ns:goods_description","ns:additional_conditions","ns:ship_period","ns:ship_destination","ns:confirmed","ns:revocable","ns:expiry_date","ns:ref_num","ns:status","ns:ship_date","ns:currency","ns:amount","ns:creation_datetime","ns:expiry_place","ns:importer_account_num","ns:exporter_account_num","ns:importer_ID","ns:exporter_ID"]',payload, null, true);
	//Read LC Details
	//----------------//
};

trade.triggerBPMDocPres = function(BPMResponse,partyID){
    var tagRoot = "BPM_LCDocument_PresentationResponse";
    var tagList = '[""]';
    var payload = 
    {
            "ServiceDomain":"BPM",
            "OperationName":"BPM_LCDocument_Presentation",
    };
    payload["trad:PartyID"] = partyID;
    payload["trad:Ref_Num"] = document.getElementById("doc_ref_num").value; 
    payload["trad:Trade_Document.repetition"] = BPMResponse.length;
    var ctr = 0;
    for(var i = 0; i < BPMResponse.length; i++) {
    	ctr=i;
    	ctr++;
    	console.log(BPMResponse[i]["ns:filename1"]);
        payload["trad:Trade_Document^" +ctr + ".trad:Document_Name"] = BPMResponse[i]["ns:filename1"];
        payload["trad:Trade_Document^" + ctr + ".trad:Document_Type"] =BPMResponse[i]["ns:documentType"];
        payload["trad:Trade_Document^" + ctr + ".trad:URL"] = BPMResponse[i]["ns:url1"];
    }
    
    var populater = function(response, extras) {
        
    };
    
    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
    docsArr = [];
};

trade.triggerBWDocPres = function(BPMResponse,partyID){
	  var tagRoot = "Trade_Document_PresentationResponse";
	    var tagList = '[""]';
	    var payload = 
	    {
	            "ServiceDomain":"BPM",
	            "OperationName":"Trade_Document_Presentation",
	    };
	    payload["trad:PartyID"] = 879;
	    payload["trad:Ref_Num"] = document.getElementById("doc_ref_num").value; 
	    payload["trad:Trade_Document.repetition"] = BPMResponse.length;
	    var ctr = 0;
	    for(var i = 0; i < BPMResponse.length; i++) {
	    	ctr=i;
	    	ctr++;
	    	console.log(BPMResponse[i]["ns:filename1"]);
	        payload["trad:Trade_Document^" +ctr + ".trad:Document_Name"] = BPMResponse[i]["ns:filename1"];
	        payload["trad:Trade_Document^" + ctr + ".trad:Document_Type"] =BPMResponse[i]["ns:documentType"];
	        payload["trad:Trade_Document^" + ctr + ".trad:URL"] = BPMResponse[i]["ns:url1"];
	    }
	    
	    var populater = function(response, extras) {
	        console.log("BW: "+response.esbStatus);
	    };
	    
	    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
	    docsArr = [];
	
};

trade.readDocument = function(filename,partyID,document_type_id){
	
	var populater = function(response,extras){
		console.log(response["ns:url1"]);
		console.log(response);
		if(response.esbStatus == "invocation successful"){
			//trade.buildDownloadBox(response["ns:filename1"],document.getElementById("partyID").value,$("#documentType option:selected").text());
			var htmlcode = "";
		    htmlcode += "<tr>";
		    htmlcode += "<th>Filename</th>";
		    htmlcode += "<th>Version</th>";
		    htmlcode += "<th>Document Type</th>";
		    htmlcode += "<th>Date Uploaded</th>";
		    htmlcode += "<th>File Size</th>";
		    htmlcode += "<th>Link</th>";
		    htmlcode += "</tr>";
		    htmlcode += "<tr>";
		    htmlcode += "<td id='filename'>" + response["ns:filename1"] + "</td>";
		    htmlcode += "<td id='version'>" + response["ns:version1"] + "</td>";
		    htmlcode += "<td id='document_type_id'>" +$("#documentType option:selected").text(); + "</td>";
		    htmlcode += "<td id='date_uploaded'>" + response["ns:date_uploaded1"] + "</td>";
		    htmlcode += "<td id='size'>" + response["ns:size1"] + "</td>";
		    htmlcode += "<td id='url'><a class='docLink btn btn-xs btn-primary' href='"+response["ns:url1"]+"' target='_blank'><span class='glyphicon glyphicon-download' aria-hidden='true'></span> Download</a> <button id='deleteDocument' type='button' class='btn btn-xs btn-danger' name=''><span class='glyphicon glyphicon-trash' aria-hidden='true'></span> Delete</button></td>";
		    htmlcode += "</tr>";
		    $("#document_table").html(htmlcode);
		}
		
	};
	
	var payload ='{"ServiceDomain":"CMS","OperationName":"CMS_Document_Retrieve","filename":"'
 		+ filename
 		+ '","party_id":"'
 		+ partyID
 		+ '","document_type_id":"'
 		+ document_type_id + '"}';


		network.doESB(populater,"CMS_Document_RetrieveResponse",'["ns:date_uploaded","ns:filename","ns:url","ns:size","ns:version"]', payload, null, true);
};

trade.buildShippersGuaranteePage = function(){
	
	trade.stencils.ShippersGuaranteePage.render({});
	document.getElementById("portOfDischarge").innerHTML = ui.getCountryOptions();
	
};

trade.addSG = function(){
	var modal = new myPop();
	var SGData = [];
	var billOfLading = document.getElementById("billOfLadingNum").value;
	var invoiceNumber = document.getElementById("invoiceNum").value;
	var portOfDischarge = document.getElementById("portOfDischarge").value;
	var ref_num = document.getElementById("ref_num").value;
	var quantityAndDescription = document.getElementById("quantityAndDescription").value;
	var remarks = document.getElementById("remarks").value;
	var amount = document.getElementById("amount").value;
	var importer_Account = document.getElementById("importerAccNum").value;
	var exporter_Account = document.getElementById("exporterAccNum").value;
	//var addConditions = document.getElementById("goodsDescription").value;
	//var shipPeriod = document.getElementById("shipPeriod").value;
	SGData.push({
		billOfLading : billOfLading,
		invoiceNumber : invoiceNumber,
		amount : amount,
		portOfDischarge : portOfDischarge,
		ref_num : ref_num,
		quantityAndDescription : quantityAndDescription,
		remarks : remarks,
		importer_Account : importer_Account,
		exporter_Account : exporter_Account,
	});
	var isValid = true;
	var errorMsg = [];
	var ctr = 0;

	if (amount == "") {
		errorMsg[ctr] = "Please enter a valid Amount in figures";
		ctr++;
		isValid = false;
	}
	if (billOfLading == "") {
		errorMsg[ctr] = "Please choose a valid Bill of Lading Number";
		ctr++;
		isValid = false;
	}
	if (ref_num == "") {
		errorMsg[ctr] = "Please enter a valid reference number";
		ctr++;
		isValid = false;
	}
	if (importer_Account == "") {
		errorMsg[ctr] = "Please enter a valid account number";
		ctr++;
		isValid = false;

	}
	if (exporter_Account == "") {
		errorMsg[ctr] = "Please enter a valid account number";
		ctr++;
		isValid = false;

	}
	if (isValid == true) {
		document.getElementById("applyMessage").innerHTML = " ";
		modal.popOut(trade.stencils.addSG.render(SGData, "string"));

	} else {
		console.log(errorMsg);
		document.getElementById("applyMessage").innerHTML = "<div id = 'SGCreateerror' class='alert alert-danger' role='alert'></div>";
		document.getElementById("SGCreateerror").innerHTML = "<ul style= 'list-style-type:none;' id = 'errorList'><li id = '1'></li><li id = '2'></li><li id = '3'></li><li id = '4'></li></ul>";
		if (errorMsg[0] != undefined) {
			document.getElementById("1").innerHTML = errorMsg[0];
		}
		if (errorMsg[1] != undefined) {
			document.getElementById("2").innerHTML = errorMsg[1];
		}
		if (errorMsg[2] != undefined) {
			document.getElementById("3").innerHTML = errorMsg[2];
		}
		if (errorMsg[3] != undefined) {
			document.getElementById("4").innerHTML = errorMsg[3];
		}
	}

	trade.stencils.SGDetailsToAddStencil.render(SGData);
	
};

trade.applySG = function(){
	  var tagRoot = "Trade_SG_CreateResponse";
	    var tagList = '[""]';
	    var payload = 
	    {
	            "ServiceDomain":"Trade",
	            "OperationName":"Trade_SG_Create",
	    };
	    payload["LC_ref_num"] =  document.getElementById("doc_ref_num").value ;
	    payload["importer_ID"] =  document.getElementById("doc_ref_num").value; 
	    payload["Trade_Document"] =  document.getElementById("doc_ref_num").value;
	    payload["LC_ref_num"] = document.getElementById("doc_ref_num").value;
	    payload["LC_ref_num"] =  document.getElementById("doc_ref_num").value;
	    payload["LC_ref_num"] =  document.getElementById("doc_ref_num").value;
	    payload["LC_ref_num"] =  document.getElementById("doc_ref_num").value;
	    payload["Ref_Num"] = document.getElementById("doc_ref_num").value; 
	    payload["Trade_Document"] =  document.getElementById("doc_ref_num").value;
	    payload["LC_ref_num"] = document.getElementById("doc_ref_num").value;
	    payload["LC_ref_num"] = document.getElementById("doc_ref_num").value;
	    payload["LC_ref_num"] = document.getElementById("doc_ref_num").value;
	    
	    
	    var populater = function(response, extras) {
	        
	    };
	    
	    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
	
};
