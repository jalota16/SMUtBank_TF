var accState = {};

accState.transTypeList = null;

accState.init = function() {
    var chainList = [accState.buildAccStatement];
    accState.getTransTypeList(chainList);
};

String.prototype.replaceAll = function(search, replace) {
    //if replace is null, return original string otherwise it will
    //replace search string with 'undefined'.
    if(!replace) 
        return this;

    return this.replace(new RegExp('[' + search + ']', 'g'), replace);
};

accState.getQueryParams = function getQueryParams(qs) {
    qs = qs.split("+").join(" ");

    var params = {}, tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }

    return params;
};

accState.getTransTypeCode = function(transTypeID) {
    var length = accState.transTypeList["ns:TransactionType.length"];
    for(var i = 1; i <= length; i++) {
        if(accState.transTypeList["ns:TransactionType" + i + ".ns:TransactionTypeID"] == transTypeID) {
            return accState.transTypeList["ns:TransactionType" + i + ".ns:TransactionCode"];
        }
    }
    return "UNK";
};

accState.getTransTypeName = function(trasnTypeID) {
    for(var i = 1; i <= accState.transTypeList["ns:TransactionType.length"]; i++) {
        if(accState.transTypeList["ns:TransactionType" + i + ".ns:TransactionTypeID"] == trasnTypeID) {
            return accState.transTypeList["ns:TransactionType" + i + ".ns:TransactionTypeName"];
        }
    }
    return "Unknow type";
};

accState.getTransTypeList = function(chainList) {
    var query = accState.getQueryParams(document.location.search);
    var sessionID = query.sessionID;
    
    var tagRoot = "TransactionTypeList";
    var tagList = '["ns:TransactionType"]';
    var payload = {
            "ServiceDomain":"MDM",
            "OperationName":"MDM_TransactionTypeList_Read",
    };
    
    var populater = function(response, extras) {
        accState.transTypeList = response;
        for(var i = 1; i <= accState.transTypeList["ns:TransactionType.length"]; i++) {
            var string = accState.transTypeList["ns:TransactionType" + i + ".ns:TransactionTypeName"];
            string = string.replaceAll("_", " ").toLowerCase();
            string = string.charAt(0).toUpperCase() + string.slice(1);
            accState.transTypeList["ns:TransactionType" + i + ".ns:TransactionTypeName"] = string;
        }
        
        //Next chain
        if(chainList != null && chainList.length > 0) {
            var chainFunction = chainList.shift();
            chainFunction(chainList);
        }
    };
    
    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true, sessionID);
};

accState.buildAccStatement = function() {
    var query = accState.getQueryParams(document.location.search);
    var accountID = query.account;
    var monthYear = query.monthYear;
    var sessionID = query.sessionID;
    var name = query.name;
    var isPartial = (query.partial == 'true');
    
    var date = moment(monthYear, 'MM-YYYY').startOf('month');
    var endDate = moment(monthYear, 'MM-YYYY').endOf('month');
    if(isPartial) {
        endDate.date(moment().date());
    }
    
    document.getElementById("accountID").innerHTML = accountID;
    document.getElementById("monthYear").innerHTML = date.format('MMM YYYY');
    document.getElementById("customerName").innerHTML = name;
    
    var populater = function(response, extras) {
        if(response.esbStatus == "invocation successful") {
            var transTypeValue = [];
            var findIndexOrPush = function(transactionTypeName) {
                for(var i = 0; i < transTypeValue.length; i++) {
                    if(transTypeValue[i][0] === transactionTypeName) {
                        return i;
                    }
                }
                transTypeValue.push([transactionTypeName, 0]);
                return transTypeValue.length - 1;
            };
            
            var dailyBalanceValue = [[],[]];
            for(var i = 1; i <= endDate.date(); i++) {
                dailyBalanceValue[0].push(i);
                dailyBalanceValue[1].push(0);
            }
            var updateDailyValue = function(dayOfMonth, value, isInitial) {
                //alert(dayOfMonth + ", " +  value + ", " + isInitial);
                for(var i = (isInitial)? 0 : dayOfMonth - 1; i < dailyBalanceValue[1].length; i++) {
                    //alert("before: " + dailyBalanceValue[1][i]);
                    dailyBalanceValue[1][i] = value;
                    //alert("after: " + dailyBalanceValue[1][i]);
                }
            };
            
            var counter = 1;
            for(var i = response["transaction_Detail.length"]; i  > 0; i--) {
                var debit = "-";
                var credit = "-";
                var balance = "-";
                var transDate = moment(response["transaction_Detail" + i + ".transactionDate"], 'YYYY-MM-DD HH:mm:SS');
                if(accountID == response["transaction_Detail" + i + ".accountFrom"]) {
                    debit = "$" + accState.getPrettyAmount(response["transaction_Detail" + i + ".transactionAmount"]);
                    balance = "$" + accState.getPrettyAmount(response["transaction_Detail" + i + ".interimBalance"]);
                    if(counter == 1) {
                        updateDailyValue(transDate.date(), parseFloat(response["transaction_Detail" + i + ".interimBalance"]), true);
                    } else {
                        updateDailyValue(transDate.date(), parseFloat(response["transaction_Detail" + i + ".interimBalance"]), false);
                    }
                } else {
                    credit = "$" + accState.getPrettyAmount(response["transaction_Detail" + i + ".transactionAmount"]);
                    balance = "$" + accState.getPrettyAmount(response["transaction_Detail" + i + ".accountTo_interimBalance"]);
                    if(counter == 1) {
                        updateDailyValue(transDate.date(), parseFloat(response["transaction_Detail" + i + ".accountTo_interimBalance"]), true);
                    } else {
                        updateDailyValue(transDate.date(), parseFloat(response["transaction_Detail" + i + ".accountTo_interimBalance"]), false);
                    }
                }
                
                var desc = "<i>No description entered</i>";
                if(response["transaction_Detail" + i + ".narrative"] != null && response["transaction_Detail" + i + ".narrative"] !== "" && response["transaction_Detail" + i + ".narrative"] !== "?") {
                    desc = response["transaction_Detail" + i + ".narrative"];
                }
                
                transTypeValue[findIndexOrPush(accState.getTransTypeName(response["transaction_Detail" + i + ".transactionType"]))][1] += parseFloat(response["transaction_Detail" + i + ".transactionAmount"]);
                
                accState.addTransHist(
                        counter++, 
                        transDate.format("DD [<b>]MMM[</b>] YYYY [<br/>] [<b>]ddd[</b>] h:mma"),
                        accState.getTransTypeCode(response["transaction_Detail" + i + ".transactionType"]),
                        desc,
                        debit,
                        credit,
                        balance
                );
                
                if(i == 1) {
                    accState.addFinalBalance(date.format('MMM YYYY'), balance);
                }
            }
            var currency = response["transaction_Detail1.currency"];
            $(".currency").html(currency);
            accState.buildTransTypeValueChart(transTypeValue, date.format('MMM YYYY'), currency);
            accState.buildDailyBalanceValueChart(dailyBalanceValue[0], dailyBalanceValue[1], date.format('MMM YYYY'), currency);
        }
    };
    
    var tagRoot = "CDMTransactionDetail";
    var tagList = '["transaction_Detail"]';
    var payload = {
            "ServiceDomain":"Transaction",
            "OperationName":"Transaction_History_Read",
            "AccountNumber":accountID,
            "StartDate":date.format('YYYY-MM-DD HH:mm:SS'),
            "EndDate":endDate.format('YYYY-MM-DD HH:mm:SS'),
            "NumRecords":9999,
            "NumPages":1
    };
    
    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true, sessionID);
};

accState.buildTransTypeValueChart = function(dataArray, date, currency) {
    $('#pieChart').highcharts({
        credits: {
            enabled: false
        },
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false
        },
        title: {
            text: 'Transaction Value Overview'
        },
        subtitle: {
            text: date,
            x: -20
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    color: '#000000',
                    connectorColor: '#000000',
                    format: '<b>{point.name}</b>: ' + currency + ' ${point.y:.2f}'
                }
            }
        },
        series: [{
            type: 'pie',
            name: 'Combined transaction value',
            data: dataArray
        }]
    });
};

accState.buildDailyBalanceValueChart = function(category, dataArray, date, currency) {
    $('#lineChart').highcharts({
        credits: {
            enabled: false
        },
        chart: {
            type: 'line'
        },
        title: {
            text: 'Daily Account Balance'
        },
        xAxis: {
            title: {
                text: date
            },
            categories: category
        },
        yAxis: {
            title: {
                text: 'End of Day Balance (' + currency + ')'
            }
        },
        plotOptions: {
            series: {
                enableMouseTracking: false
            }
        },
        legend: {
            enabled: false
        },
        series: [{
            data: dataArray
        }]
    });
};

accState.addTransHist = function(count, date, transType, desc, debit, credit, balance) {
    if((count - 9) % 23 === 0) {
        accState.addTableHeader();
    }
    var builder = 
        '<div class="tableBodyRow">' +
        '    <div class="tableBodyCellOuter" style="width:5%;"><div class="tableBodyCellInner">' + count + '</div></div>' + 
        '    <div class="tableBodyCellOuter" style="width:13%;"><div class="tableBodyCellInner">' + date + '</div></div>' + 
        '    <div class="tableBodyCellOuter" style="width:8%; font-weight: bold; color:#1A2155"><div class="tableBodyCellInner">' + transType + '</div></div>' + 
        '    <div class="tableBodyCellOuter" style="width:32%;"><div class="tableBodyCellInner">' + desc + '</div></div>' + 
        '    <div class="tableBodyCellOuter" style="width:14%; color:crimson; text-align:right; font-weight:bold"><div class="tableBodyCellInner">' + debit + '</div></div>' + 
        '    <div class="tableBodyCellOuter" style="width:14%; color:green; text-align:right; font-weight:bold"><div class="tableBodyCellInner">' + credit + '</div></div>' + 
        '    <div class="tableBodyCellOuter" style="width:14%; color:#CDA500; text-align:right; font-weight:bold"><div class="tableBodyCellInner">' + balance + '</div></div>' + 
        '</div>';
    document.getElementById("transHist").innerHTML += builder;
};

accState.addTableHeader = function() {
    var builder = 
        '<div class="tableHeaderRow pageBreak" style=" padding-right: 8px; ">' + 
        '    <div class="tableHeaderCell" style="width:5%;">No.</div>' + 
        '    <div class="tableHeaderCell" style="width:13%;">Date</div>' + 
        '    <div class="tableHeaderCell" style="width:8%;">Type</div>' + 
        '    <div class="tableHeaderCell" style="width:32%;">Description</div>' + 
        '    <div class="tableHeaderCell" style="width:14%; text-align:right">Debit (<span class="currency"></span>)</div>' + 
        '    <div class="tableHeaderCell" style="width:14%; text-align:right">Credit (<span class="currency"></span>)</div>' + 
        '    <div class="tableHeaderCell" style="width:14%; text-align:right">Balance (<span class="currency"></span>)</div>' + 
        '</div>';
    document.getElementById("transHist").innerHTML += builder;
};

accState.addFinalBalance = function(date, finalBalance) {
    var builder = 
        '<div class="tableBodyRow" style="border-bottom: 0px">' + 
        '    <div class="tableBodyCellOuter" style="width:40%; float:right; text-align:right; border-bottom: 5px solid green; color:#1A2155"><div class="tableBodyCellInner" style="vertical-align:bottom"><b>Total balance for ' + date + ' : ' + finalBalance + '</b></div></div>' + 
        '</div>';
    document.getElementById("transHist").innerHTML += builder;
};

accState.getDollars = function(amount) {
    var balance = parseFloat(amount).toFixed(2);
    return (balance - accState.getCents(amount)/100);
};

accState.getPrettyAmount = function(amount, noCents) {
    var dollars = accState.getDollars(amount).toString();
    var cents = accState.getCents(amount);
    
    for(var i = dollars.length - 3; i > 0; i -= 3) {
        dollars = dollars.substring(0, i) + "," + dollars.substring(i, dollars.length);
    }
    if(noCents) {
        return dollars;
    } else {
        return dollars + "." + cents;
    }
};

accState.getCents = function(amount) {
    var balance = parseFloat(amount).toFixed(2);
    var balanceCents = ((balance - Math.floor(balance)) * 100).toFixed(0);
    balanceCents = (balanceCents < 10)? (balanceCents == 0)? "00" : "0" + balanceCents : balanceCents;
    return balanceCents;
};

var network = {};

network.lastVerificationID = "";

network.doESB = function(callback, tagRoot, tagList, payload, extras, isAsync, sessionID, verificationID) {
    if(verificationID != null) {
        network.lastVerificationID = verificationID;
        setTimeout(function() {network.lastVerificationID = "";}, 10000);
    }
    
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var response;
            try {
                response = JSON.parse(xmlhttp.responseText);
            } catch(e) {
                alert("Error parsing response from IBS");
                window.location.replace("login.action");
                return;
            }
            if(response.status === "ok") {
                if(response.esbStatus === "Unknown, field not found") {
                    alert("Service is currently unavaliable");
                } else if(response.esbStatus === "Service Verification: Missing verification parameters") {
                    //run 2fa verification
                    var transactionDetails = {
                            "callback" : callback,
                            "tagRoot" : tagRoot,
                            "tagList" : tagList,
                            "payload" : payload,
                            "extras" : extras,
                            "isAsync" : isAsync
                    };
                    verify.buildDiaglog(transactionDetails);
                } else if(response.esbStatus.indexOf("Service Verification") !== -1) {
                    response.status = "2FA verification failed, please try again or contact bank staff";
                    callback(response, extras);
                } else {
                    callback(response, extras);
                }
            } else {
                alert("IBS internal error: " + response.status);
            }
        }
    };

    xmlhttp.open("POST", "../SMUtBank_IBS/ajaxESBService.action", isAsync);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
    xmlhttp.send('jsonRequest=' + encodeURIComponent(payload) + '&tagRoot=' + tagRoot + '&tagList=' + tagList + '&verificationID=' + network.lastVerificationID + '&channel=RMB&sessionID=' + sessionID);
};
