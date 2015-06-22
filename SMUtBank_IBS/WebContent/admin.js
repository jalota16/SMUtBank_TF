var doESB = function(path ,callback, tagRoot, tagList, sessionID, payload, extras, isAsync) {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			var response = JSON.parse(xmlhttp.responseText);
			//
			if(response.status === "ok") {
				if(response.esbStatus === "Unknown, field not found") {
					alert("Service is currently unavaliable");
				}
				callback(response, extras);
			} else {
				alert("Network error, unable to contact tBank ESB");
			}
		}
	};

	xmlhttp.open("POST", path, isAsync);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send('jsonRequest=' + payload + '&tagRoot=' + tagRoot + '&tagList=' + tagList + '&sessionID=' + sessionID + '&channel=RMB');
};

var rmbInvalidate = function() {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			var response = JSON.parse(xmlhttp.responseText);
			document.getElementById("rmbSessionID").innerHTML = response.status;
		};
	};
	
	xmlhttp.open("POST", "rmbInvalidateSession.action", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("sessionID=" + document.getElementById("rmbSessionID").innerHTML);
};

var getChallenge = function() {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			var response = JSON.parse(xmlhttp.responseText);
			if(response.status === "ok") {
				document.getElementById("challenge").innerHTML = response.challenge;
			} else {
				document.getElementById("challenge").innerHTML = response.status;
			}
		}
	};
	
	xmlhttp.open("POST", "LoginTransaction.action", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("jsonRequest={username:ibtest,PIN:123456}&channel=RMB");
};

var getSession = function() {
	var challenge = document.getElementById("challenge").innerHTML;
	if(challenge === "") {
		alert("No challenge!");
		return;
	}
	var uuk = "783DA45143F1240A4889AC48362685F7C4856B92B3477076DE9CCAEE50B9A1427BC94B9310C10997CF829FFBC3FCCD8000217E7437D9597A13C39C5F2F8E4349E45A5D622809FEC733C5C3C84865AF27C9BCD89E6BC785E3B1C3EA5CB163BE451271FF115D632BB6506766B39385B2BE68DCB32C86AD534C8C504A23F3F5CA93";
	var hashed = hash(uuk + challenge);
	//alert(hashed);
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			var response = JSON.parse(xmlhttp.responseText);
			if(response.status === "ok") {
				document.getElementById("rmbSessionID").innerHTML = response.sessionID;
			} else {
				document.getElementById("rmbSessionID").innerHTML = response.status;
			}
		}
	};
	
	xmlhttp.open("POST", "LoginSession.action", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("jsonRequest={ServiceDomain:Party,OperationName:Party_Login_Mobile2FA_Authenticate,challenge:" + challenge + ",hash:" + hashed + "}&channel=RMB");
};

var hash = function (content) {
	//alert("hashing obj: " + content);
	try {
		var shaObj = new jsSHA(content, "TEXT");
		return shaObj.getHash("SHA-512", "HEX").toUpperCase();
	} catch(e) {
		//alert(e);
		throw new Exception();
	}
};

var createQPT = function() {
	var populate = function(response, extras) {
		if(response.status === "ok") {
			document.getElementById("quikpayStatus").innerHTML = "QuikPay transaction created successfully!!";
			document.getElementById("quikpayID").innerHTML = response.quikPayID;
		}
	};
	
	var payload = '{"accountCredit":"0000000082"}';
	doESB("ajaxCreateQPTransaction.action", populate, "", [""],document.getElementById("rmbSessionID").innerHTML , payload, null, true);
};

var updateQPT = function() {
	var populate = function(response, extras) {
		if(response.status === "ok") {
			document.getElementById("quikpayStatus").innerHTML = "QuikPay transaction updated successfully!!";
		}
	};
	
	var payload = '{"quikPayID":' + document.getElementById("quikpayID").innerHTML + ', "accountDebit":"0000000079", "amount":"10.32"}';
	doESB("ajaxUpdateQPTransaction.action", populate, "", [""],document.getElementById("rmbSessionID").innerHTML , payload, null, true);
};

var getQPT = function() {
	var populate = function(response, extras) {
		if(response.status === "ok") {
			document.getElementById("quikpayStatus").innerHTML = "QuikPay transaction retrieved successfully!!";
			document.getElementById("accountCredit").innerHTML = response.accountCredit;
			document.getElementById("accountDebit").innerHTML = response.accountDebit;
			document.getElementById("amount").innerHTML = response.amount;
		}
	};
	
	var payload = '{"quikPayID":' + document.getElementById("quikpayID").innerHTML + '}';
	doESB("ajaxGetQPTransaction.action", populate, "", [""],document.getElementById("rmbSessionID").innerHTML , payload, null, true);
};

var effectQPT = function() {
	var populate = function(response, extras) {
		if(response.status === "ok") {
			document.getElementById("quikpayStatus").innerHTML = "QuikPay transaction effected successfully!!";
			document.getElementById("TransactionID").innerHTML = response.TransactionID1;
			document.getElementById("BalanceBefore").innerHTML = response.BalanceBefore1;
			document.getElementById("BalanceAfter").innerHTML = response.BalanceAfter1;
		}
	};
	
	var payload = '{"quikPayID":' + document.getElementById("quikpayID").innerHTML + '}';
	doESB("ajaxEffectQPTransaction.action", populate, "", [""],document.getElementById("rmbSessionID").innerHTML , payload, null, true);
};

