var trade = {};
trade.retrievedLC = null;

trade.init = function() {
	trade.stencils = {
		tradeMain : stencil.define("tradeMain", "#main"),
		tradeMenu : stencil.define("tradeMenu", "#tradeContainer"),
		importerPage : stencil.define("importerPage", "#tradeContainer"),
		exporterPage : stencil.define("exporterPage", "#tradeContainer"),
		applyLC : stencil.define("applyLC", "#importerFunctions"),
		amendLCapplication : stencil.define("amendLCapplication",
				"#importerFunctions")
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
			+ ""
			+ '", "confirmed":"'
			+ false
			+ '", "revocable":"'
			+ false
			+ '", "amount":"'
			+ 15.00
			+ '", "currency":"'
			+ ""
			+ '", "applicable_rules":"'
			+ ""
			+ '", "partial_shipments":"'
			+ false
			+ '", "ship_destination":"'
			+ ""
			+ '", "ship_period":"'
			+ ""
			+ '", "goods_description":"'
			+ ""
			+ '", "docs_required":"'
			+ ""
			+ '", "additional_conditions":"'
			+ ""
			+ '", "sender_to_receiver_info":"' + "" + '"}';
	network.doESB(populater, "Trade_LC_CreateResponse", '["ns:status"]', payload, null,
			true);
	
	//var payload = '{"ServiceDomain":"Trade","OperationName":"Trade_LC_Read", "ref_num":"'+ "24" + '"}';
	//network.doESB(populater, "Trade_LC_ReadResponse", '["ns:ref_num","ns:importer_ID"]', payload, null, true);
	
	
	
};
