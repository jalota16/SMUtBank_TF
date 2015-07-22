var trade = {};
var LC = {};

LC.LCList = null;

trade.retrievedLC = null;
trade.selectedLCList = null;

trade.init = function() {
	trade.stencils = {
		tradeMain : stencil.define("tradeMain", "#main"),
		tradeMenu : stencil.define("tradeMenu", "#tradeContainer"),
		importerPage : stencil.define("importerPage", "#tradeContainer"),
		exporterPage : stencil.define("exporterPage", "#tradeContainer"),
		applyLC : stencil.define("applyLC", "#importerFunctions"),
		amendLCapplication : stencil.define("amendLCapplication",
				"#importerFunctions"),
		LCEnquiry: stencil.define("LCEnquiry","#importerFunctions"),
		LCList : stencil.define("LCList","#LCList"),
		LClistError: stencil.define("LClistError","none"),
		LCListHeader: stencil.define("LCListHeader","#LCListHeader"),
		searchLCList: stencil.define("searchLCList","#searchLCList")
		
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

};

trade.buildLCAmendementApplicationPage = function() {

	trade.stencils.amendLCapplication.render({});

};

trade.buildExporterPage = function() {
	trade.stencils.exporterPage.render({});

};

trade.applyLC = function() {
	console.log("reached Apply LC");
	var populater = function(response, extras) {
		console.log(response.esbStatus);
		var message = "";
        trade.retrievedLC = response;
        if (response.esbStatus == "invocation successful")
            message = "Added";
        else if (response.esbStatus == "record not found" || response.esbStatus == "input Account ID not exist")
            message = "Not Valid";
        else
            message = response.esbStatus;
        document.getElementById("applyMessage").innerHTML = message;
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
			+ 208
			+ '", "expiry_date":"'
			+ "2015-07-15"
			+ '", "confirmed":"'
			+ false
			+ '", "revocable":"'
			+ false
			+ '", "amount":"'
			+ 1500.00
			+ '", "currency":"'
			+ "SGD"
			+ '", "applicable_rules":"'
			+ ""
			+ '", "partial_shipments":"'
			+ false
			+ '", "ship_destination":"'
			+ "Singapore"
			+ '", "ship_period":"' + "60 days" + '", "goods_description":"'
			+ ""
			+ '", "docs_required":"'
			+ ""
			+ '", "additional_conditions":"'
			+ ""
			+ '", "sender_to_receiver_info":"' + "" + '"}';
	network.doESB(populater, "Trade_LC_CreateResponse", '["ns:status"]', payload, null,
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
