var profile = {};

profile.productList = null;
profile.triggers = null;
profile.affinities = null;

profile.init = function() {
    profile.stencils = {
        profileMain: stencil.define("profileMain", "#main")
    };
};

profile.buildPage = function() {
    profile.stencils.profileMain.render({});
    profile.getCustPref();
    profile.displayCustomerInfo();
    profile.buildAffinityList();

    $(function() {
        $( "#accordion" ).accordion({
            heightStyle: "content",
            active: false,
            collapsible: true   
        });
        $("#accordion > div").hide();
        $("#genNewM2FA").click(function() {
            $.ajax({
                url: "../SMUtBank_IBS/newM2FA.action",
                data: {
                    channel: system.channelName
                }
            }).done(function(response) {
                if(JSON.parse(response).status === "success") {
                    window.open('printM2FA.html', '_blank');
                }
            });
        });
    });
};

profile.getProductName = function(productCode) {
    var length = profile.productList["ns:Product.length"];
    for(var i = 1; i <= length; i++) {
        if(profile.productList["ns:Product" + i + ".ns:ProductID"] == productCode) {
            return profile.productList["ns:Product" + i + ".ns:ProductName"];
        }
    }
    return "Unknown Product Type";
};

profile.getProductList = function(isAsync) {
    var tagRoot = "ProductList";
    var tagList = '["ns:Product"]';
    var payload = '{"ServiceDomain":"MDM","OperationName":"MDM_ProductList_Read"}';
    
    var setProductList = function(list) {
        profile.productList = list;
    };
    network.doESB(setProductList, tagRoot, tagList, payload, isAsync);
};

profile.displayCustomerInfo = function() {
    
    var populater = function(response, extras) {
        var dob = new Date(response["CDMCustomer1.dateOfBirth"]);
        var month = [];
        month[0] = "January";
        month[1] = "February";
        month[2] = "March";
        month[3] = "April";
        month[4] = "May";
        month[5] = "June";
        month[6] = "July";
        month[7] = "August";
        month[8] = "September";
        month[9] = "October";
        month[10] = "November";
        month[11] = "December";
        
        document.getElementById("customerID").innerHTML = response["CDMCustomer1.customer.customerID"];
        document.getElementById("givenName").innerHTML = response["CDMCustomer1.givenName"];
        document.getElementById("lastName").innerHTML = response["CDMCustomer1.familyName"];
        document.getElementById("nationality").innerHTML = response["CDMCustomer1.profile.nationality"];
        document.getElementById("gender").innerHTML = response["CDMCustomer1.profile.gender"];
        document.getElementById("dob").innerHTML = dob.getDate() + " " + month[dob.getMonth()] + " " + dob.getFullYear();
        document.getElementById("occupation").innerHTML = response["CDMCustomer1.profile.occupation"];
        
        document.getElementById("email").value = response["CDMCustomer1.profile.email"];
        document.getElementById("phoneCountryCode").value = response["CDMCustomer1.phone.countryCode"];
        document.getElementById("phoneNo").value = response["CDMCustomer1.phone.localNumber"];
        document.getElementById("mobileCountryCode").value = response["CDMCustomer1.cellphone.countryCode"];
        document.getElementById("mobileNo").value = response["CDMCustomer1.cellphone.phoneNumber"];
        document.getElementById("fax").value = response["CDMCustomer1.profile.fax"];
        
        document.getElementById("address1").value = response["CDMCustomer1.address.streetAddress1"];
        document.getElementById("address2").value = response["CDMCustomer1.address.streetAddress2"];
        document.getElementById("city").value = response["CDMCustomer1.address.city"];
        document.getElementById("state").value = response["CDMCustomer1.address.state"];
        document.getElementById("country").innerHTML = ui.getCountryOptions();
        ui.selectListItem(document.getElementById("country"), response["CDMCustomer1.address.country"]);
        document.getElementById("postalCode").value = response["CDMCustomer1.address.postalCode"];
        
        // populate optional fields
        if (document.getElementById("phoneCountryCode").value === "undefined") document.getElementById("phoneCountryCode").value = "";
        if (document.getElementById("phoneNo").value === "undefined") document.getElementById("phoneNo").value = "";
        if (document.getElementById("fax").value === "undefined") document.getElementById("fax").value = "";
        if (document.getElementById("address2").value === "undefined") document.getElementById("address2").value = "";
    };
    profile.getCustomerInfo(populater);
};

profile.updateCustomerInfo = function() {
    if (document.getElementById("postalCode").value === ""){                // AM 20141103 optional field
        var modal = new myPop();
        modal.popOut("<p>Postal code is required</p>");
        return;
    }
    if (document.getElementById("phoneNo").value !== ""){                   // AM 20141103 optional field
        if(isNaN(document.getElementById("phoneNo").value)) {
            var modal = new myPop();
            modal.popOut("<p>Home number must be numeric</p>");
            return;
        }
    }
    if(isNaN(document.getElementById("mobileNo").value) || document.getElementById("mobileNo").value === "") {
        var modal = new myPop();
        modal.popOut("<p>Mobile number must be numeric</p>");
        return;
    }
    if (document.getElementById("fax").value !== ""){                       // AM 20141103 optional field
        if(isNaN(document.getElementById("fax").value)) {
            var modal = new myPop();
            modal.popOut("<p>Fax number must be numeric</p>");
            return;
        }
    }
    if (document.getElementById("phoneCountryCode").value !== ""){          // AM 20141103 optional field
        if(isNaN(document.getElementById("phoneCountryCode").value)) {
            var modal = new myPop();
            modal.popOut("<p>Country code must be numeric</p>");
            return;
        }
    }
    if(isNaN(document.getElementById("mobileCountryCode").value)) {
        var modal = new myPop();
        modal.popOut("<p>Country code must be numeric</p>");
        return;
    }
    if(document.getElementById("email").value.indexOf("@") < 0) {
        var modal = new myPop();
        modal.popOut("<p>Email invalid</p>");
        return;
    }
    
    var populater = function(response, extras) {
        var tagRoot = "Party_Customer_UpdateResponse";
        var tagList = '[""]';
        var phoneAreaCode = "";     // AM 20141103 not used
        var payload = 
            '{' + 
            '    "ServiceDomain":"Party",' + 
            '    "OperationName":"Party_Customer_Update",' + 
            '    "streetAddress1":"' + document.getElementById("address1").value + '",' + 
            '    "streetAddress2":"' + document.getElementById("address2").value + '",' + 
            '    "city":"' + document.getElementById("city").value + '",' + 
            '    "state":"' + document.getElementById("state").value + '",' + 
            '    "country":"' + document.getElementById("country")[document.getElementById("country").selectedIndex].value + '",' + 
            '    "postalCode":"' + document.getElementById("postalCode").value + '",' + 
            '    "customerType":"' + response["CDMCustomer1.profile.customerType"] + '",' + 
            '    "nationality":"' + response["CDMCustomer1.profile.nationality"] + '",' + 
            '    "gender":"' + response["CDMCustomer1.profile.gender"] + '",' + 
            '    "ethnicGroup":"' + response["CDMCustomer1.profile.ethnicGroup"] + '",' + 
            '    "occupation":"' + response["CDMCustomer1.profile.occupation"] + '",' + 
            '    "registerFund":"' + response["CDMCustomer1.profile.registerFund"] + '",' + 
            '    "email":"' + document.getElementById("email").value + '",' + 
            '    "fax":"' + document.getElementById("fax").value + '",' + 
            '    "phone.localNumber":"' + document.getElementById("phoneNo").value + '",' + 
//          '    "phone.areaCode":"' + response["CDMCustomer1.phone.areaCode"] + '",' + 
            '    "phone.areaCode":"' + phoneAreaCode + '",' + 
            '    "phone.countryCode":"' + document.getElementById("phoneCountryCode").value.toString() + '",' + 
            '    "cellphone.countryCode":"' + document.getElementById("mobileCountryCode").value + '",' + 
            '    "cellphone.phoneNumber":"' + document.getElementById("mobileNo").value + '",' + 
            '    "lastMaintenanceTellerId":"' + response["CDMCustomer1.maintenacehistory.lastMaintenanceTellerId"] + '",' + 
            '    "registrationDate":"' + response["CDMCustomer1.maintenacehistory.registrationDate"] + '",' + 
            '    "familyName":"' + response["CDMCustomer1.familyName"] + '",' + 
            '    "givenName":"' + response["CDMCustomer1.givenName"] + '",' + 
            '    "taxIdentifier":"' + response["CDMCustomer1.taxIdentifier"] + '",' + 
            '    "dateOfBirth":"' + response["CDMCustomer1.dateOfBirth"].substring(0, 10) + '"' + 
            '}';
        
        var updater = function(response, extras) {
            //display some success msg
            if(response.esbStatus === "invocation successful") {
                document.getElementById("updateCustomerStatus1").innerHTML = "Update successful";
                document.getElementById("updateCustomerStatus2").innerHTML = "Update successful";
            } else {
                document.getElementById("updateCustomerStatus1").innerHTML = "Update error";
                document.getElementById("updateCustomerStatus2").innerHTML = "Update error";
            }
            setTimeout(function(){$('#updateCustomerStatus1').fadeOut("slow", "swing", function() {document.getElementById("updateCustomerStatus1").style.display = ''; document.getElementById("updateCustomerStatus1").innerHTML = '';});}, 5000);
            setTimeout(function(){$('#updateCustomerStatus2').fadeOut("slow", "swing", function() {document.getElementById("updateCustomerStatus2").style.display = ''; document.getElementById("updateCustomerStatus2").innerHTML = '';});}, 5000);
            profile.displayCustomerInfo();
        };
        network.doESB(updater, tagRoot, tagList, payload, null, true);
    };
    profile.getCustomerInfo(populater);
};

profile.getCustomerInfo = function(callback) {
    var tagRoot = "Party_Customer_ReadResponse";
    var tagList = '["CDMCustomer"]';
    var payload = '{"ServiceDomain":"Party","OperationName":"Party_Customer_Read","PageNumber":"1","PageSize":"1"}';
    
    network.doESB(callback, tagRoot, tagList, payload, null, true);
};

profile.buildAccountsList = function() {
    var tagRoot = "AccountList";
    var tagList = '["accountID","productID"]';
    var payload = '{"ServiceDomain":"Party","OperationName":"Party_CustomerAccountList_Read"}';
    
    var populater = function(response, extras) {
        profile.getProductList(false);
        var output = "";
        for(var i = 1; i <= response["accountID.length"]; i++) {
            if(response["productID" + i] >= 100 && response["productID" + i] < 200) {
                output += '<option value="' + response["accountID" + i] + '">' + profile.getProductName(response["productID" + i]) + " " + response["accountID" + i] + '</option>';
            }
        }
        document.getElementById("accountList").innerHTML = output;
        profile.populateTrigger(null, null);
    };
    
    network.doESB(populater, tagRoot, tagList, payload, null, true);
};

profile.createCustPref = function() {
    var tagRoot = "Party_CustomerPreference_CreateResponse";
    var tagList = '[""]';
    var payload = 
    {
            "ServiceDomain":"Party",
            "OperationName":"Party_CustomerPreference_Create",
            "cus:MonthlyStatement.ViaEmail":"0",
            "cus:MonthlyStatement.ViaSnailMail":"0",
            "cus:RedeemPromotion.ViaEmail":"0",
            "cus:RedeemPromotion.ViaSMS":"0",
            "cus:RMModeOfCommunication.ViaEmail":"0",
            "cus:RMModeOfCommunication.ViaPhone":"0",
            "cus:RMModeOfCommunication.ViaSMS":"0",
    };
    
    var populater = function() {
        profile.getCustPref();
    };
    
    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
};

profile.getCustPref = function() {
    var tagRoot = "Party_CustomerPreference_ReadResponse";
    var tagList = '["Preference","Trigger"]';
    var payload = '{"ServiceDomain":"Party","OperationName":"Party_CustomerPreference_Read"}';
    
    var populater = function(response, extras) {
        if(response.esbStatus != "invocation successful") {
            profile.createCustPref();
            profile.buildAccountsList();
        } else {
            document.getElementById("mStateEmail").checked = response["Preference1.ns:MonthlyStatement.ViaEmail"] === 'true';
            document.getElementById("mStateSmail").checked = response["Preference1.ns:MonthlyStatement.ViaSnailMail"] === 'true';
            document.getElementById("promoEmail").checked = response["Preference1.ns:RedeemPromotion.ViaEmail"] === 'true';
            document.getElementById("promoSMS").checked = response["Preference1.ns:RedeemPromotion.ViaSMS"] === 'true';
            document.getElementById("commEmail").checked = response["Preference1.ns:RMModeOfCommunication.ViaEmail"] === 'true';
            document.getElementById("commSMS").checked = response["Preference1.ns:RMModeOfCommunication.ViaSMS"] === 'true';
            document.getElementById("commPhone").checked = response["Preference1.ns:RMModeOfCommunication.ViaPhone"] === 'true';
            
            profile.triggers = [];
            for(var i = 1; i <= response["Trigger.length"]; i++) {
                profile.triggers.push([response["Trigger" + i + ".AccountID"], response["Trigger" + i + ".TriggerType"], response["Trigger" + i + ".Amount"], response["Trigger" + i + ".ViaEmail"], response["Trigger" + i + ".ViaSMS"]]);
            }
        }
        profile.buildAccountsList();
    };
    network.doESB(populater, tagRoot, tagList, payload, null, true);
};

profile.populateTrigger = function(accountID1, triggerType1) {
    var accountID = (accountID1 != null)? accountID1 : document.getElementById("accountList")[document.getElementById("accountList").selectedIndex].value;
    var triggerType = (triggerType1 != null)? triggerType1 : document.getElementById("triggerType")[document.getElementById("triggerType").selectedIndex].value;
    for(var i = 0; i < profile.triggers.length; i++) {  
        if(profile.triggers[i][0] == accountID && profile.triggers[i][1] === triggerType) {
            document.getElementById("triggerEmail").checked = profile.triggers[i][3] === 'true';
            document.getElementById("triggerSMS").checked = profile.triggers[i][4] === 'true';
            document.getElementById("limit").value = profile.triggers[i][2];
            return;
        }
    }
    //If not found
    document.getElementById("triggerEmail").checked = false;
    document.getElementById("triggerSMS").checked = false;
    document.getElementById("limit").value = "";
};

profile.updateCustPref = function() {
    var tagRoot = "Party_CustomerPreference_UpdateResponse";
    var tagList = '[""]';
    var payload = 
    {
            "ServiceDomain":"Party",
            "OperationName":"Party_CustomerPreference_Update",
            "cus:MonthlyStatement.ViaEmail":document.getElementById("mStateEmail").checked,
            "cus:MonthlyStatement.ViaSnailMail":document.getElementById("mStateSmail").checked,
            "cus:RedeemPromotion.ViaEmail":document.getElementById("promoEmail").checked,
            "cus:RedeemPromotion.ViaSMS":document.getElementById("promoSMS").checked,
            "cus:RMModeOfCommunication.ViaEmail":document.getElementById("commEmail").checked,
            "cus:RMModeOfCommunication.ViaPhone":document.getElementById("commPhone").checked,
            "cus:RMModeOfCommunication.ViaSMS":document.getElementById("commSMS").checked,
    };
    
    if(document.getElementById("limit").value !== "") {
        payload["Trigger.repetition"] = "1";
        payload["Trigger^1.AccountID"] = document.getElementById("accountList")[document.getElementById("accountList").selectedIndex].value;
        payload["Trigger^1.TriggerType"] = document.getElementById("triggerType")[document.getElementById("triggerType").selectedIndex].value;
        payload["Trigger^1.Amount"] = document.getElementById("limit").value;
        payload["Trigger^1.ViaEmail"] = document.getElementById("triggerEmail").checked;
        payload["Trigger^1.ViaSMS"] = document.getElementById("triggerSMS").checked;
    }
    
    var populater = function(response, extras) {
        if(response.esbStatus == "invocation successful") {
            document.getElementById("updateCustPrefStatus").innerHTML = "Update successful";
        } else {
            document.getElementById("updateCustPrefStatus").innerHTML = "Update error";
        }
        setTimeout(function(){$('#updateCustPrefStatus').fadeOut("slow", "swing", function() {document.getElementById("updateCustPrefStatus").style.display = ''; document.getElementById("updateCustPrefStatus").innerHTML = '';});}, 5000);
        profile.getCustPref();
    };
    
    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
};

profile.updateLoginID = function() {
    
    // validate fields
    var newLoginTemp = document.getElementById("newLogin").value;
    if (newLoginTemp === "")
        newLoginTemp = document.getElementById("oldLogin").value;
    var newPINtemp = document.getElementById("newPIN").value;
    if (newPINtemp === "")
        newPINtemp = document.getElementById("oldPIN").value;
    if (isNaN(newPINtemp)){
        document.getElementById("updateLoginStatus").innerHTML = "PIN must be numeric";
        var modal = new myPop();
        modal.popOut("<p>PIN must be numeric</p>");
        return;
    }
    if (newPINtemp.length !== 6){
        document.getElementById("updateLoginStatus").innerHTML = "PIN must be 6 digits";
        var modal = new myPop();
        modal.popOut("<p>PIN must be 6 digits</p>");
        return;
    }
    
    // set payload
    var payload = {
            "ServiceDomain":"Party",
            "OperationName":"Party_Login_Update",
            "OldLoginID": document.getElementById("oldLogin").value,
            "NewLoginID": newLoginTemp,
            "OldPIN": document.getElementById("oldPIN").value,
            "NewPIN": newPINtemp,
    };
    
    // set populator
    var populater = function(response, extras) {
        if(response.esbStatus == "invocation successful") {
            document.getElementById("updateLoginStatus").innerHTML = "Update successful";
        } else {
            document.getElementById("updateLoginStatus").innerHTML = "Update error";
            var modal = new myPop();
            modal.popOut("<p>Old LoginID and PIN not found</p>");
            return;
        }
        document.getElementById("oldLogin").value = "";
        document.getElementById("newLogin").value = "";
        document.getElementById("oldPIN").value = "";
        document.getElementById("newPIN").value = "";
        setTimeout(function(){$('#updateLoginStatus').fadeOut("slow", "swing", function() {document.getElementById("updateLoginStatus").style.display = ''; document.getElementById("updateLoginStatus").innerHTML = '';});}, 5000);
    };
    
    // call service
    var tagRoot = "Party_Login_UpdateResponse";
    var tagList = '[""]';
    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
};

profile.buildAffinityList = function() {
    var tagRoot = "AffinityList";
    var tagList = '["ns:Affinity"]';
    var payload = {
            "ServiceDomain":"MDM",
            "OperationName":"MDM_AffinityList_Read",
    };
    
    var populater = function(response, extras) {
        profile.affinities = [];
        var headerCount = 0;
        var currentHeader = "";
        var builderString = "";
        for(var i = 1; i <= response["ns:Affinity.length"]; i++) {
            if(response["ns:Affinity" + i + ".ns:Level1"] != currentHeader) {
                currentHeader = response["ns:Affinity" + i + ".ns:Level1"];
                if(i != 1) {
                    builderString += '</div>';
                    document.getElementById("affCol" + headerCount % 3).innerHTML += builderString;
                }
                headerCount++;
                builderString = '<br/><span class="affinityHeader" style="cursor: pointer">[+] ' + currentHeader + '</span>' + 
                    '<div style="display:table;margin-left:10px;display:none">';
            }
            
            builderString += '<input type="checkbox" class="' + "" + '" id="' + "affinity" + response["ns:Affinity" + i + ".ns:AffinityID"] + '" /> ' + response["ns:Affinity" + i + ".ns:Level2"] + ' <br/>';
            profile.affinities.push(response["ns:Affinity" + i + ".ns:AffinityID"]);
            
            if(i == response["ns:Affinity.length"]) {
                builderString += '</div>';
                document.getElementById("affCol" + headerCount % 3).innerHTML += builderString;
            }
        }
        $('.affinityHeader').click(function() {
            $this = $(this);
            $target =  $this.next();
            if($target.is(':hidden')){
                $this.html($this.html().replace("+", "-"));
                $target.addClass('active').slideDown();
            } else {
                $this.html($this.html().replace("-", "+"));
                $target.removeClass('active').slideUp();
            }
        });
        profile.populateAffinityList();
    };
    
    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
};

profile.populateAffinityList = function() {
    var tagRoot = "PartyAffinityList";
    var tagList = '["ns:Affinity"]';
    var payload = {
            "ServiceDomain":"Party",
            "OperationName":"Party_AffinityList_Read",
    };
    
    var populater = function(response, extras) {
        for(var i = 1; i <= response["ns:Affinity.length"]; i++) {
            document.getElementById("affinity" + response["ns:Affinity" + i + ".ns:AffinityID"]).checked = response["ns:Affinity" + i + ".ns:Active"];
        }
    };
    
    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
};

profile.updateAffinities = function() {
    var tagRoot = "Party_AffinityList_UpdateResponse";
    var tagList = '[""]';
    var payload = 
    {
            "ServiceDomain":"Party",
            "OperationName":"Party_AffinityList_Update",
    };
    
    payload["par:Affinity.repetition"] = profile.affinities.length;
    for(var i = 1; i <= profile.affinities.length; i++) {
        payload["par:Affinity^" + i + ".par:AffinityID"] = profile.affinities[i - 1];
        payload["par:Affinity^" + i + ".par:Active"] = document.getElementById("affinity" + profile.affinities[i - 1]).checked;
    }
    
    var populater = function(response, extras) {
        if(response.esbStatus == "invocation successful") {
            document.getElementById("updateAffinitiesStatus").innerHTML = "Update successful";
        } else {
            document.getElementById("updateAffinitiesStatus").innerHTML = "Update error";
        }
        setTimeout(function(){$('#updateAffinitiesStatus').fadeOut("slow", "swing", function() {document.getElementById("updateAffinitiesStatus").style.display = ''; document.getElementById("updateAffinitiesStatus").innerHTML = '';});}, 5000);
        profile.populateAffinityList();
    };
    
    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
};
