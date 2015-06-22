var verify = {};
verify.transactionDetails = null;

verify.init = function() {
    verify.stencils = {
        verificationDialog: stencil.define("verificationDialog", "none"),
        verificationSms2FA: stencil.define("verificationSms2FA", "#authDiag"),
        verificationM2FA: stencil.define("verificationM2FA", "#authDiag")
    };
};

verify.buildDiaglog = function(transCallback) {
    verify.transactionDetails = transCallback;
    var modal = new myPop("verify2fa");
    modal.popOut(verify.stencils.verificationDialog.render({}, "string"));
};

verify.doSMSOTP = function() {
    var populater = function(response, extras) {
        verify.buildSMSOTP();
        document.getElementById("statusMessage").innerHTML = response.esbStatus;
        document.getElementById("otpButton").onclick = function() {verify.verifySMSOTP();};
        document.getElementById("cancelButton").onclick = function() {ui.closePopup("verify2fa");};
    };
    
    network.doIBS(populater, "initiateVerifyOTP2FA.action", "{}", null, true);
};

verify.buildSMSOTP = function() {
    verify.stencils.verificationSms2FA.render({});
};

verify.verifySMSOTP = function() {
    var populater = function(response, extras) {
        ui.closePopup("verify2fa");
        if(response.verificationID != null) {
            network.doESB(
                    verify.transactionDetails.callback, 
                    verify.transactionDetails.tagRoot, 
                    verify.transactionDetails.tagList, 
                    verify.transactionDetails.payload, 
                    verify.transactionDetails.extras, 
                    verify.transactionDetails.isAsync,
                    response.verificationID
                );
        } else {
            verify.transactionDetails.callback({"status" : "Verification failed", "esbStatus" : "Verification failed"});
        }
    };
    var payload = '{SecondFactor:"' + document.getElementById("otp").value + '"}';
    network.doIBS(populater, "verifyOTP2FA.action", payload, null, true);
};

verify.doMobile2FA = function() {
    var populater = function(response, extras) {
        verify.buildMobile2fa(response.challenge);
        document.getElementById("m2faCancel").onclick = function() {verify.cancelAuth();};
    };
    
    network.doIBS(populater, "initiateVerifyMobile2FA.action", "{}", null, true);
};

verify.buildMobile2fa = function(challengeID) {
    var verifym2faDataset = {
        challengeID: challengeID,
        timeoutLength: verify.timeoutLength
    };
    verify.stencils.verificationM2FA.render(verifym2faDataset);
    verify.waitForAuth(challengeID);
};

verify.timeoutMessage = '2FA transaction timed out';
verify.timeoutLength = 100;
verify.intervalID = null;
verify.timerID = null;
verify.waitForAuth = function(challengeID) {
    var startTimeInMs = null;
    
    var startTimer = function() {
        if(startTimeInMs == null) {
            startTimeInMs = new Date().getTime();
        }
        var difference = Math.round(verify.timeoutLength - (new Date().getTime() - startTimeInMs)/1000);
        if(difference > 0) {
            document.getElementById("timeLeft").innerHTML = difference;
        } else {
            //cut
            verify.cancelAuth();
        }
    };
    
    var checkSessionAuth = function() {
        var populater = function(response, extras) {
            if(response.message === "Waiting for mobile authentication") {
                document.getElementById("statusMessage").innerHTML = response.message;
            } else if(response.message === "Authenticated") {
                document.getElementById("statusMessage").innerHTML = response.message;
                clearInterval(verify.intervalID);
                clearInterval(verify.timerID);
                //execute action
                ui.closePopup("verify2fa");
                if(response.verificationID != null) {
                    network.doESB(
                            verify.transactionDetails.callback, 
                            verify.transactionDetails.tagRoot, 
                            verify.transactionDetails.tagList, 
                            verify.transactionDetails.payload, 
                            verify.transactionDetails.extras, 
                            verify.transactionDetails.isAsync,
                            response.verificationID
                        );
                } else {
                    verify.transactionDetails.callback({"status" : "Verification failed", "esbStatus" : "Verification failed"});
                }
            } else {
                document.getElementById("statusMessage").innerHTML = response.message;
                verify.cancelAuth();
            }
        };
        
        var payload = '{"challenge":"' + challengeID + '"}';
        network.doIBS(populater, "verifyMobile2FA.action", payload, null, true);
    };
    
    verify.intervalID = setInterval(checkSessionAuth, 3000);
    verify.timerID = setInterval(startTimer, 1000);
    setTimeout(function() {
        verify.cancelAuth();
    }, verify.timeoutLength*1000);
};

verify.cancelAuth = function() {
    document.getElementById("mainMessage").innerHTML = verify.timeoutMessage;
    clearInterval(verify.timerID);
    clearInterval(verify.intervalID);
    ui.closePopup("verify2fa");
};