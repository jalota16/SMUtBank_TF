//Accounts AJAX 
var accounts = {};

//Holding list for holding static info
accounts.productList = null;
accounts.transTypeList = null;

accounts.init = function() {
    accounts.stencils = {
        accountsMain: stencil.define("accountsMain", "#main"),
        casaTile: stencil.define("casaTile", "#CASAAccountsList"),
        tdTile: stencil.define("tdTile", "#CASAAccountsList"),
        loanTile: stencil.define("loanTile", "#LoanAccountsList"),
        transactionHistory: stencil.define("transactionHistory", "none", ["transactions"])
    };
};

//On page startup
accounts.buildPage = function() {
    ui.loader.create(3);
    //Chain list is to chain asynchronous methods together into a asynchronous-synchronous pattern
    var chainList = [accounts.getTransTypeList, accounts.getAccounts];
    accounts.getProductList(chainList);
};

accounts.getTransTypeCode = function(transTypeID) {
    var length = accounts.transTypeList["ns:TransactionType.length"];
    for(var i = 1; i <= length; i++) {
        if(accounts.transTypeList["ns:TransactionType" + i + ".ns:TransactionTypeID"] == transTypeID) {
            return accounts.transTypeList["ns:TransactionType" + i + ".ns:TransactionCode"];
        }
    }
    return "UNK";
};

accounts.getTransTypeList = function(chainList) {
    var tagRoot = "TransactionTypeList";
    var tagList = '["ns:TransactionType"]';
    var payload = '{"ServiceDomain":"MDM","OperationName":"MDM_TransactionTypeList_Read"}';
    
    var populater = function(response, extra) {
        accounts.transTypeList = response;

        ui.loader.update("Retrieved transaction information");
        //Next chain
        if(chainList != null && chainList.length > 0) {
            var chainFunction = chainList.shift();
            chainFunction(chainList);
        }
    };
    
    network.doESB(populater, tagRoot, tagList, payload, true);
};

accounts.setProductList = function(list) {
    accounts.productList = list;
};

accounts.getProductName = function(productCode) {
    var length = accounts.productList["ns:Product.length"];
    for(var i = 1; i <= length; i++) {
        if(accounts.productList["ns:Product" + i + ".ns:ProductID"] == productCode) {
            return accounts.productList["ns:Product" + i + ".ns:ProductName"];
        }
    }
    return "Unknown Product Type";
};

accounts.getProductList = function(chainList) {
    var tagRoot = "ProductList";
    var tagList = '["ns:Product"]';
    var payload = '{"ServiceDomain":"MDM","OperationName":"MDM_ProductList_Read"}';
    
    var populater = function(response, extra) {
        accounts.productList = response;
        
        ui.loader.update("Retrieved product information");
        //Next chain
        if(chainList != null && chainList.length > 0) {
            var chainFunction = chainList.shift();
            chainFunction(chainList);
        }
    };
    
    network.doESB(populater, tagRoot, tagList, payload, true);
};

accounts.getAccounts = function() {
    var casaDataset = [];
    var tdDataset = [];
    var loansDataset = [];
    var builder = function(productID, status, accountID) {
        var output = "";
        // CASA account
        if(productID >= 100 && productID < 150 && (status === "Open" || status === "" || status === "?" || status == null)) {
            var accountDetails = {accountNumber: accountID};
            casaDataset.push(accountDetails);
            return accountDetails;
        // TD account (for now. need to make TD a separate range)
        } else if(productID >= 150 && productID < 200 && (status === "Open" || status === "" || status === "?" || status == null)) {
            var accountDetails = {accountNumber: accountID};
            tdDataset.push(accountDetails);
            return accountDetails;
        // Loan account
//        } else if(productID >= 200 && productID < 300) {
        } else if(productID >= 200 && productID < 400) {		// AM 20150510
            var accountDetails = {accountNumber: accountID};
            loansDataset.push(accountDetails);
            return accountDetails;
        }
    };
    
    var populater = function(response, extras) {
        ui.loader.incrementTotalUpdates(parseFloat(response["accountID.length"]));
        ui.loader.update("Retrieved accounts list");
        accounts.stencils.accountsMain.render({});
        var counter = 0;
        var delayAjax = $.Deferred();
        var render = function() {
            counter--;
            if(counter === 0) {
                accounts.stencils.casaTile.render(casaDataset);
                accounts.stencils.tdTile.render(tdDataset, "append");
                accounts.stencils.loanTile.render(loansDataset);
                delayAjax.resolve();

                var accountItem = $('.accountItem').hide();
                var accountInfo = $('.acccountItemInfo').hide();
                $('.accountType > h2 > span').click(function() {
                    $this = $(this);
                    $target =  $this.parent().next();
                    accountInfo.removeClass('active').slideUp('fast');
                    setTimeout(function() {
                        if($target.is(':hidden')){
                            accountItem.removeClass('active').slideUp();
                            $target.addClass('active').slideDown();
                        } else {
                            accountItem.removeClass('active').slideUp();
                        }
                    }, 200);
                });
                $('.accountItemHeader').click(function() {
                    $this = $(this);
                    $target =  $this.parent().next();
                    accountInfo.removeClass('active').slideUp();
                    if($target.is(':hidden')){
                        accountInfo.removeClass('active').slideUp();
                        $target.addClass('active').slideDown();
                    }
                    $( ".dateBox" ).datepicker({
                        showButtonPanel: true,
                        dateFormat: 'dd M yy',
                    });
                });
                
                $('.dateMonthBox').monthpicker({changeYear:true, minDate: "-2 Y", maxDate: "+0 M", dateFormat: 'M yy' });
            }
        };

        var getTransactionHistory = function(accountNumber) {
            return function() {accounts.getTransactionHistory(accountNumber);};
        };

        for(var i  = 0; i < response["accountID.length"]; i++) {
            var productID = response["productID" + (i + 1)];
            var status = response["currentStatus" + (i + 1)];
            var accountDetails = builder(productID, status, response["accountID" + (i + 1)]);
            
//            if(productID >= 100 && productID < 300) {
            if(productID >= 100 && productID < 400) {		// AM 20150510
//                if((productID >= 100 && productID < 200 && (status === "Open" || status === "" || status === "?" || status == null)) || (productID >= 200 && productID < 300)) {
                if((productID >= 100 && productID < 200 && (status === "Open" || status === "" || status === "?" || status == null)) || (productID >= 200 && productID < 400)) {		// AM 20150510
                    accountDetails.productName = accounts.getProductName(productID);
                    accountDetails.currency = response["currency" + (i + 1)];
                    var balance = parseFloat(response["balance" + (i + 1)]).toFixed(2);
                    accountDetails.balance =  accounts.getPrettyAmount(accounts.getDollars(balance), true) + ".<span style='font-size:large'>" + accounts.getCents(balance) + "</span>";
                } else {
                    ui.loader.update("Skipping inactive accounts");
                }
            }
            
            if(productID >= 100 && productID < 150 && (status === "Open" || status === "" || status === "?" || status == null)) {
                delayAjax.done(getTransactionHistory(accountDetails.accountNumber, render));
            } else if(productID >= 150 && productID < 200 && (status === "Open" || status === "" || status === "?" || status == null)) {
                counter++;
                accounts.getTDSummary(accountDetails, render);
            } else if(productID >= 200 && productID < 300) {
                counter++;
                if(response["currentStatus" + (i + 1)] == "Closed") {
                    accountDetails.status = '<div class="vertical-text"><div class="vertical-text__inner">' + response["currentStatus" + (i + 1)] + '</div></div>';
                    accountDetails.statusColour = "#696969";
                    accountDetails.repaymentStyle = "display:none;";
                } else if(response["currentStatus" + (i + 1)] != "Open") {
                    accountDetails.status = '<div class="vertical-text"><div class="vertical-text__inner">' + response["currentStatus" + (i + 1)] + '</div></div>';
                    accountDetails.statusColour = "crimson";
                    accountDetails.repaymentStyle = "display:none;";
                } else {
                    accountDetails.status = '<div class="vertical-text"><div class="vertical-text__inner"></div></div>';
                }
                accounts.getLoanSummary(accountDetails, render);
            } else if(productID >= 300 && productID < 400) {		// AM 20150510
                counter++;
                if(response["currentStatus" + (i + 1)] == "Closed") {
                    accountDetails.status = '<div class="vertical-text"><div class="vertical-text__inner">' + response["currentStatus" + (i + 1)] + '</div></div>';
                    accountDetails.statusColour = "#696969";
                    accountDetails.repaymentStyle = "display:none;";
                } else if(response["currentStatus" + (i + 1)] != "Open") {
                    accountDetails.status = '<div class="vertical-text"><div class="vertical-text__inner">' + response["currentStatus" + (i + 1)] + '</div></div>';
                    accountDetails.statusColour = "crimson";
                    accountDetails.repaymentStyle = "display:none;";
                } else {
                    accountDetails.status = '<div class="vertical-text"><div class="vertical-text__inner"></div></div>';
                    accountDetails.repaymentStyle = "display:none;";
                }
                accounts.getLoanSummary(accountDetails, render);
            }
        }
        if(counter === 0) {
            counter++;
            render();
        }
    };
    
    var tagRoot = "AccountList";
    var tagList = '["accountID","productID","currency","balance","currentStatus"]';
    var payload = '{"ServiceDomain":"Party","OperationName":"Party_CustomerAccountList_Read"}';
    
    network.doESB(populater, tagRoot, tagList, payload, true);
};

accounts.getTDSummary = function(accountDetails, render) {
    var populater = function(response, extras) {
        ui.loader.update("Retrieved TD Details");
        accountDetails.interestRate = (parseFloat(response.interestRate1) * 100).toFixed(2);
        accountDetails.penaltyRate = (parseFloat(response.penaltyRate1) * 100).toFixed(2);
        accountDetails.maturityDate = moment(response.maturityDate1, "YYYY-MM-DD").format("DD MMM YYYY");
        accountDetails.depositTerm = response.depositTerm1;
        accountDetails.interestPayoutAccount = response.interestPayoutAccount1;
        render();
    };
    
    var tagRoot = "Account_Deposit_ReadResponse";
    var tagList = '["interestRate","penaltyRate","maturityDate","depositTerm","interestPayoutAccount"]';
    var payload = '{"ServiceDomain":"Account","OperationName":"Account_Deposit_Read","accountID":"' + accountDetails.accountNumber  + '"}';
    network.doESB(populater, tagRoot, tagList, payload, null, true);
};

accounts.getLoanSummary = function(accountDetails, render) {
    var populater = function(response, extras) {
        ui.loader.update("Retrieved Loan Details");
        accountDetails.loanTerm = response.loanTerm1;
        accountDetails.disbursementAmount = accounts.getPrettyAmount(parseFloat(response.disburseAmount1).toFixed(2));
        accountDetails.title = response.title1;
        accountDetails.assetValue = accounts.getPrettyAmount(parseFloat(response.assetValue1).toFixed(2));
        accountDetails.installmentAmount = accounts.getPrettyAmount(parseFloat(response.installmentAmount1).toFixed(2));
        accountDetails.interestRate = (parseFloat(response.interestRate1) * 100).toFixed(2);
        accountDetails.maturityDate = moment(response.maturityDate1, "YYYY-MM-DD").format("DD MMM YYYY");
        accountDetails.settlementAccount = response.SettlementAccount1;
        render();
    };
    
    var tagRoot = "Account_Loan_ReadResponse";
    var tagList = '["loanTerm","disburseAmount","title","assetValue","installmentAmount","interestRate","maturityDate","SettlementAccount"]';
    var payload = '{"ServiceDomain":"Account","OperationName":"Account_Loan_Read","accountID":"' + accountDetails.accountNumber  + '"}';
    network.doESB(populater, tagRoot, tagList, payload, null, true);
};

accounts.getTransactionHistory = function(accountID, pageNum) {
    pageNum = (pageNum == null)? 1 : pageNum;
    
    var dateRange = document.getElementsByName("data_range" + accountID);
    var dateOpts = null;
    for(var i = 0; i < dateRange.length; i++) {
        if(dateRange[i].checked) {
            dateOpts = dateRange[i].value;
            break;
        }
    }
    
    var sortType = document.getElementsByName("sort_transaction" + accountID);
    var sortOpts = "descending";
    for(var i = 0; i < sortType.length; i++) {
        if(sortType[i].checked) {
            sortOpts = sortType[i].value;
            break;
        }
    }
    
    var startDate = null;
    var endDate = null;
    
    if(dateOpts != "range" || dateOpts == null) {
        var today = moment();
        today.hour(23).minute(59).second(59);
        endDate = today.format("YY-MM-DD HH:mm:ss");
        if(dateOpts === "thisMonth" || dateOpts == null) {
            today.date(1);
            startDate = moment(today).format("YY-MM-DD");
        } else if(dateOpts === "plusOne") {
            today.subtract('months', 1);
            today.date(1);
            startDate = moment(today).format("YY-MM-DD");
        } else if(dateOpts === "plusTwo") {
            today.subtract('months', 2);
            today.date(1);
            startDate = moment(today).format("YY-MM-DD");
        }
    } else {
        var specifiedEnd = moment(document.getElementById("endDate" + accountID).value, "DD MMM YYYY");
        specifiedEnd.hour(23).minute(59).second(59);
        endDate = specifiedEnd.format("YY-MM-DD HH:mm:ss");
        var specifiedStart = moment(document.getElementById("startDate" + accountID).value, "DD MMM YYYY");
        startDate = specifiedStart.format("YY-MM-DD HH:mm:ss");
    }
    
    var tagRoot = "CDMTransactionDetail";
    var tagList = '["accountFrom","transactionAmount","transactionDate","transactionReferenceNumber","narrative","currency","transactionType","exchangeRate", "interimBalance", "accountTo_interimBalance"]';
    var payload = '{"ServiceDomain":"Transaction","OperationName":"Transaction_History_Read","AccountNumber":"' + accountID  + '","StartDate":"' + startDate  + '","EndDate":"' + endDate  + '","NumRecords":"10"'  +  ',"NumPages":"' + pageNum + '"}';
    network.doESB(accounts.buildTransactionHistory, tagRoot, tagList, payload, {"accountID":accountID, "sortOpts":sortOpts, "pageNum":pageNum}, true);
};

accounts.buildTransactionHistory = function(transactionHistory, extras) {
    ui.loader.update("Retrieved Transaction History");
    var transactions = [];
    var accountID = extras.accountID;
    var transactionHistoryData = {
        accountNumber: accountID,
        pageNumber: extras.pageNum,
        transactions: transactions
    };
    var length = (transactionHistory["accountFrom.length"] != null)? transactionHistory["accountFrom.length"] : 1;
    if(transactionHistory.esbStatus != "invocation successful") {
        length = 1;
    } 
    
    
    if(length >= 10) {
        if(extras.pageNum === 1) {
            transactionHistoryData.prevPageStyle = "visibility:hidden;";
        }
    } else if(extras.pageNum > 1) {
        transactionHistoryData.nextPageStyle = "visibility:hidden;";
    } else {
        transactionHistoryData.pagingStyle = "display:none;";
    }
    
    var sortedTransactionHistory = [];
    for(var i = 1; i <= length; i++) {
        var nextDate = moment(transactionHistory["transactionDate" + i], "YYYY-MM-DD HH:mm:ss");
        if(sortedTransactionHistory.length === 0) {
            //populate the array with an obj first
            //alert("pushing");
            sortedTransactionHistory.push([i, nextDate]);
        } else {
            //alert("length: " + sortedTransactionHistory.length);
            for(var j = 0; j < sortedTransactionHistory.length; j++) {
                //alert("index: " + j + " of " + (sortedTransactionHistory.length - 1) + ", \ncomparing: " + nextDate + ", \nwith: " + sortedTransactionHistory[j][1]);
                if(nextDate.isBefore(sortedTransactionHistory[j][1])) {
                    //alert("Is earlier than this item, splicing infront");
                    sortedTransactionHistory.splice(j,0,[i, nextDate]);
                    break;
                } else if(j === sortedTransactionHistory.length - 1) {
                    //No match found, push to end of array
                    //alert("pushing to end of array");
                    sortedTransactionHistory.push([i, nextDate]);
                    break;
                }
            }
        }
    }
    // reverse if descending
    if(extras.sortOpts != "ascending") {
        sortedTransactionHistory.reverse();
    } 
    
    if(transactionHistory.esbStatus != "invocation successful") {
        transactions.push({
            transactionDescription: transactionHistory.esbStatus
        });
    } else {
        for(var i = 0; i < sortedTransactionHistory.length; i++) {
            var date = sortedTransactionHistory[i][1];
            var index = sortedTransactionHistory[i][0];
            var isReverseCreditType = (transactionHistory["transactionType" + index] >= 500 && transactionHistory["transactionType" + index] < 600);
            var transaction = {
                transactionDate: date.format("DD [<b>]MMM[</b>] YYYY [<br/>] [<b>]ddd[</b>] h:mma"),
                transactionType: accounts.getTransTypeCode(transactionHistory["transactionType" + index]),
                transactionDescription: (transactionHistory["narrative" + index] == null) ? "": transactionHistory["narrative" + index],
            };
            if(transactionHistory["accountFrom" + index] != accountID) {
                transaction.creditAmount = "$" + accounts.getPrettyAmount((parseFloat(transactionHistory["transactionAmount" + index]) * parseFloat(transactionHistory["exchangeRate" + index])).toFixed(2));
                transaction.debitAmount = "-";
                transaction.interimBalance = "$" + accounts.getPrettyAmount(parseFloat(transactionHistory["accountTo_interimBalance" + index]).toFixed(2));
            } else {
                transaction.debitAmount = "$" + accounts.getPrettyAmount(parseFloat(transactionHistory["transactionAmount" + index]).toFixed(2));
                transaction.creditAmount = "-";
                transaction.interimBalance = "$" + accounts.getPrettyAmount(parseFloat(transactionHistory["interimBalance" + index]).toFixed(2));
            }
            if(isReverseCreditType) {
                var holder = transaction.creditAmount;
                transaction.creditAmount = transaction.debitAmount;
                transaction.debitAmount = holder;
            }
            transactions.push(transaction);
        }
    }
    $("#transactionHistory" + accountID).replaceWith(accounts.stencils.transactionHistory.render(transactionHistoryData, "fragment"));
};

accounts.getAccountStatement = function(accountID) {
    if(document.getElementById("accStateDate" + accountID).value == null ) {
        alert("Select a date first");
    }
    var monthYear = moment(document.getElementById("accStateDate" + accountID).value, 'MMM YYYY');
    document.getElementById("accStateDate" + accountID).value = "";
    
    if(monthYear.month() == moment().month() && monthYear.year() == moment().year()) {
        window.open("../SMUtBank_IBS/getAccStatement.action?accountID=" + accountID + "&month=" + monthYear.format('MM') + "&year=" + monthYear.format('YYYY') + "&partial=true");
    } else {
        window.open("../SMUtBank_IBS/getAccStatement.action?accountID=" + accountID + "&month=" + monthYear.format('MM') + "&year=" + monthYear.format('YYYY') + "&partial=false");
    }
};

accounts.getDollars = function(amount) {
    var balance = parseFloat(amount).toFixed(2);
    return (balance - accounts.getCents(amount)/100).toFixed(0);
};

accounts.getPrettyAmount = function(amount, noCents) {
    var dollars = accounts.getDollars(amount).toString();
    var cents = accounts.getCents(amount);
    
    for(var i = dollars.length - 3; i > 0; i -= 3) {
        dollars = dollars.substring(0, i) + "," + dollars.substring(i, dollars.length);
    }
    if(noCents) {
        return dollars;
    } else {
        return dollars + "." + cents;
    }
};

accounts.getCents = function(amount) {
    var balance = parseFloat(amount).toFixed(2);
    var balanceCents = ((balance - Math.floor(balance)) * 100).toFixed(0);
    balanceCents = (balanceCents < 10)? (balanceCents == 0)? "00" : "0" + balanceCents : balanceCents;
    return balanceCents;
};
