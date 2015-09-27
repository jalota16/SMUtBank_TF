var login = {};

login.timeoutMessage = 'Your mobile 2FA login transaction has timed out. Please <a href="login.action">login again</a>.';
login.timeoutLength = 150;

login.init = function() {
    login.stencils = {
        loginHeader: stencil.define("loginHeader", "#mainHeader"),
        loginMain: stencil.define("loginMain", "#main"),
        loginAuthDialog: stencil.define("loginAuthDialog", "#authDiag"),
        mobile2faDialog: stencil.define("mobile2faDialog", "#authDiag"),
        smsotpDialog: stencil.define("smsotpDialog", "#authDiag")
    }
}

login.buildPage = function() {
    $("#mainHeader").removeClass("container").addClass("page-title");
    login.stencils.loginHeader.render({});
    login.stencils.loginMain.render({});
    login.buildAuthDiag();
    $("#main").fadeIn();
}

login.buildAuthDiag = function(status) {
    login.enableAdvert();
    var data = {
        status: (status == null)? "" : status
    };
    login.stencils.loginAuthDialog.render(data);
    $("#username").focus();
};

login.enableAdvert = function() {
    $("#entry").width("670px");
    $("#advert").show();
};

login.disableAdvert = function() {
    $("#entry").width("1000px");
    $("#advert").hide();
};

login.doMobile2faTransaction = function() {
    if(!(document.getElementById("username").value.length > 0)) {
        alert("Username cannot be blank");
        return;
    }
    if(!(/^\d+$/.test(document.getElementById("password").value) && document.getElementById("password").value.length >= 4)) {
        alert("Password must be numeric and not blank");
        return;
    }
    
    var populater = function(response, extras) {
        login.buildMobile2fa(response.challenge);
    };
    var payload = '{username:"' + document.getElementById("username").value + '",PIN:"' + document.getElementById("password").value + '"}';
    network.doIBS(populater, "LoginTransaction.action", payload, null, true);
};

login.buildMobile2fa = function(challengeID) {
    var data = {
        challengeID: challengeID,
        loginTimeout: login.timeoutLength
    };
    login.disableAdvert();
    login.stencils.mobile2faDialog.render(data);
    login.waitForAuth(challengeID);
};

login.intervalID = null;
login.timerID = null;
login.waitForAuth = function(challengeID) {
    var startTimeInMs = null;
    
    var startTimer = function() {
        if(startTimeInMs == null) {
            startTimeInMs = new Date().getTime();
        }
        var difference = Math.round(login.timeoutLength - (new Date().getTime() - startTimeInMs)/1000);
        if(difference > 0) {
            document.getElementById("timeLeft").innerHTML = difference;
        } else {
            //cut
            login.cancelAuth();
        };
    };
    
    var checkSessionAuth = function() {
        var populater = function(response, extras) {
            if(response.message === "Waiting for mobile authentication") {
                document.getElementById("statusMessage").innerHTML = response.message;
            } else if(response.message === "Authenticated") {
                document.getElementById("statusMessage").innerHTML = response.message;
                clearInterval(intervalID);
                clearInterval(timerID);
                system.login.postLogin();
            } else {
                document.getElementById("statusMessage").innerHTML = response.message;
                login.cancelAuth();
            };
        };
        
        var payload = '{"challenge":"' + challengeID + '"}';
        network.doIBS(populater, "ribGetMobile2FA.action", payload, null, true);
    };
    
    intervalID = setInterval(checkSessionAuth, 3000);
    timerID = setInterval(startTimer, 1000);
    setTimeout(function() {
        login.cancelAuth();
    }, login.timeoutLength*1000);
};

login.cancelAuth = function() {
    document.getElementById("mainMessage").innerHTML = login.timeoutMessage;
    clearInterval(timerID);
    clearInterval(intervalID);
    login.buildAuthDiag("Mobile 2FA login canceled/timeout");
};

login.createSMSOTP = function() {
	console.log("reached login SMS OTP");
    if(!(document.getElementById("username").value.length > 0)) {
        alert("Username cannot be blank");
        return;
    }
    if(!(/^\d+$/.test(document.getElementById("password").value) && document.getElementById("password").value.length >= 4)) {
        alert("Password must be numeric and not blank");
        return;
    }
    
    var populater = function(response, extras) {
    	console.log("reahed pop");
        if(response.status == "ok" && response.esbStatus == "Authenticated") {
        	console.log("esb is OK");
            login.disableAdvert();
            login.buildSMSOTP();
        } else {
            document.getElementById("status").innerHTML = response.esbStatus;
            console.log(response.esbStatus);
        }
    };
    var payload = '{LoginID:"' + document.getElementById("username").value + '",Pin:"' + document.getElementById("password").value + '"}';
    network.doIBS(populater, "ribGetOTP.action", payload, null, true);
};

login.doSMSOTP = function() {
    if(!(/^\d+$/.test(document.getElementById("otp").value) && document.getElementById("otp").value.length == 6)) {
        alert("OTP must be numeric and 6 digits long");
        return;
    }
    
    var populater = function(response, extras) {
        if(response.status == "ok" && response.esbStatus == "Authenticated") {
            system.login.postLogin();
        } else {
            login.buildAuthDiag(response.esbStatus);
        }
    };
    var payload = '{SecondFactor:"' + document.getElementById("otp").value + '"}';
    network.doIBS(populater, "ribOTPAuth.action", payload, null, true);
};

login.buildSMSOTP = function() {
    login.stencils.smsotpDialog.render({});
    $("#otp").focus();
};


login.directLogin = function() {
	$.ajax({
		url : "../SMUtBank_IBS/directLogin.action",
		dataType: "json"
	}).done(function(response) {
		if (response.status === "ok" && response.esbStatus === "Authenticated") {
			
			system.login.postLogin();
		} else {
			console.log("in no");
			login.buildAuthDiag(response.esbStatus);
		}
	});

}