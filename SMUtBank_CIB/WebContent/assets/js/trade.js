var trade = {};

trade.init = function() {
	trade.stencils = {
			tradeMain: stencil.define("tradeMain", "#main"),
			tradeMenu: stencil.define("tradeMenu", "#tradeContainer"),
			importerPage: stencil.define("importerPage","#tradeContainer"),
			exporterPage: stencil.define("exporterPage","#tradeContainer"),
			applyLC: stencil.define("applyLC","#importerFunctions"),
			amendLCapplication: stencil.define("amendLCapplication","#importerFunctions")
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

trade.buildImporterPage = function(){
	trade.stencils.importerPage.render({});
	
	
};

trade.buildLCApplicationPage= function(){
	
	trade.stencils.applyLC.render({});
	
};

trade.buildLCAmendementApplicationPage= function(){
	
	trade.stencils.amendLCapplication.render({});
	
};

trade.buildExporterPage= function(){
	trade.stencils.exporterPage.render({});
	
};

