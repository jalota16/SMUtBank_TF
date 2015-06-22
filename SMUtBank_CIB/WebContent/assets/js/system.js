var system = {
    channelName: "CIB"
};

system.init = function() {
    //Start all modules up
    ui.init();
    login.init();
    accDash.init();
    accounts.init();
    fundTransfer.init();
    loans.init();
    trade.init();
    profile.init();
    verify.init();

    //Start login page
    $("#mainHeader").fadeIn();
    $("#mainframe").fadeIn();
    system.login.start();
};

system.page = {
    emptyHeader: function() {
        $("#mainHeader").empty();
    },
    emptyMain: function() {
        $("#main").empty();
    },
    emptyAll: function() {
        this.emptyHeader();
        this.emptyMain();
    }
};

system.login = {
    start: function() {
        system.page.emptyAll();
        $("#main").fadeOut(function() {
            login.buildPage();
        });
    },
    logout: function() {
        var logout = $.ajax({
            url: "../SMUtBank_IBS/ribLogout.action"
        });
        logout.done(function() {
            $("#mainHeader").fadeOut();
            $("#main").fadeOut(function() {
                system.login.start();
                $("#mainHeader").fadeIn();
                $("#main").fadeIn();
            });
        });
    },
    postLogin: function() {
        $("#mainHeader").fadeOut();
        $("#main").fadeOut(function() {
            system.page.emptyAll();
            ui.buildHeader().done(function() {
                system.home.start();
                $("#mainHeader").fadeIn();
            });
        });
    }
};

system.home = {
    start: function() {
        ui.setNavSelection(0);
        accDash.buildPage();
    }
};

system.accounts = {
    start: function() {
        $("#main").fadeOut(function() {
            ui.setNavSelection(1);
            accounts.buildPage();
        });
    }
};

system.fundTransfer = {
    start: function() {
        $("#main").fadeOut(function() {
            ui.setNavSelection(2);
            fundTransfer.buildPage();
        });
    }
};

system.loans = {
    start: function(onComplete) {
        $("#main").fadeOut(function() {
            ui.setNavSelection(3);
            loans.buildPage(onComplete);
        });
    }
};

system.trade = {
	    start: function() {
	        $("#main").fadeOut(function() {
	            ui.setNavSelection(4);
	            trade.buildPage();

	        });
	    }
	};

system.profile = {
    start: function() {
        $("#main").fadeOut(function() {
            ui.setNavSelection(5);
            profile.buildPage();
            $("#main").fadeIn();
        });
    }
};