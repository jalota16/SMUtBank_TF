var trade = {};
var LC = {};

LC.LCList = null;
fundTransfer.customerID = null;
trade.retrievedLC = null;
trade.selectedLCList = null;

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
		LCEnquiry: stencil.define("LCEnquiry","#importerFunctions"),
		LCList : stencil.define("LCList","#LCList"),
		LClistError: stencil.define("LClistError","none"),
		LCListHeader: stencil.define("LCListHeader","#LCListHeader"),
		searchLCList: stencil.define("searchLCList","#searchLCList"),
		addLC : stencil.define("addLC", "none"),
		LCDetailsToAddStencil: stencil.define ("LCDetailsToAddStencil","#LCDetailsToAdd"),
		importerNotifications : stencil.define("importerNotifications","#importerFunctions")
		
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

};


trade.buildLCApplicationPage = function() {

	trade.stencils.applyLC.render({});
	//console.log(fundTransfer.getCustomerID());
	
	document.getElementById("expiryPlace").innerHTML = ui.getCountryOptions();
	document.getElementById("currency").innerHTML = ui.getCurrencyOptions();
	document.getElementById("date").innerHTML = Date();
	
$('#importerAccNum').keyup(function (){
		
		var populater = function(response, extras) {
			
			console.log(response.esbStatus);
			var message = "";
			
	        message = response.esbStatus;
	        console.log(message);
	        console.log(response);
	        if(response.esbStatus == "invocation successful") {
	        	customerIDToFind = response["customerID1"];
	        	var populater = function(response, extras) {
	        		
	        		console.log(response.esbStatus);
	        		var message = "";
	        		
	        	    message = response.esbStatus;
	        	    console.log(message);
	        	    console.log(response);
	        	    document.getElementById("importerNameAdd").style.color='black';
	        	    document.getElementById("importerNameAdd").innerHTML = response["streetAddress11"] + ", "+ response["city1"];
	        	    

	        	   
	        	};
	        		var payload = '{"ServiceDomain":"Party","OperationName":"Party_Customer_Read", "customerID":"'
	        		+ customerIDToFind + '"}';
	        		console.log(customerIDToFind);
	        		network.doESB(populater, "Party_Customer_ReadResponse", '["streetAddress1","city","givenName"]', payload, null, true);
	        }else {
	        	document.getElementById("importerNameAdd").style.color='red';
	        	document.getElementById("importerNameAdd").innerHTML = "No Such Account Number!";
	        }

	       
		};
		var payload = '{"ServiceDomain":"Account","OperationName":"Account_Deposit_Read", "accountID":"'
			+ document.getElementById("importerAccNum").value + '"}';
		
			network.doESB(populater, "Account_Deposit_ReadResponse", '["customerID"]', payload, null, true);
			
	});
	
	$('#benAccountNumber').keyup(function (){
		
		var populater = function(response, extras) {
			
			console.log(response.esbStatus);
			var message = "";
			
	        message = response.esbStatus;
	        console.log(message);
	        console.log(response);
	        if(response.esbStatus == "invocation successful") {
	        	customerIDToFind = response["customerID1"];
	        	var populater = function(response, extras) {
	        		
	        		console.log(response.esbStatus);
	        		var message = "";
	        		
	        	    message = response.esbStatus;
	        	    console.log(message);
	        	    console.log(response);
	        	    document.getElementById("benNameAddress").style.color='black';
	        	    document.getElementById("benNameAddress").innerHTML = response["streetAddress11"] + ", "+ response["city1"];
	        	    

	        	   
	        	};
	        		var payload = '{"ServiceDomain":"Party","OperationName":"Party_Customer_Read", "customerID":"'
	        		+ customerIDToFind + '"}';
	        		console.log(customerIDToFind);
	        		network.doESB(populater, "Party_Customer_ReadResponse", '["streetAddress1","city","givenName"]', payload, null, true);
	        }else {
	        	document.getElementById("benNameAddress").style.color='red';
	        	document.getElementById("benNameAddress").innerHTML = "No Such Account Number!";
	        }

	       
		};
		var payload = '{"ServiceDomain":"Account","OperationName":"Account_Deposit_Read", "accountID":"'
			+ document.getElementById("benAccountNumber").value + '"}';
		
			network.doESB(populater, "Account_Deposit_ReadResponse", '["customerID"]', payload, null, true);
			
	});

};

trade.buildLCAmendementApplicationPage = function() {

	trade.stencils.amendLCapplication.render({});

};

trade.buildExporterPage = function() {
	trade.stencils.exporterPage.render({});
	
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
    	shipPeriod: shipPeriod
    	
    });
    var isValid = true;
    var errorMsg = [];
    var ctr = 0;
    
   if(amount == ""){
    	errorMsg[ctr] = "Please enter a valid Amount in figures";
    	ctr++;
    	isValid = false;
    } 
   if(expiryDate == ""){
    	errorMsg[ctr] =  "Please choose a valid Expiry Date";
    	ctr++;
    	isValid = false;
    } 
    if (shipPeriod == ""){
    	errorMsg[ctr] =  "Please enter a valid shipment period";
    	ctr++;
    	isValid = false;
    } 
    if (shipTo == ""){
    	errorMsg[ctr] =   "Please enter a valid shipment destination";
    	ctr++;
    	isValid = false;
    	
    }
    if(isValid == true){
    	document.getElementById("applyMessage").innerHTML = " ";
    	 modal.popOut(trade.stencils.addLC.render(LCData, "string"));
    	
    } else {
    	console.log(errorMsg);
    	document.getElementById("applyMessage").innerHTML = "<div id = 'LCCreateerror' class='alert alert-danger' role='alert'></div>";
    	document.getElementById("LCCreateerror").innerHTML = "<ul style= 'list-style-type:none;' id = 'errorList'><li id = '1'></li><li id = '2'></li><li id = '3'></li><li id = '4'></li></ul>";
    	if(errorMsg[0]!=undefined){
    	document.getElementById("1").innerHTML = errorMsg[0];
    	}
    	if(errorMsg[1]!=undefined){
    	document.getElementById("2").innerHTML = errorMsg[1];
    	}
    	if(errorMsg[2]!=undefined){
    	document.getElementById("3").innerHTML = errorMsg[2];
    	}
    	if(errorMsg[3]!=undefined){
    	document.getElementById("4").innerHTML = errorMsg[3];
    	}
    }
    
   
    trade.stencils.LCDetailsToAddStencil.render(LCData);
};

trade.applyLC = function() {
	console.log("reached Apply LC");
	console.log(document.getElementById("expiryDate").value);
	
	
	var populater = function(response, extras) {
		
		console.log(response.esbStatus);
		var message = "";
		
        message = response.esbStatus;
        console.log(message);
        console.log(response);
        if(response.esbStatus == "invocation successful") {
        	customerIDToFind = response["customerID1"];
        }else {
        	//document.getElementById("benNameAddress").style.color='red';
        	//document.getElementById("benNameAddress").innerHTML = "No Such Account Number!";
        }

       
	};
	var payload = '{"ServiceDomain":"Account","OperationName":"Account_Deposit_Read", "accountID":"'
		+ document.getElementById("benAccountNumber").value + '"}';
	
		network.doESB(populater, "Account_Deposit_ReadResponse", '["customerID"]', payload, null, true);
	
	
	var populater = function(response, extras) {
		console.log(response.esbStatus);
		var message = "";
        trade.retrievedLC = response;
        if (response.esbStatus == "invocation successful"){
        	 trade.buildNotificationsPage(response["ns:ref_num1"]);
        	 ui.closePopup();
            //message =  "LC with reference number: "+ +" has been created";
        	
        }else if (response.esbStatus == "record not found" || response.esbStatus == "input Account ID not exist")
            message = "Not Valid";
        else
            message = response.esbStatus;
        //document.getElementById("createLCStatus").innerHTML = message;
        console.log(response);
        console.log(extras);
	};
	/*var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LC_Create", "LC_ID":"'
		+ "not used"
		+ '", "ref_num":"'
		+ "not used"
		+ '", "importer_ID":"'
			+ 206
			+ '", "exporter_ID":"'
			+ 208
			+ '", "expiry_date":"'
			+ "2015-07-15"
			+ '", "confirmed":"'
			+ false
			+ '", "revocable":"'
			+ false
			+ '", "amount":"'
			+ 15.00
			+ '", "currency":"'
			+ "GBP"
			+ '", "applicable_rules":"'
			+ "?"
			+ '", "partial_shipments":"'
			+ false
			+ '", "ship_destination":"'
			+ "Singapore"
			+ '", "ship_period":"'
			+ "90 days"
			+ '", "goods_description":"'
			+ "?"
			+ '", "docs_required":"'
			+ "?"
			+ '", "additional_conditions":"'
			+ "?"
			+ '", "sender_to_receiver_info":"' + "?" + '"}';
	network.doESB(populater, "Trade_LC_Create-Response", '["ref_num"]', payload, null,
			true);
	
	var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LC_Read", "ref_num":"'+ "24" + '"}';
	network.doESB(populater, "Trade_LC_ReadResponse", '["ns:ref_num","ns:importer_ID"]', payload, null, true);
	*/
	
	var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LC_Create", "importer_ID":"'
			+ 206
			+ '", "exporter_ID":"'
			+ customerIDToFind
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
			+ ""
			+ '", "partial_shipments":"'
			+ false
			+ '", "ship_destination":"'
			+  document.getElementById("shipToM").value
			+ '", "ship_date":"'
			+ "2015-07-01"
			+ '", "ship_period":"' 
			+  document.getElementById("shipPeriodM").value
			+ '", "goods_description":"'
			+ document.getElementById("goodsDescM").value
			+ '", "docs_required":"'
			+ ""
			+ '", "additional_conditions":"'
			+ document.getElementById("addConditionsM").value
			+ '", "sender_to_receiver_info":"'
			+ ""
			+ '"}';
	network.doESB(populater, "Trade_LC_CreateResponse", '["ns:status","ns:ref_num"]', payload, null,
			true);
	
	//var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LC_Read", "ref_num":"'+ "24" + '"}';
	//network.doESB(populater, "Trade_LC_ReadResponse", '["ns:ref_num","ns:expiry_place"]', payload, null, true);
	
	
	
};

trade.buildLCEnquiryPage = function() {
	trade.stencils.LCEnquiry.render({});
	
	
};

trade.getLCList = function(){
	
	var populater = function(response, extras) {
		console.log(response.esbStatus);
		var message = "";
		LC.LCList  = response;
        message = response.esbStatus;
        console.log(message);
        console.log(response);
        console.log(extras);
        var LCData = [];
        if(response["ns:ref_num.length"] > 0) {
            for(var i = 1; i <= response["ns:ref_num.length"]; i++) {
            	//var searchterm = document.getElementById("LCSearch").value;
            	//if(response["ns:ref_num" + i] == searchterm || response["ns:status" + i] == searchterm  ){
                LCData.push({
                    LC_ref_num: response["ns:ref_num" + i],
                	LC_currency: response["ns:currency" + i],
                	LC_status: response["ns:status" + i],
                	LC_amount:  response["ns:amount" + i],
                	LC_ship_date: response["ns:ship_date" + i],
                	LC_creation: response["ns:creation_datetime" + i]
                    
                });
            //}
            }
            trade.stencils.searchLCList.render({});
            trade.stencils.LCListHeader.render({});
            trade.stencils.LCList.render(LCData);
            $('#LCSearch').keyup(function () {
    		    var valThis = this.value.toLowerCase(),
    		    length  = this.value.length;
    		    
    		    $('.LCList>li').each(function () {
    		    	console.log("Reached");
    		        var text  = $(this).attr('id'),
    		            textL = text.toLowerCase();
    		            //htmlR = '<b>' + text.substr(0, length) + '</b>' + text.substr(length);
    		        
    		        (textL.indexOf(valThis) == 0) ? $(this).show() : $(this).hide();
    		        
    		    });
    		    console.log(valThis);
    		   
    		});
            //document.getElementById("doGiroDelete").style.display = '';
        }else {
        	
            $("#LCList").empty().append(trade.stencils.LClistError.render({errorMessage: "You have no LCs"}, "fragment"));
            //document.getElementById("doGiroDelete").style.display = 'none';
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
		+ '", "end_datetime":"'
		+  endDate + '"}';
	
	network.doESB(populater, "Trade_LCList_ReadResponse", '["ns:ref_num","ns:status","ns:ship_date","ns:currency","ns:amount","ns:creation_datetime"]', payload, null, true);
	
};

//Exporter Functions

trade.acknowledgeLCApplicationPage = function() {
	console.log("reached ackno");
	trade.stencils.acknowledgeLC.render({});
};

trade.getLCListSorted = function(){
	
	var populater = function(response, extras) {
		console.log(response.esbStatus);
		var message = "";
		LC.LCList  = response;
        message = response.esbStatus;
        console.log(message);
        console.log(response);
        console.log(extras);
        var LCData = [];
        if(response["ns:ref_num.length"] > 0) {
            for(var i = 1; i <= response["ns:ref_num.length"]; i++) {
            	//var searchterm = document.getElementById("LCSearch").value;
            	//if(response["ns:ref_num" + i] == searchterm || response["ns:status" + i] == searchterm  ){
                LCData.push({
                    LC_ref_num: response["ns:ref_num" + i],
                	LC_currency: response["ns:currency" + i],
                	LC_status: response["ns:status" + i],
                	LC_amount:  response["ns:amount" + i],
                	LC_ship_date: response["ns:ship_date" + i],
                	LC_creation: response["ns:creation_datetime" + i]
                    
                });
                
            //}
            }
            function compare(a,b) {
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
            
            //document.getElementById("doGiroDelete").style.display = '';
        }else {
        	
            $("#LCList").empty().append(trade.stencils.LClistError.render({errorMessage: "You have no LCs"}, "fragment"));
            //document.getElementById("doGiroDelete").style.display = 'none';
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
		+ '", "end_datetime":"'
		+  endDate + '"}';
	
	network.doESB(populater, "Trade_LCList_ReadResponse", '["ns:ref_num","ns:status","ns:ship_date","ns:currency","ns:amount","ns:creation_datetime"]', payload, null, true);
	
};
trade.getLCListSortedByRef = function(){
	
	var populater = function(response, extras) {
		console.log(response.esbStatus);
		var message = "";
		LC.LCList  = response;
        message = response.esbStatus;
        console.log(message);
        console.log(response);
        console.log(extras);
        var LCData = [];
        if(response["ns:ref_num.length"] > 0) {
            for(var i = 1; i <= response["ns:ref_num.length"]; i++) {
            	//var searchterm = document.getElementById("LCSearch").value;
            	//if(response["ns:ref_num" + i] == searchterm || response["ns:status" + i] == searchterm  ){
                LCData.push({
                    LC_ref_num: response["ns:ref_num" + i],
                	LC_currency: response["ns:currency" + i],
                	LC_status: response["ns:status" + i],
                	LC_amount:  response["ns:amount" + i],
                	LC_ship_date: response["ns:ship_date" + i],
                	LC_creation: response["ns:creation_datetime" + i]
                    
                });
                
            //}
            }
            function compare(a,b) {
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
            
            //document.getElementById("doGiroDelete").style.display = '';
        }else {
        	
            $("#LCList").empty().append(trade.stencils.LClistError.render({errorMessage: "You have no LCs"}, "fragment"));
            //document.getElementById("doGiroDelete").style.display = 'none';
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
		+ '", "end_datetime":"'
		+  endDate + '"}';
	
	network.doESB(populater, "Trade_LCList_ReadResponse", '["ns:ref_num","ns:status","ns:ship_date","ns:currency","ns:amount","ns:creation_datetime"]', payload, null, true);
	
};
trade.getLCListSortedByCreationDate = function(){
	
	var populater = function(response, extras) {
		console.log(response.esbStatus);
		var message = "";
		LC.LCList  = response;
        message = response.esbStatus;
        console.log(message);
        console.log(response);
        console.log(extras);
        var LCData = [];
        if(response["ns:ref_num.length"] > 0) {
            for(var i = 1; i <= response["ns:ref_num.length"]; i++) {
            	//var searchterm = document.getElementById("LCSearch").value;
            	//if(response["ns:ref_num" + i] == searchterm || response["ns:status" + i] == searchterm  ){
                LCData.push({
                    LC_ref_num: response["ns:ref_num" + i],
                	LC_currency: response["ns:currency" + i],
                	LC_status: response["ns:status" + i],
                	LC_amount:  response["ns:amount" + i],
                	LC_ship_date: response["ns:ship_date" + i],
                	LC_creation: response["ns:creation_datetime" + i]
                    
                });
                
            //}
            }
            function compare(a,b) {
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
            
            //document.getElementById("doGiroDelete").style.display = '';
        }else {
        	
            $("#LCList").empty().append(trade.stencils.LClistError.render({errorMessage: "You have no LCs"}, "fragment"));
            //document.getElementById("doGiroDelete").style.display = 'none';
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
		+ '", "end_datetime":"'
		+  endDate + '"}';
	
	network.doESB(populater, "Trade_LCList_ReadResponse", '["ns:ref_num","ns:status","ns:ship_date","ns:currency","ns:amount","ns:creation_datetime"]', payload, null, true);
	

};
trade.getLCListSearch = function(){
	
	var populater = function(response, extras) {
		console.log(response.esbStatus);
		var message = "";
		LC.LCList  = response;
        message = response.esbStatus;
        console.log(message);
        console.log(response);
        console.log(extras);
        var LCData = [];
        if(response["ns:ref_num.length"] > 0) {
            for(var i = 1; i <= response["ns:ref_num.length"]; i++) {
            	
            	var searchterm = document.getElementById("LCSearch").value;
            	if(response["ns:status" + i] == searchterm){
                LCData.push({
                    LC_ref_num: response["ns:ref_num" + i],
                	LC_currency: response["ns:currency" + i],
                	LC_status: response["ns:status" + i],
                	LC_amount:  response["ns:amount" + i],
                	LC_ship_date: response["ns:ship_date" + i],
                	LC_creation: response["ns:creation_datetime" + i]
                    
                });
            }
            }
            trade.stencils.searchLCList.render({});
            trade.stencils.LCListHeader.render({});
            trade.stencils.LCList.render(LCData);
            
            //document.getElementById("doGiroDelete").style.display = '';
        }else {
        	
            $("#LCList").empty().append(trade.stencils.LClistError.render({errorMessage: "You have no LCs"}, "fragment"));
            //document.getElementById("doGiroDelete").style.display = 'none';
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
		+ '", "end_datetime":"'
		+  endDate + '"}';
	
	network.doESB(populater, "Trade_LCList_ReadResponse", '["ns:ref_num","ns:status","ns:ship_date","ns:currency","ns:amount","ns:creation_datetime"]', payload, null, true);
	
};

// Notifications For Importer

trade.buildNotificationsPage = function(ref_num){
	if(ref_num == undefined){
		
		ref_num = 70;
	}
	var populater = function(response, extras) {
		console.log(response.esbStatus);
		var message = "";
		LCData = [];
        message = response.esbStatus;
        console.log(message);
        console.log(response);
        //console.log(extras);
        
        
        if(response["ns:ref_num.length"] > 0) {
            for(var i = 1; i <= response["ns:ref_num.length"]; i++) {
            	//var searchterm = document.getElementById("LCSearch").value;
            	//if(response["ns:ref_num" + i] == searchterm || response["ns:status" + i] == searchterm  ){
                LCData.push({
                    LC_ref_num: response["ns:ref_num" + i],
                	LC_currency: response["ns:currency" + i],
                	LC_status: response["ns:status" + i],
                	LC_amount:  response["ns:amount" + i],
                	LC_ship_date: response["ns:ship_date" + i],
                	LC_creation: response["ns:creation_datetime" + i]
                    
                });
            //}
            }
            console.log(LCData);
            trade.stencils.importerNotifications.render(LCData);
            //trade.stencils.searchLCList.render({});
            //trade.stencils.LCListHeader.render({});
            //trade.stencils.LCList.render(LCData);
            /*$('#LCSearch').keyup(function () {
    		    var valThis = this.value.toLowerCase(),
    		    length  = this.value.length;
    		    
    		    $('.LCList>li').each(function () {
    		    	console.log("Reached");
    		        var text  = $(this).attr('id'),
    		            textL = text.toLowerCase();
    		            //htmlR = '<b>' + text.substr(0, length) + '</b>' + text.substr(length);
    		        
    		        (textL.indexOf(valThis) == 0) ? $(this).show() : $(this).hide();
    		        
    		    });
    		    console.log(valThis);
    		   
    		});*/
            //document.getElementById("doGiroDelete").style.display = '';
        }else {
        	
            $("#LCList").empty().append(trade.stencils.LClistError.render({errorMessage: "You have no LCs"}, "fragment"));
            //document.getElementById("doGiroDelete").style.display = 'none';
        }

       
	};
	//var customerID = document.getElementById("customerID").value;
	//var startDate = document.getElementById("startDate").value;
	//var endDate = document.getElementById("endDate").value;
	//console.log(customerID);
	var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LC_Read", "ref_num":"'
		+ ref_num + '"}';
	
	network.doESB(populater, "Trade_LC_ReadResponse", '["ns:ref_num","ns:status","ns:ship_date","ns:currency","ns:amount","ns:creation_datetime"]', payload, null, true);
	
	
	//document.getElementById("importNotificationsBtn").style.background='#999999';
	
};








