var fundTransfer = {};
var standingInst = {};
var billingOrg = {};

fundTransfer.customerID = null;

fundTransfer.beneficiariesList = null;
fundTransfer.productList = null;
fundTransfer.accountList = null;
fundTransfer.selectedBeneficiaries = null;

standingInst.selectedSI = null;
standingInst.standingInstructionList = null;

billingOrg.billingOrgList = null;
billingOrg.giroList = null;
billingOrg.selectedGiroList = null;

fundTransfer.init = function() {
    fundTransfer.stencils = {
        fundTransferMain: stencil.define("fundTransferMain", "#main"),
        fundTransferMenu: stencil.define("fundTransferMenu", "#mainTable"),
        beneficiaryPage: stencil.define("beneficiaryPage", "#mainTable"),
        addBeneficiary: stencil.define("addBeneficiary", "none"),
        deleteConfirmation: stencil.define("deleteConfirmation", "none"),
        standingInstructionsList: stencil.define("standingInstructionsList", "#standingInstList"),
        giroList: stencil.define("giroList", "#giroList"),
        listError: stencil.define("listError", "none"),
        transfersPage: stencil.define("transfersPage", "#mainTable"),
        transferItems: stencil.define("transferItems", "#transferTable", ["accountList\\{\\{lpIdx\\}\\}", "transferType\\{\\{lpIdx\\}\\}"]),
        transferItemsErrorMessage: stencil.define("transferItemsErrorMessage", "#transferTable")
    };
};

fundTransfer.buildPage = function() {
    ui.loader.create(3, function() {
        fundTransfer.stencils.fundTransferMain.render({});
        var chainList = [billingOrg.buildGiroList];
        standingInst.buildStandingInstructionList(chainList);
        fundTransfer.buildFundTransferMenu();
    });
    fundTransfer.getProductList(true);
    var chainList = [fundTransfer.updateAccountList, billingOrg.loadOrgList];
    fundTransfer.loadBeneficiariesList(chainList);
    fundTransfer.getCustomerID();
};

fundTransfer.getCustomerID = function(chainList) {
    var tagRoot = "CDMCustomer";
    var tagList = '["customerID"]';
    var payload = '{"ServiceDomain":"Party","OperationName":"Party_Customer_Read", "PageNumber":"1", "PageSize":"1"}';
    
    var populater = function(response, extras) {
        fundTransfer.customerID = response.customerID1;
        
        //Next chain
        if(chainList != null && chainList.length > 0) {
            var chainFunction = chainList.shift();
            chainFunction(chainList);
        }
    };
    
    network.doESB(populater, tagRoot, tagList, payload, true);
};

fundTransfer.updateAccountList = function(chainList) {
    var tagRoot = "AccountList";
    var tagList = '["accountID","productID","currency","balance"]';
    var payload = '{"ServiceDomain":"Party","OperationName":"Party_CustomerAccountList_Read"}';
    
    var populater = function(response, extras) {
        fundTransfer.accountList = response;
        
        ui.loader.update("Retrieved accounts");
        //Next chain
        if(chainList != null && chainList.length > 0) {
            var chainFunction = chainList.shift();
            chainFunction(chainList);
        }
    };
    network.doESB(populater, tagRoot, tagList, payload, true);
};

fundTransfer.getNumCASA = function() {
    var counter = 0;
    var length = fundTransfer.accountList["accountID.length"];
    for(var i = 1; i <= length; i++) {
        if(fundTransfer.accountList["productID" + i] == 101) {
            counter++;
        }
    }
    return counter;
};

fundTransfer.getCASARef = function(selected) {
    var counter = 1;
    var length = fundTransfer.accountList["accountID.length"];
    for(var i = 1; i <= length; i++) {
        if(fundTransfer.accountList["productID" + i] == 101) {
            if(selected == counter) {
                return i;
            } else {
                counter++;
            }
        }
    }
};

fundTransfer.getAccountCurrency = function(accountNo) {
    var length = fundTransfer.accountList["accountID.length"];
    for(var i = 1; i <= length; i++) {
        if(fundTransfer.accountList["accountID" + i] == accountNo) {
            return fundTransfer.accountList["currency" + i];
        }
    }
};

fundTransfer.getProductName = function(productCode) {
    var length = fundTransfer.productList["ns:Product.length"];
    for(var i = 1; i <= length; i++) {
        if(fundTransfer.productList["ns:Product" + i + ".ns:ProductID"] == productCode) {
            return fundTransfer.productList["ns:Product" + i + ".ns:ProductName"];
        }
    }
    return "Unknown Product Type";
};

fundTransfer.getProductList = function(isAsync) {
    var tagRoot = "ProductList";
    var tagList = '["ns:Product"]';
    var payload = '{"ServiceDomain":"MDM","OperationName":"MDM_ProductList_Read"}';
    
    var setProductList = function(list) {
        fundTransfer.productList = list;
    };
    network.doESB(setProductList, tagRoot, tagList, payload, isAsync);
};

fundTransfer.getBeneficiaryDesc = function(accountID) {
    for(var i = 1; i <= fundTransfer.beneficiariesList['ns:Beneficiary.length']; i++) {
        if(fundTransfer.beneficiariesList['ns:Beneficiary' + i + '.ns:AccountID'] == accountID) {
            return fundTransfer.beneficiariesList['ns:Beneficiary' + i + '.ns:Description'];
        }
    }
    for(var i = 1; i <= billingOrg.billingOrgList['ns:BillingOrg.length']; i++) {
        if(billingOrg.billingOrgList['ns:BillingOrg' + i + '.ns:AccountID'] == accountID) {
            return billingOrg.billingOrgList['ns:BillingOrg' + i + '.ns:BillingOrgName'];
        }
    }
    if(fundTransfer.getAccountCurrency(accountID) != null) {
        return "Self";
    }
};

fundTransfer.getBeneficiaryCurrency = function(accountID) {
    for(var i = 1; i <= fundTransfer.beneficiariesList['ns:Beneficiary.length']; i++) {
        if(fundTransfer.beneficiariesList['ns:Beneficiary' + i + '.ns:AccountID'] == accountID) {
            return fundTransfer.beneficiariesList['ns:Beneficiary' + i + '.ns:Currency'];
        }
    }
};

fundTransfer.getBeneficiaryID = function(accountID) {
    for(var i = 1; i <= fundTransfer.beneficiariesList['ns:Beneficiary.length']; i++) {
        if(fundTransfer.beneficiariesList['ns:Beneficiary' + i + '.ns:AccountID'] == accountID) {
            return fundTransfer.beneficiariesList['ns:Beneficiary' + i + '.ns:BeneficiaryID'];
        }
    }
    for(var i = 1; i <= billingOrg.billingOrgList['ns:BillingOrg.length']; i++) {
        if(billingOrg.billingOrgList['ns:BillingOrg' + i + '.ns:AccountID'] == accountID) {
            return billingOrg.billingOrgList['ns:BillingOrg' + i + '.ns:BeneficiaryID'];
        }
    }
};

fundTransfer.buildFundTransferMenu = function() {
    fundTransfer.stencils.fundTransferMenu.render({});
};

//chain 1
fundTransfer.loadBeneficiariesList = function(chainList) {
    var populater = function(response, extras) {        
        fundTransfer.beneficiariesList = response;
        
        ui.loader.update("Retrieved beneficiaries");
        //Next chain
        if(chainList != null && chainList.length > 0) {
            var chainFunction = chainList.shift();
            chainFunction(chainList);
        }
    };
    var payload = '{"ServiceDomain":"Party","OperationName":"Party_BeneficiaryList_Read"}';
    network.doESB(populater, "BeneficiaryList", '["ns:Beneficiary"]', payload, null, true);
};




//My account/Other Account Tile



fundTransfer.buildBeneficiaryTable = function(isBillingOrg, isPersonal) {
    if(typeof isBillingOrg !== "boolean") {
        isBillingOrg = false;
    }
    var beneficiaries = [];
    var beneficiaryPageData = {
        beneficiaries: beneficiaries
    };
    fundTransfer.selectedBeneficiaries = [];
    if(isBillingOrg) {
        beneficiaryPageData.keyword = "billing organization";
        beneficiaryPageData.keywordPlural = "billing organizations";
        beneficiaryPageData.listName = beneficiaryPageData.keyword + " list";
    } else if (isPersonal) {
        beneficiaryPageData.keyword = "account";
        beneficiaryPageData.keywordPlural = "accounts";
        beneficiaryPageData.listName = "my " + beneficiaryPageData.keywordPlural;
    } else {
        beneficiaryPageData.keyword = "payee";
        beneficiaryPageData.keywordPlural = "payees";
        beneficiaryPageData.listName = "my " + beneficiaryPageData.keywordPlural;
    }
    
    if(isPersonal) {
        var list = fundTransfer.accountList;
        if(list['accountID.length'] != null) {
            for(var i = 1; i <= list['accountID.length']; i++) {
                if(list["productID" + i] == 101) {
                    beneficiaries.push({
                        beneficiaryName: fundTransfer.getProductName(list['productID' + i]) + " Account - $" + fundTransfer.getPrettyAmount(list['balance' + i]),
                        beneficiaryAccountNumber: list['accountID' + i],
                        beneficiaryAccountCurrency: "[" + list['currency' + i ] + "]"
                    });
                }
            }
            fundTransfer.stencils.beneficiaryPage.render(beneficiaryPageData);
            document.getElementById("buildTransfers").onclick = function() {
                fundTransfer.buildTransferTable(fundTransfer.selectedBeneficiaries,false, false, true); 
            };
            document.getElementById("addBeneficiary").style.display = 'none';
            document.getElementById("deleteBeneficiary").style.display = 'none';
        } else {
            fundTransfer.stencils.beneficiaryPage.render(beneficiaryPageData);
            $("#beneficiaryList").empty().append(fundTransfer.stencils.listError.render({errorMessage: "No existing accounts"}, "fragment"));
            document.getElementById("buildTransfers").style.display = 'none';
            document.getElementById("deleteBeneficiary").style.display = 'none';
        }
    } else if(isBillingOrg) {
        var list = billingOrg.billingOrgList;
        if(list['ns:BillingOrg.length'] != null) {
            for(var i = 1; i <= list['ns:BillingOrg.length']; i++) {
                beneficiaries.push({
                    beneficiaryName: list['ns:BillingOrg' + i + '.ns:BillingOrgName'],
                    beneficiaryAccountNumber: list['ns:BillingOrg' + i + '.ns:AccountID']
                });
            }
            fundTransfer.stencils.beneficiaryPage.render(beneficiaryPageData);
            document.getElementById("buildTransfers").onclick = function() {
                fundTransfer.buildTransferTable(fundTransfer.selectedBeneficiaries,false, true); 
            };
            document.getElementById("addBeneficiary").style.display = 'none';
            document.getElementById("deleteBeneficiary").style.display = 'none';
        } else {
            fundTransfer.stencils.beneficiaryPage.render(beneficiaryPageData);
            $("#beneficiaryList").empty().append(fundTransfer.stencils.listError.render({errorMessage: "No existing billing organizations"}, "fragment"));
            document.getElementById("buildTransfers").style.display = 'none';
            document.getElementById("deleteBeneficiary").style.display = 'none';
        }
    } else {
        var list = fundTransfer.beneficiariesList;
        if(list['ns:Beneficiary.length'] != null) {
            for(var i = 1; i <= list['ns:Beneficiary.length']; i++) {
                beneficiaries.push({
                    beneficiaryName: list['ns:Beneficiary' + i + '.ns:Description'],
                    beneficiaryAccountNumber: list['ns:Beneficiary' + i + '.ns:AccountID'],
                    beneficiaryAccountCurrency: "[" + list['ns:Beneficiary' + i + '.ns:Currency'] + "]"
                });
            }
            fundTransfer.stencils.beneficiaryPage.render(beneficiaryPageData);
            document.getElementById("buildTransfers").onclick = function() {
                fundTransfer.buildTransferTable(fundTransfer.selectedBeneficiaries, false); 
            };
            document.getElementById("deleteBeneficiary").style.display = '';
        } else {
            fundTransfer.stencils.beneficiaryPage.render(beneficiaryPageData);
            $("#beneficiaryList").empty().append(fundTransfer.stencils.listError.render({errorMessage: "No existing beneficiaries"}, "fragment"));
            document.getElementById("buildTransfers").style.display = 'none';
            document.getElementById("deleteBeneficiary").style.display = 'none';
        }
    }

    //Enable the selectable
    $(function() {
        $("#beneficiaryList").selectable({
            stop: function() {
                fundTransfer.selectedBeneficiaries = [];
                $(".ui-selected", $("#beneficiaryList")).each(function() {
                    if($(this).attr('id') != null && $(this).attr('id').indexOf("beneficiaryIndex") != -1) {
                        var itemId = $(this).attr('id');
                        var item = itemId.replace("beneficiaryIndex", "");
                        fundTransfer.selectedBeneficiaries.push(item);
                    }
                });
            }
        });
    });

};

fundTransfer.addBeneficiary = function() {
    var modal = new myPop();
    modal.popOut(fundTransfer.stencils.addBeneficiary.render({}, "string"));
};

fundTransfer.addNewBeneficiary = function() {
    var accountID = document.getElementById("createPayeeAccountID").value.toString();
    while(accountID.length < 10) {
        accountID = 0 + accountID;
    }
    var description = document.getElementById("createPayeeDesc").value;
    
    var populater = function(response, extras) {
        var message = "";
        
        if (response.esbStatus == "invocation successful")
            message = "Added successfully";
        else if (response.esbStatus == "record not found" || response.esbStatus == "input Account ID not exist")
            message = "CASA Account not valid";
        else
            message = response.esbStatus;
        document.getElementById("createPayeeStatus").innerHTML = message;
        if (response.esbStatus == "invocation successful"){
            document.getElementById("createPayeeAccountID").value = "";
            document.getElementById("createPayeeDesc").value = "";
            var chainList = [fundTransfer.buildBeneficiaryTable];
            fundTransfer.loadBeneficiariesList(chainList);
            ui.closePopup();
        }
    };
    
    var payload = '{"ServiceDomain":"Party","OperationName":"Party_Beneficiary_Create", "AccountID":"' + accountID + '", "Description":"' + description + '"}';
    network.doESB(populater, "BeneficiaryCreateResponse", '[""]', payload, null, true);
};

fundTransfer.confirmDeleteBeneficiary = function() {
    var modal = new myPop();
    var deleteData = {
        items: [],
        onclick: "fundTransfer.deleteBeneficiary();"
    };
    for(var i = 0; i < fundTransfer.selectedBeneficiaries.length; i++) {
        deleteData.items.push({
            itemLeft: fundTransfer.beneficiariesList['ns:Beneficiary' + fundTransfer.selectedBeneficiaries[i] + '.ns:Description'],
            itemRight: fundTransfer.beneficiariesList['ns:Beneficiary' + fundTransfer.selectedBeneficiaries[i] + '.ns:AccountID'] 
        });
    }
    modal.popOut(fundTransfer.stencils.deleteConfirmation.render(deleteData, "string"));
};

fundTransfer.deleteBeneficiary = function() {
    var counter = 0;
    var populater = function(response, extras) {
        counter--;
        if(counter === 0) {
            var chainList = [fundTransfer.buildBeneficiaryTable];
            fundTransfer.loadBeneficiariesList(chainList);
            if(response.status == "ok") {
                document.getElementById("beneficiaryStatus").innerHTML = '<i class="icon-ok" style="color:green"></i>Successfully deleted';
                setTimeout(function(){$('#beneficiaryStatus').fadeOut("slow", "swing", function() {document.getElementById("beneficiaryStatus").style.display = ''; document.getElementById("beneficiaryStatus").innerHTML = '';});}, 5000);
            } else {
                document.getElementById("beneficiaryStatus").innerHTML = "Error";
                setTimeout(function(){$('#beneficiaryStatus').fadeOut("slow", "swing", function() {document.getElementById("beneficiaryStatus").style.display = ''; document.getElementById("beneficiaryStatus").innerHTML = '';});}, 5000);
            }
            standingInst.buildStandingInstructionList();
        }
    };
    for(var i = 0; i < fundTransfer.selectedBeneficiaries.length; i++) {
        counter++;
        var payload = '{"ServiceDomain":"Party","OperationName":"Party_Beneficiary_Delete", "AccountID":"' + fundTransfer.beneficiariesList['ns:Beneficiary' + fundTransfer.selectedBeneficiaries[i] + '.ns:AccountID']  + '"}';
        network.doESB(populater, "BeneficiaryDeleteResponse", '[""]', payload, null, true);
    }
};

//chain 2
standingInst.buildStandingInstructionList = function(chainList) {
    standingInst.selectedSI = [];
    var populater = function(response, extras) {
        standingInst.standingInstructionList = response;
        var standingInstructionData = [];
        
        if(response["ns:StandingInstruction.length"] != null) {
            for(var i = 1; i <= response["ns:StandingInstruction.length"]; i++) {
                standingInstructionData.push({
                    beneficiaryName: fundTransfer.getBeneficiaryDesc(response["ns:StandingInstruction" + i + ".ns:ToAccount"]),
                    currency: fundTransfer.getAccountCurrency(response["ns:StandingInstruction" + i + ".ns:FromAccount"]),
                    amount: "$" + fundTransfer.getPrettyAmount(response["ns:StandingInstruction" + i + ".ns:Amount"]),
                    description: (response["ns:StandingInstruction" + i + ".ns:Memo"] != null)? response["ns:StandingInstruction" + i + ".ns:Memo"] : "<i>No description</i>",
                    nextDateTime: dateTimeModifier(response["ns:StandingInstruction" + i + ".ns:NextDateTime"]),
                    recurrenceType: (response["ns:StandingInstruction" + i + ".ns:Weekly_Monthly"] != null || response["ns:StandingInstruction" + i + ".ns:Weekly_Monthly"] !== "")? response["ns:StandingInstruction" + i + ".ns:Weekly_Monthly"] : "Future"
                });
            }
            fundTransfer.stencils.standingInstructionsList.render(standingInstructionData);
            document.getElementById("doSIEdit").style.display = '';
            document.getElementById("doSIDelete").style.display = '';
        } else {
            $("#standingInstList").empty().append(fundTransfer.stencils.listError.render({errorMessage: "You have no standing transfers"}, "fragment"));
            document.getElementById("doSIEdit").style.display = 'none';
            document.getElementById("doSIDelete").style.display = 'none';
        }

        $("#standingInstList").selectable({
            stop: function() {
                standingInst.selectedSI = [];
                $(".ui-selected", $("#standingInstList")).each(function() {
                    if($(this).attr('id') != null && $(this).attr('id').indexOf("standingIndex") != -1) {
                        var itemId = $(this).attr('id');
                        var item = itemId.replace("standingIndex", "");
                        standingInst.selectedSI.push(item);
                    }
                });
            }
        });

        //Next chain
        if(chainList != null && chainList.length > 0) {
            var chainFunction = chainList.shift();
            chainFunction(chainList);
        }
    };
    
    var dateTimeModifier = function(dateTimeString) {
        var date = moment(dateTimeString);
        return date.format("DD[ <b>]MMM[</b> ]YYYY[<br>]hh:mm[<b>]a[</b>]");
    };
    
    var payload = '{"ServiceDomain":"Payment","OperationName":"Payment_StandingInstructionList_Read"}';
    network.doESB(populater, "StandingInstructionList", '["ns:StandingInstruction"]', payload, null, true);
};

standingInst.buildEditSITable = function() {
    //populate transfer table
    fundTransfer.buildTransferTable(standingInst.selectedSI, true);
};

standingInst.doSIUpdate = function() {
    document.getElementById("doTransfers").style.display = "none";
    var doStandingInstructionUpdate = function(siID, amount, recurring, nextDateTime, description, i) {
        var tagRoot = "Payment_StandingInstruction_UpdateResponse";
        var tagList = '[""]';
        var payload = {
                "ServiceDomain":"Payment", 
                "OperationName":"Payment_StandingInstruction_Update",
                "StandingInstructionID": siID,
                "Amount" : amount,
                "IsRecurring" : (recurring == "Future")? 0 : 1 ,
                "Weekly_Monthly" : recurring,
                "NextDateTime" : nextDateTime,
                "Memo" : description
            };
        
        var populater = function(response, extras) {
            if(response.esbStatus == "invocation successful") {
                document.getElementById("transferStatusColour" + extras.i).style.borderBottom = "solid green";
                document.getElementById("transferStatusColour" + extras.i).style.borderWidth = "3px";
                document.getElementById("transferStatus" + extras.i).innerHTML = "Update Successful";
            } else {
                document.getElementById("transferStatusColour" + extras.i).style.borderBottom = "solid red";
                document.getElementById("transferStatusColour" + extras.i).style.borderWidth = "3px";
                document.getElementById("transferStatus" + extras.i).innerHTML = "Error processing update: " + response.esbStatus;
            }
            setTimeout(function(){$('#transferStatus' + extras.i).fadeOut("slow", "swing", function() {document.getElementById("transferStatus" + extras.i).style.display = ''; document.getElementById("transferStatus" + extras.i).innerHTML = '';});}, 5000);
            standingInst.buildStandingInstructionList();
        };
        network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), {"i" : i}, true);
    };
    
    for(var i = 0; i < standingInst.selectedSI.length; i++) {
        document.getElementById("transferStatusColour" + i).style.borderBottom = "solid yellow";
        document.getElementById("transferStatusColour" + i).style.borderWidth = "3px";
        var nextDate = moment(document.getElementById("transferStartDate" + i).value + " " + document.getElementById("transferTime" + i).value, "DD MMM YYYY HH:mm");
        var description = (standingInst.standingInstructionList['ns:StandingInstruction' + standingInst.selectedSI[i] + '.ns:TransactionReferenceNumber'] == null)? document.getElementById("transferDesc" + i).value : standingInst.standingInstructionList['ns:StandingInstruction' + standingInst.selectedSI[i] + '.ns:Memo'];
        doStandingInstructionUpdate(
                standingInst.standingInstructionList['ns:StandingInstruction' + standingInst.selectedSI[i] + '.ns:StandingInstructionID'],
                document.getElementById("transferAmount" + i).value,
                document.getElementById("transferType" + i)[document.getElementById("transferType" + i).selectedIndex].value,
                nextDate.format("YYYY-MM-DD HH:mm:ss"),
                description,
                i
        );
    }
};

standingInst.confirmDeleteSI = function() {
    var modal = new myPop();
    var deleteData = {
        items: [],
        onclick: "standingInst.deleteSI();"
    };
    for(var i = 0; i < standingInst.selectedSI.length; i++) {
        deleteData.items.push({
            itemLeft: fundTransfer.getBeneficiaryDesc(standingInst.standingInstructionList['ns:StandingInstruction' + standingInst.selectedSI[i] + '.ns:ToAccount']),
            itemRight: standingInst.standingInstructionList['ns:StandingInstruction' + standingInst.selectedSI[i] + '.ns:Memo']
        });
    }
    modal.popOut(fundTransfer.stencils.deleteConfirmation.render(deleteData, "string"));
};

standingInst.deleteSI = function() {
    var counter = 0;
    
    var doDeleteSI = function(siID) {
        var populater = function(response, extras) {
            counter--;
            if(counter === 0) {
                standingInst.buildStandingInstructionList();
                if(response.status == "ok") {
                    document.getElementById("siStatus").innerHTML = '<i class="icon-ok" style="color:green"></i>Successfully deleted';
                    setTimeout(function(){$('#siStatus').fadeOut("slow", "swing", function() {document.getElementById("siStatus").style.display = ''; document.getElementById("siStatus").innerHTML = '';});}, 5000);
                } else {
                    document.getElementById("siStatus").innerHTML = "Error";
                    setTimeout(function(){$('#siStatus').fadeOut("slow", "swing", function() {document.getElementById("siStatus").style.display = ''; document.getElementById("siStatus").innerHTML = '';});}, 5000);
                }
            }
        };
        var payload = '{"ServiceDomain":"Payment","OperationName":"Payment_StandingInstruction_Deactivate", "StandingInstructionID":"' + siID + '"}';
        network.doESB(populater, "Payment_StandingInstruction_DeactivateResponse", '[""]', payload, null, true);
    };
    
    for(var i = 0; i < standingInst.selectedSI.length; i++) {
        counter++;
        doDeleteSI(standingInst.standingInstructionList['ns:StandingInstruction' + standingInst.selectedSI[i] + '.ns:StandingInstructionID']);
    }
};

fundTransfer.buildTransferTable = function(selectedList, isSIUpdate, isBillingOrg, isPersonal) {
    var accountList = [];
    var transferType = [];
    var transfersPageDataset = {};
    var transferItemsDataset = [];

    if(isBillingOrg) {
        transfersPageDataset.keyword = "billing organization";
        transferType.push({transferType: "Immediate"});
        transferType.push({transferType: "Future"});
        transferType.push({transferType: "GIRO"});
    } else if(isSIUpdate) {
        transfersPageDataset.keyword = "payee";
        transferType.push({transferType: "Future"});
        transferType.push({transferType: "Weekly"});
        transferType.push({transferType: "Monthly"});
    } else {
        transfersPageDataset.keyword = "payee";
        transferType.push({transferType: "Immediate"});
        transferType.push({transferType: "Future"});
        transferType.push({transferType: "Weekly"});
        transferType.push({transferType: "Monthly"});
    }
    fundTransfer.stencils.transfersPage.render(transfersPageDataset);

    if(selectedList.length === 0) {
        fundTransfer.stencils.transferItemsErrorMessage.render(transfersPageDataset);
        document.getElementById("doTransfers").style.display = "none";
        return;
    }

    var getNewTransferItem  = function() {
        var transferItem = {};
        transferItem["accountList\\{\\{lpIdx\\}\\}"] = accountList;
        transferItem["transferType\\{\\{lpIdx\\}\\}"] = transferType;
        transferItemsDataset.push(transferItem);
        return transferItem;
    };

    var populater = function(response, extras) {
        fundTransfer.accountList = response;
        
        for(var j = 1; j <= response["accountID.length"]; j++) {
            if(response["productID" + j] == 101 && response["currentStatus" + j] == 'Open') {
                accountList.push({
                    accountNumber: response["accountID" + j],
                    productName: fundTransfer.getProductName(response["productID" + j]),
                    accountCurrency: response["currency" + j],
                    accountBalance: fundTransfer.getPrettyAmount(response["balance" + j])
                });
            }
        }

        //rmb to set accCurrency
        for(var i = 0; i < selectedList.length; i++) {
            var transferItem = getNewTransferItem();

            if(isSIUpdate) {
                var nextDateTime = moment(standingInst.standingInstructionList["ns:StandingInstruction" + selectedList[i] + ".ns:NextDateTime"]);
                transferItem.beneficiaryAccountNumber = standingInst.standingInstructionList['ns:StandingInstruction' + selectedList[i] + '.ns:ToAccount'];
                transferItem.beneficiaryName = fundTransfer.getBeneficiaryDesc(transferItem.beneficiaryAccountNumber);
                transferItem.beneficiaryAccountCurrency = fundTransfer.getBeneficiaryCurrency(transferItem.beneficiaryAccountNumber);
                transferItem.usingAccount = standingInst.standingInstructionList["ns:StandingInstruction" + selectedList[i] + ".ns:FromAccount"];
                transferItem.usingTransferType = standingInst.standingInstructionList["ns:StandingInstruction" + selectedList[i] + ".ns:Weekly_Monthly"];
                transferItem.nextDate = nextDateTime.format("DD MMM YYYY");
                transferItem.nextTime = nextDateTime.format("HH:mm");
                transferItem.accountCurrency = fundTransfer.getAccountCurrency(standingInst.standingInstructionList["ns:StandingInstruction" + selectedList[i] + ".ns:FromAccount"]);
                transferItem.amount = standingInst.standingInstructionList["ns:StandingInstruction" + selectedList[i] + ".ns:Amount"];
                transferItem.description = standingInst.standingInstructionList["ns:StandingInstruction" + selectedList[i] + ".ns:Memo"];
                transferItem.descriptionLabel = "Description";
                transferItem.descriptionPlaceholder = "Comments";
                transferItem.accountListAttr = "disabled";
            } else if(isBillingOrg) {
                transferItem.beneficiaryAccountNumber = billingOrg.billingOrgList['ns:BillingOrg' + selectedList[i] + '.ns:AccountID'];
                transferItem.beneficiaryName = billingOrg.billingOrgList['ns:BillingOrg' + selectedList[i] + '.ns:BillingOrgName'];
                transferItem.beneficiaryAccountCurrency = "SGD";
                transferItem.accountCurrency = (accountList.length > 0)? accountList[0].accountCurrency: "";
                transferItem.transferDateTimeRowStyle = "display:none;";
                transferItem.descriptionLabel = "Invoice No.";
                transferItem.descriptionPlaceholder = "Invoice No.";
            } else if(isPersonal) {
                transferItem.beneficiaryAccountNumber = fundTransfer.accountList['accountID' + fundTransfer.getCASARef(selectedList[i])];
                transferItem.beneficiaryName = fundTransfer.getProductName(fundTransfer.accountList['productID' + fundTransfer.getCASARef(selectedList[i])]) + " Account";
                transferItem.beneficiaryAccountCurrency = fundTransfer.accountList['currency' + fundTransfer.getCASARef(selectedList[i])];
                transferItem.accountCurrency = (accountList.length > 0)? accountList[0].accountCurrency: "";
                transferItem.transferDateTimeRowStyle = "display:none;";
                transferItem.descriptionLabel = "Description";
                transferItem.descriptionPlaceholder = "Comments";
            } else {
                //normal beneficiary
                transferItem.beneficiaryAccountNumber = fundTransfer.beneficiariesList['ns:Beneficiary' + selectedList[i] + '.ns:AccountID'];
                transferItem.beneficiaryName = fundTransfer.getBeneficiaryDesc(transferItem.beneficiaryAccountNumber);
                transferItem.beneficiaryAccountCurrency = fundTransfer.getBeneficiaryCurrency(transferItem.beneficiaryAccountNumber);
                transferItem.accountCurrency = (accountList.length > 0)? accountList[0].accountCurrency: "";
                transferItem.transferDateTimeRowStyle = "display:none;";
                transferItem.descriptionLabel = "Description";
                transferItem.descriptionPlaceholder = "Comments";
            }
        }

        //render page
        fundTransfer.stencils.transferItems.render(transferItemsDataset);
        if(isBillingOrg) {
            document.getElementById("doTransfers").onclick = function() {fundTransfer.doTransfers(true);};
            document.getElementById("back").onclick = function() {billingOrg.buildOrgList();};
        } else if(isPersonal) {
            document.getElementById("doTransfers").onclick = function() {fundTransfer.doTransfers(false, true);};
            document.getElementById("back").onclick = function() {fundTransfer.buildBeneficiaryTable(false, true);};
        } else if(isSIUpdate) {
            document.getElementById("doTransfers").innerHTML = "UPDATE";
            document.getElementById("doTransfers").onclick = function() {standingInst.doSIUpdate();};
            $("select[id^=accountList]").prop("disabled", true);
        } else {
            document.getElementById("learningCubeFT").style.display = "inline";
        }

        //date picker in jquery
        $(function() {
            $( ".dateBox" ).datepicker({
                showButtonPanel: true,
                dateFormat: 'dd M yy',
                minDate: 0
            });
        });
    };

    var tagRoot = "AccountList";
    var tagList = '["accountID","productID","currency","balance","currentStatus"]';
    var payload = '{"ServiceDomain":"Party","OperationName":"Party_CustomerAccountList_Read"}';
    network.doESB(populater, tagRoot, tagList, payload, true);
};

fundTransfer.updateAccCurrency = function(itemNo, accountNo) {
    document.getElementById("transferCurrency" + itemNo).innerHTML = fundTransfer.getAccountCurrency(accountNo);
};

fundTransfer.updateTransferType = function(itemNo, transferType) {
    if(transferType  == "Immediate") {
        document.getElementById("transferAmount" + itemNo).disabled = false;
        document.getElementById("transferAmount" + itemNo).placeholder = 'dollars.cents';
        document.getElementById("transferAmount" + itemNo).style.backgroundColor = '';
        document.getElementById("transferDesc" + itemNo).disabled = false;
        document.getElementById("transferDesc" + itemNo).placeholder = '';
        document.getElementById("transferDesc" + itemNo).style.backgroundColor = '';
        document.getElementById("transferRow" + itemNo).style.display = 'none';
    } else if(transferType  == "GIRO") {
        document.getElementById("transferAmount" + itemNo).disabled = true;
        document.getElementById("transferAmount" + itemNo).placeholder = 'disabled';
        document.getElementById("transferAmount" + itemNo).style.backgroundColor = '';
        document.getElementById("transferDesc" + itemNo).disabled = true;
        document.getElementById("transferDesc" + itemNo).placeholder = 'disabled';
        document.getElementById("transferDesc" + itemNo).style.backgroundColor = '';
        document.getElementById("transferRow" + itemNo).style.display = 'none';
    } else {
        document.getElementById("transferAmount" + itemNo).disabled = false;
        document.getElementById("transferAmount" + itemNo).placeholder = 'dollars.cents';
        document.getElementById("transferAmount" + itemNo).style.backgroundColor = '';
        document.getElementById("transferDesc" + itemNo).disabled = false;
        document.getElementById("transferDesc" + itemNo).placeholder = '';
        document.getElementById("transferDesc" + itemNo).style.backgroundColor = '';
        document.getElementById("transferRow" + itemNo).style.display = '';
    }
};

fundTransfer.updateAllTransferType = function() {
    for(var i = 0; i < fundTransfer.selectedBeneficiaries.length; i++) {
        updateTransferType(i, "Immediate");
    }
};

fundTransfer.doTransfers = function(isBillingOrg, isPersonal) {
    var doCreditTransfer = function(accountFrom, accountTo, transactionAmount, narrative, beneficiaryID, i) {
        var tagRoot = "Payment_CreditTransfer_CreateResponse";
        var tagList = '["TransactionID","BalanceBefore","BalanceAfter"]';
        var payload = {
                                    "ServiceDomain":"Payment", 
                                    "OperationName":"Payment_CreditTransfer_Create",
                                    "accountFrom":accountFrom,
                                    "accountTo":accountTo,
                                    "transactionAmount":transactionAmount,
                                    "transactionReferenceNumber": (isBillingOrg)? narrative : "",
                                    "paymentMode":"IB Fund Transfer",
                                    "overrideFlag":"false",
                                    "narrative":(isBillingOrg)? "Bill payment to " + fundTransfer.getBeneficiaryDesc(accountTo) + " | Ref: " + narrative : narrative,
                                    "transactionBranch":"IBS",
                                    "officerID":"01",
                                    "merchantID":"0000000001",
                                    "beneficiaryID":beneficiaryID
                                };
        
        var populater = function(response, extras) {
            fundTransfer.updateAccountList();
            if(response.esbStatus == "invocation successful") {
                document.getElementById("transferStatus" + i).style.color = "green";
                document.getElementById("transferStatusColour" + i).style.borderBottom = "solid green";
                document.getElementById("transferStatusColour" + i).style.borderWidth = "3px";
                document.getElementById("transferStatus" + i).innerHTML = "Transfer successful";
            } else if(response.esbStatus == "insufficient funds") {
                document.getElementById("transferStatus" + i).style.color = "red";
                document.getElementById("transferStatusColour" + i).style.borderBottom = "solid red";
                document.getElementById("transferStatusColour" + i).style.borderWidth = "3px";
                if(response.esbStatusDetails.indexOf("daily limit") >= 0) {
                    var details = response.esbStatusDetails.match(/[0-9]+/g);
                    document.getElementById("transferStatus" + i).innerHTML = "Error processing transfer: <br>Daily limit of $" + details[0] + " exceeded for A/C: " + details[1];
                } else {
                    document.getElementById("transferStatus" + i).innerHTML = "Error processing transfer: <br>" + response.esbStatusDetails;
                }
            } else {
                document.getElementById("transferStatus" + i).style.color = "red";
                document.getElementById("transferStatusColour" + i).style.borderBottom = "solid red";
                document.getElementById("transferStatusColour" + i).style.borderWidth = "3px";
                document.getElementById("transferStatus" + i).innerHTML = "Error processing transfer";
            }
            runNext();
            setTimeout(function(){$('#transferStatus' + i).fadeOut("slow", "swing", function() {document.getElementById("transferStatus" + i).style.display = ''; document.getElementById("transferStatus" + i).innerHTML = '';});}, 5000);
        };
        network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), false);
    };
    
    var doStandingInstruction = function(repetition, fromAccount, toAccount, amount, recurrence, nextDateTime, description, i) {
        var tagRoot = "Payment_StandingInstruction_CreateResponse";
        var tagList = '["StandingInstructionID"]';
        var today = moment();
        var dateString = today.format("YYYY-MM-DD HH:mm:ss");
        var payload = {
                "ServiceDomain":"Payment", 
                "OperationName":"Payment_StandingInstruction_Create",
                "stan:StandingInstruction.repetition":repetition
            };
        for(var j = 1; j <= repetition; j++) {
            payload["stan:StandingInstruction^" + j + ".stan:StandingInstructionID"] = 0;
            payload["stan:StandingInstruction^" + j + ".stan:FromAccount"] = fromAccount;
            payload["stan:StandingInstruction^" + j + ".stan:ToAccount"] = toAccount;
            payload["stan:StandingInstruction^" + j + ".stan:Amount"] = amount;
            payload["stan:StandingInstruction^" + j + ".stan:TransactionReferenceNumber"] = (isBillingOrg)? description : "";
            payload["stan:StandingInstruction^" + j + ".stan:isRecurring"] =    (recurrence == "Future")? 0 : 1;
            payload["stan:StandingInstruction^" + j + ".stan:Weekly_Monthly"] = recurrence;
            payload["stan:StandingInstruction^" + j + ".stan:LastDateTime"] = dateString;
            payload["stan:StandingInstruction^" + j + ".stan:NextDateTime"] = nextDateTime;
            payload["stan:StandingInstruction^" + j + ".stan:Memo"] = (isBillingOrg)? "Bill payment" : description;
        }
        
        var populater = function(response, extras) {
            standingInst.buildStandingInstructionList();
            if(response.esbStatus == "invocation successful") {
                document.getElementById("transferStatus" + i).style.color = "green";
                document.getElementById("transferStatusColour" + i).style.borderBottom = "solid green";
                document.getElementById("transferStatusColour" + i).style.borderWidth = "3px";
                document.getElementById("transferStatus" + i).innerHTML = "Transfer successful";
            } else if(response.esbStatus == "insufficient funds") {
                document.getElementById("transferStatus" + i).style.color = "red";
                document.getElementById("transferStatusColour" + i).style.borderBottom = "solid red";
                document.getElementById("transferStatusColour" + i).style.borderWidth = "3px";
                if(response.esbStatusDetails.indexOf("daily limit") >= 0) {
                    var details = response.esbStatusDetails.match(/[0-9]+/g);
                    document.getElementById("transferStatus" + i).innerHTML = "Error processing transfer: <br>Daily limit of $" + details[0] + " exceeded for A/C: " + details[1];
                } else {
                    document.getElementById("transferStatus" + i).innerHTML = "Error processing transfer: <br>" + response.esbStatusDetails;
                }
            } else {
                document.getElementById("transferStatus" + i).style.color = "red";
                document.getElementById("transferStatusColour" + i).style.borderBottom = "solid red";
                document.getElementById("transferStatusColour" + i).style.borderWidth = "3px";
                document.getElementById("transferStatus" + i).innerHTML = "Error processing transfer";
            }
            runNext();
            setTimeout(function(){$('#transferStatus' + i).fadeOut("slow", "swing", function() {document.getElementById("transferStatus" + i).style.display = ''; document.getElementById("transferStatus" + i).innerHTML = '';});}, 5000);
        };
        network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
    };
    
    var doGIRO = function(fromAccount, toAccount, beneficiaryID, i) {
        var tagRoot = "Payment_DirectDebitAuthorization_CreateResponse";
        var tagList = '["DirectDebitAuthorizationID"]';
        var payload = {
                "ServiceDomain":"Payment", 
                "OperationName":"Payment_DirectDebitAuthorization_Create",
                "aut:Authorization.repetition":1
            };
        payload["aut:CustomerAccountID"] = fromAccount;
        payload["aut:BillingOrgID"] = beneficiaryID;
        payload["aut:BillingOrgAccountID"] = toAccount;
        payload["aut:CustomerBankCode"] = 1;
        payload["aut:BillingOrgBankCode"] = 1;
        
        var populater = function(response, extras) {
            billingOrg.buildGiroList();
            if(response.esbStatus == "invocation successful") {
                document.getElementById("transferStatus" + i).style.color = "green";
                document.getElementById("transferStatusColour" + i).style.borderBottom = "solid green";
                document.getElementById("transferStatusColour" + i).style.borderWidth = "3px";
                document.getElementById("transferStatus" + i).innerHTML = "Transfer successful";
            } else if(response.esbStatus == "insufficient funds") {
                document.getElementById("transferStatus" + i).style.color = "red";
                document.getElementById("transferStatusColour" + i).style.borderBottom = "solid red";
                document.getElementById("transferStatusColour" + i).style.borderWidth = "3px";
                if(response.esbStatusDetails.indexOf("daily limit") >= 0) {
                    var details = response.esbStatusDetails.match(/[0-9]+/g);
                    document.getElementById("transferStatus" + i).innerHTML = "Error processing transfer: <br>Daily limit of $" + details[0] + " exceeded for A/C: " + details[1];
                } else {
                    document.getElementById("transferStatus" + i).innerHTML = "Error processing transfer: <br>" + response.esbStatusDetails;
                }
            } else {
                document.getElementById("transferStatus" + i).style.color = "red";
                document.getElementById("transferStatusColour" + i).style.borderBottom = "solid red";
                document.getElementById("transferStatusColour" + i).style.borderWidth = "3px";
                document.getElementById("transferStatus" + i).innerHTML = "Error processing transfer";
            }
            runNext();
            setTimeout(function(){$('#transferStatus' + i).fadeOut("slow", "swing", function() {document.getElementById("transferStatus" + i).style.display = ''; document.getElementById("transferStatus" + i).innerHTML = '';});}, 5000);
        };
        network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
    };
    
    //for(var i = 0; i < fundTransfer.selectedBeneficiaries.length; i++) {
    var i = null;
    var runNext = function() {
        if(i === null) {
            i = fundTransfer.selectedBeneficiaries.length - 1;
        } else if(i <= 0) {
            return;
        } else {
            i--;
        }
        //input validation
        if(document.getElementById("transferType" + i)[document.getElementById("transferType" + i).selectedIndex].value !== "GIRO" && 
                 document.getElementById("transferAmount" + i).value === "") {
            document.getElementById("transferStatus" + i).style.color = "red";
            document.getElementById("transferStatus" + i).innerHTML = "Amount cannot be blank";
            runNext();
        } else if((document.getElementById("transferStartDate" + i).value === "" || document.getElementById("transferTime" + i).value === "") && 
                (document.getElementById("transferType" + i)[document.getElementById("transferType" + i).selectedIndex].value !== "GIRO" && 
                        document.getElementById("transferType" + i)[document.getElementById("transferType" + i).selectedIndex].value !== "Immediate")) {
            document.getElementById("transferStatus" + i).style.color = "red";
            document.getElementById("transferStatus" + i).innerHTML = "Date/Time cannot be blank";
            runNext();
        } else {
            //if no error with input validation
            document.getElementById("doTransfers").style.display = 'none';
            document.getElementById("transferStatusColour" + i).style.borderBottom = "solid yellow";
            document.getElementById("transferStatusColour" + i).style.borderWidth = "3px";
            var accountFrom = document.getElementById("accountList" + i)[document.getElementById("accountList" + i).selectedIndex].value;
            var accountTo = document.getElementById("benefciaryAccountID" + i).innerHTML;
            var beneficiaryID = (isPersonal)? fundTransfer.customerID : fundTransfer.getBeneficiaryID(accountTo);
            var transactionAmount = document.getElementById("transferAmount" + i).value;
            var narrative = document.getElementById("transferDesc" + i).value;
            var nextDate = moment(document.getElementById("transferStartDate" + i).value + " " + document.getElementById("transferTime" + i).value, "DD MMM YYYY HH:mm");
            var nextDateTimeString = (nextDate != null)? nextDate.format("YYYY-MM-DD HH:mm:ss") : "";
            if(document.getElementById("transferType" + i)[document.getElementById("transferType" + i).selectedIndex].value === "Immediate") {
                doCreditTransfer(accountFrom, accountTo, transactionAmount, narrative, beneficiaryID, i);
            } else if(document.getElementById("transferType" + i)[document.getElementById("transferType" + i).selectedIndex].value === "GIRO") {
                doGIRO(accountFrom, accountTo, beneficiaryID, i);
            } else {
                var recurrence = document.getElementById("transferType" + i)[document.getElementById("transferType" + i).selectedIndex].value;
                doStandingInstruction(1, accountFrom, accountTo, transactionAmount, recurrence, nextDateTimeString, narrative, i);
            }
        }
    };
    
    //start transfers
    runNext();
};

billingOrg.buildOrgList = function() {
    fundTransfer.buildBeneficiaryTable(true);
};

billingOrg.loadOrgList = function(chainList) {
    billingOrg.billingOrgList = [];
    var populater = function(response, extras) {        
        billingOrg.billingOrgList = response;
        
        //Next chain
        ui.loader.update("Retrieved billing organizations");
        if(chainList != null && chainList.length > 0) {
            var chainFunction = chainList.shift();
            chainFunction(chainList);
        }
    };
    var payload = '{"ServiceDomain":"Party","OperationName":"Party_BillingOrgList_Read"}';
    network.doESB(populater, "BillingOrgList", '["ns:BillingOrg"]', payload, null, true);
};

billingOrg.buildGiroList = function(chainList) {
    billingOrg.selectedGiroList = [];
    var populater = function(response, extras) {
        billingOrg.giroList = response;
        var giroData = [];
        
        if(response["ns:Authorization.length"] != null) {
            for(var i = 1; i <= response["ns:Authorization.length"]; i++) {
                giroData.push({
                    giroAccountName: fundTransfer.getBeneficiaryDesc(response["ns:Authorization" + i + ".ns:BillingOrgAccountID"]),
                    debitingAccountNumber: response["ns:Authorization" + i + ".ns:CustomerAccountID"]
                });
            }
            fundTransfer.stencils.giroList.render(giroData);
            document.getElementById("doGiroDelete").style.display = '';
        } else {
            $("#giroList").empty().append(fundTransfer.stencils.listError.render({errorMessage: "You have no GIRO authorizations"}, "fragment"));
            document.getElementById("doGiroDelete").style.display = 'none';
        }

        $("#giroList").selectable({
            stop: function() {
                billingOrg.selectedGiroList = [];
                $(".ui-selected", $("#giroList")).each(function() {
                    if($(this).attr('id') != null && $(this).attr('id').indexOf("giroIndex") != -1) {
                        var itemId = $(this).attr('id');
                        var item = itemId.replace("giroIndex", "");
                        billingOrg.selectedGiroList.push(item);
                    }
                });
            }
        });

        //Next chain
        if(chainList != null && chainList.length > 0) {
            var chainFunction = chainList.shift();
            chainFunction(chainList);
        }
    };
    
    var payload = '{"ServiceDomain":"Payment","OperationName":"Payment_DirectDebitAuthorizationList_Read"}';
    network.doESB(populater, "AuthorizationList", '["ns:Authorization"]', payload, null, true);
};

billingOrg.confirmDeleteGiro = function() {
    var modal = new myPop();
    var deleteData = {
        items: [],
        onclick: "billingOrg.deleteGiro();"
    };
    for(var i = 0; i < billingOrg.selectedGiroList.length; i++) {
        deleteData.items.push({
            itemLeft: fundTransfer.getBeneficiaryDesc(billingOrg.giroList['ns:Authorization' + billingOrg.selectedGiroList[i] + '.ns:BillingOrgAccountID']),
            itemRight: billingOrg.giroList['ns:Authorization' + billingOrg.selectedGiroList[i] + '.ns:CustomerAccountID']
        });
    }
    modal.popOut(fundTransfer.stencils.deleteConfirmation.render(deleteData, "string"));
};

billingOrg.deleteGiro = function() {
    var counter = 0;
    
    var doDeleteGiro = function(ddaID) {
        var populater = function(response, extras) {
            counter--;
            if(counter === 0) {
                billingOrg.buildGiroList();
                if(response.status == "ok") {
                    document.getElementById("giroStatus").innerHTML = '<i class="icon-ok" style="color:green"></i>Successfully deleted';
                    setTimeout(function(){$('#giroStatus').fadeOut("slow", "swing", function() {document.getElementById("giroStatus").style.display = ''; document.getElementById("giroStatus").innerHTML = '';});}, 5000);
                } else {
                    document.getElementById("giroStatus").innerHTML = "Error";
                    setTimeout(function(){$('#giroStatus').fadeOut("slow", "swing", function() {document.getElementById("giroStatus").style.display = ''; document.getElementById("giroStatus").innerHTML = '';});}, 5000);
                }
            }
        };
        var payload = '{"ServiceDomain":"Payment","OperationName":"Payment_DirectDebitAuthorization_Delete", "DirectDebitAuthorizationID":"' + ddaID + '"}';
        network.doESB(populater, "Payment_DirectDebitAuthorization_DeleteResponse", '[""]', payload, null, true);
    };
    
    for(var i = 0; i < billingOrg.selectedGiroList.length; i++) {
        counter++;
        doDeleteGiro(billingOrg.giroList['ns:Authorization' + billingOrg.selectedGiroList[i] + '.ns:DirectDebitAuthorizationID']);
    }
};

fundTransfer.getDollars = function(amount) {
    var balance = parseFloat(amount).toFixed(2);
    return (balance - fundTransfer.getCents(amount)/100);
};

fundTransfer.getPrettyAmount = function(amount, noCents) {
    var dollars = fundTransfer.getDollars(amount).toString();
    var cents = fundTransfer.getCents(amount);
    
    for(var i = dollars.length - 3; i > 0; i -= 3) {
        dollars = dollars.substring(0, i) + "," + dollars.substring(i, dollars.length);
    }
    if(noCents) {
        return dollars;
    } else {
        return dollars + "." + cents;
    }
};

fundTransfer.getCents = function(amount) {
    var balance = parseFloat(amount).toFixed(2);
    var balanceCents = ((balance - Math.floor(balance)) * 100).toFixed(0);
    balanceCents = (balanceCents < 10)? (balanceCents == 0)? "00" : "0" + balanceCents : balanceCents;
    return balanceCents;
};