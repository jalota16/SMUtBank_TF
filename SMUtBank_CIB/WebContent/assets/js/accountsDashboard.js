var accDash = {};

accDash.numMonthLookback = 6;
accDash.transTypeList = null;
accDash.productList = null;

accDash.accountsData = null;
accDash.account = null;
accDash.monthCategories = null;

accDash.accountOverviewData = null;

accDash.monthlyTransactionChart = null;
accDash.accountOverviewChart = null;

//Detect if the browser is IE or not.
//If it is not IE, we assume that the browser is NS.
var IE = document.all?true:false;

//If NS -- that is, !IE -- then set up for mouse capture
if (!IE) document.captureEvents(Event.MOUSEMOVE);

//Set-up to use getMouseXY function onMouseMove
document.onmousemove = getMouseXY;

//Temporary variables to hold mouse x-y pos.s
var tempX = 0;
var tempY = 0;

//Main function to retrieve mouse x-y pos.s
function getMouseXY(e) {
      if (IE) { // grab the x-y pos.s if browser is IE
        tempX = event.clientX + document.body.scrollLeft;
        tempY = event.clientY + document.body.scrollTop;
      } else {  // grab the x-y pos.s if browser is NS
        tempX = e.pageX;
        tempY = e.pageY;
      }  
      // catch possible negative values in NS4
      if (tempX < 0){tempX = 0;}
      if (tempY < 0){tempY = 0;} 
      // show the position values in the form named Show
      // in the text fields named MouseX and MouseY
//    document.Show.MouseX.value = tempX;
//    document.Show.MouseY.value = tempY;
      return true;
}

String.prototype.replaceAll = function(search, replace) {
    //if replace is null, return original string otherwise it will
    //replace search string with 'undefined'.
    if(!replace) 
        return this;

    return this.replace(new RegExp('[' + search + ']', 'g'), replace);
};

accDash.init = function() {
    accDash.stencils = {
        homeMain: stencil.define("homeMain", "#main")
    };
};

accDash.buildPage = function() {
    ui.loader.create(4, function() {
        accDash.stencils.homeMain.render({});
        accDash.buildMonthlyTransactionChart();
        accDash.buildAccountOverviewChart();
    }, "Building Dashboard");
    var chainList = [accDash.getProductList, accDash.buildDashboard];
    accDash.getTransTypeList(chainList);
    accDash.chartReadyCount = 0;
};

accDash.buildDashboard = function() {
    accDash.buildMonthlyTransactionDashboard();
    accDash.buildAccountOverviewDashboard();
};

accDash.showCharts = function() {
    accDash.chartReadyCount++;

    if(accDash.chartReadyCount === 2) {

    }
};

accDash.getTransTypeList = function(chainList) {
    var tagRoot = "TransactionTypeList";
    var tagList = '["ns:TransactionTypeID","ns:TransactionTypeName"]';
    var payload = {
            "ServiceDomain":"MDM",
            "OperationName":"MDM_TransactionTypeList_Read",
    };
    
    var populater = function(response, extras) {
        accDash.transTypeList = response;
        for(var i = 1; i <= accDash.transTypeList["ns:TransactionTypeName.length"]; i++) {
            var string = accDash.transTypeList["ns:TransactionTypeName" + i];
            string = string.replaceAll("_", " ").toLowerCase();
            string = string.charAt(0).toUpperCase() + string.slice(1);
            accDash.transTypeList["ns:TransactionTypeName" + i] = string;
        }

        ui.loader.update("Retrieved transactions");
        
        //Next chain
        if(chainList != null && chainList.length > 0) {
            var chainFunction = chainList.shift();
            chainFunction(chainList);
        }
    };
    
    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
};

accDash.getTransTypeName = function(trasnTypeID) {
    for(var i = 1; i <= accDash.transTypeList["ns:TransactionTypeName.length"]; i++) {
        if(accDash.transTypeList["ns:TransactionTypeID" + i] == trasnTypeID) {
            return accDash.transTypeList["ns:TransactionTypeName" + i];
        }
    }
    return "Unknow type";
};

accDash.getProductName = function(productCode) {
    var length = accDash.productList["ns:Product.length"];
    for(var i = 1; i <= length; i++) {
        if(accDash.productList["ns:Product" + i + ".ns:ProductID"] == productCode) {
            return accDash.productList["ns:Product" + i + ".ns:ProductName"];
        }
    }
    return "Unknown Product Type";
};

accDash.getProductList = function(chainList) {
    var tagRoot = "ProductList";
    var tagList = '["ns:Product"]';
    var payload = '{"ServiceDomain":"MDM","OperationName":"MDM_ProductList_Read"}';
    
    var populater = function(response, extra) {
        accDash.productList = response;

        ui.loader.update("Retrieved products");
        //Next chain
        if(chainList != null && chainList.length > 0) {
            var chainFunction = chainList.shift();
            chainFunction(chainList);
        }
    };
    
    network.doESB(populater, tagRoot, tagList, payload, true);
};

accDash.getAccountID = function (accountIndex) {
    return accDash.accountsData[accountIndex].id;
};

accDash.buildMonthCategories = function() {
    accDash.monthCategories = [];
    
    for(var i = accDash.numMonthLookback - 1; i >= 0; i--) {
        var now = moment();
        accDash.monthCategories.push(now.subtract(i, 'months').startOf('month').format('MMM YYYY'));
    }
};

accDash.buildMonthlyTransactionDashboard = function() {
    accDash.accountsData = [];
    accDash.buildMonthCategories();
    
    var tagRoot = "AccountList";
    var tagList = '["accountID","currency","currentStatus","productID"]';
    var payload = {
            "ServiceDomain":"Party",
            "OperationName":"Party_CustomerAccountList_Read",
    };
    
    var populater = function(response, extras) {
        var counter = 0;
        for(var i = 1; i <= response["accountID.length"]; i++) {
            if(response["productID" + i] == "101" && response["currentStatus" + i] == "Open") {
                accDash.accountsData[counter] = {};
                accDash.accountsData[counter].name = "A/C: " + response["accountID" + i];
                accDash.accountsData[counter].tooltip ={
                    'valueSuffix' : " " + response["currency" + i]
                };
                accDash.accountsData[counter].type = "line";
                accDash.accountsData[counter].id = response["accountID" + i];
                counter++;
            }
        }
        if(accDash.accountsData.length > 0) {
            accDash.buildAccountData(0);
        }
    };
    
    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
};

accDash.buildAccountData = function(accountIndex) {
    accDash.buildMonthlyTransactionData(accountIndex, 0);
};

accDash.setAccountData = function(accountIndex) {
    accDash.accountsData[accountIndex].data = accDash.account;
    if(++accountIndex < accDash.accountsData.length) {
        accDash.buildAccountData(accountIndex);
    } else {
        //go build the chart
        ui.loader.update("Built transactions data");
        accDash.showCharts();
    }
};

accDash.buildMonthlyTransactionData = function(accountIndex, monthIndex) {
    if(monthIndex === 0) {
        accDash.account = [];
    }
    
    var populater = function(response, extras) {
        var data = {};
        if(response.status == 'ok' && response.esbStatus == 'invocation successful') {
            var collate = [[], []];
            var findIndexOrPush = function(transactionTypeName) {
                for(var i = 0; i < collate[0].length; i++) {
                    if(collate[0][i] === transactionTypeName) {
                        return i;
                    }
                }
                collate[0].push(transactionTypeName);
                collate[1][collate[0].length - 1] = 0;
                return collate[0].length - 1;
            };
            
            //build outer line data
            if(response.accountFrom1 == accDash.getAccountID(accountIndex)) {
                data.y = parseFloat(response.interimBalance1);
            } else {
                data.y = parseFloat(response.accountTo_interimBalance1);
            }
            data.drilldown = {
                'name' : 'Combined Transaction Value', 
                'data' : [], 
                'month' : accDash.monthCategories[monthIndex],
                'accountID' : accDash.getAccountID(accountIndex),
                'tooltip' : {
                    'valueSuffix' : " " + response.currency1
                }
            };
            
            //build inner pie data
            for(var i = 1; i <= response["transactionType.length"]; i++) {
                var inputIndex = findIndexOrPush(accDash.getTransTypeName(response["transactionType" + i]));
                if(response.accountFrom1 == accDash.getAccountID(accountIndex)) {
                    collate[1][inputIndex] += parseFloat(response["transactionAmount" + i]);
                } else {
                    collate[1][inputIndex] += parseFloat(response["transactionAmount" + i]) * parseFloat(response["exchangeRate" + i]);
                }
            }
            
            for(var i = 0; i < collate[0].length; i++) {
                data.drilldown.data.push([collate[0][i], parseFloat(collate[1][i].toFixed(2))]);
            }
        } else {
            //No transaction data
            var y = (monthIndex == 0)? 0 : accDash.account[accDash.account.length - 1].y;
            data = {
                    'y' : y,
                    'drilldown' : {
                        'name' : 'No transaction history', 
                        'data' : [['No transaction history', 1]],
                        'month' : accDash.monthCategories[monthIndex],
                        'accountID' : accDash.getAccountID(accountIndex),
                        'tooltip' : {
                            'valuePrefix' : ""
                        }
                    }
            };
        }
        //set account
        accDash.account.push(data);
        if(++monthIndex < accDash.monthCategories.length) {
            accDash.buildMonthlyTransactionData(accountIndex, monthIndex);
        } else {
            accDash.setAccountData(accountIndex);
        }
    };
    
    var tagRoot = "CDMTransactionDetail";
    var tagList = '["accountFrom","accountTo","transactionAmount","exchangeRate","transactionType","interimBalance","accountTo_interimBalance","currency"]';
    var payload = {
            "ServiceDomain":"Transaction",
            "OperationName":"Transaction_History_Read",
            "AccountNumber": accDash.getAccountID(accountIndex),
            "StartDate": moment(accDash.monthCategories[monthIndex], 'MMM YYYY').startOf('month').format('YYYY-MM-DD HH:mm:SS'),
            "EndDate": moment(accDash.monthCategories[monthIndex], 'MMM YYYY').endOf('month').format('YYYY-MM-DD HH:mm:SS'),
            "NumRecords":"99999",
            "NumPages":"1"
    };
    
    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
};

accDash.buildMonthlyTransactionChart = function() {
    accDash.monthlyTransactionChart = new Highcharts.Chart({
        chart: {
            renderTo: 'monthlyBalanceChart'
        },
        title: {
            text: 'Monthly Account Balance',
            x: -20 //center
        },
        subtitle: {
            text: 'over the past ' + accDash.numMonthLookback + ' months',
            x: -20
        },
        credits: {
            enabled: false
        },
        xAxis: {
            title: {
                text: ''
            },
            categories: accDash.monthCategories
        },
        yAxis: {
            title: {
                text: 'End of Month Balance ($)'
            }
        },
        tooltip: {
            positioner: function () {
//                return { x: 80, y: 50 };
//                return { x: tempX-300, y: tempY-325 };
                return { x: tempX-300, y: tempY-375 };
            },
            valuePrefix: '$'
        },
        plotOptions: {
            series: {
                cursor: 'pointer',
                point: {
                    events: {
                        click: function() {
                            var drilldown = this.drilldown;
                            var options;
                            var isReturn;
                            if (drilldown) { // drill down
                                options = {
                                    'name': drilldown.name,
                                    'data': drilldown.data,
                                    'tooltip': drilldown.tooltip,
                                    'month' : drilldown.month,
                                    'accountID' : drilldown.accountID
                                };
                                isReturn = false;
                            } else { // restore
                                options = {};
                                isReturn = true;
                            }
                            setChart(options, isReturn);
                        }
                    }
                },
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            borderWidth: 0,
        },
        series: accDash.accountsData,
    });
};

function setChart(options, isReturn) {
    for(var i = accDash.monthlyTransactionChart.series.length - 1; i >= 0; i--) {
        accDash.monthlyTransactionChart.series[0].remove(false);
    }
    
    if(isReturn) {
        accDash.monthlyTransactionChart.setTitle({'text' : 'Monthly Account Balance'}, {'text' : 'over the past ' + accDash.numMonthLookback + ' months'});
        accDash.monthlyTransactionChart.addAxis({'categories' : accDash.monthCategories},true, false);
        accDash.monthlyTransactionChart.addAxis({'title' : {'text' : 'End of Month Balance ($)'}},false, false);
        for(var i = 0; i < accDash.accountsData.length; i++) {
            accDash.monthlyTransactionChart.addSeries(
                    accDash.accountsData[i]
            ); 
        }
    } else {
        accDash.monthlyTransactionChart.setTitle({'text' : 'Transaction Value Overview'}, {'text' : 'For A/C: ' + options.accountID + " | " + options.month});
        accDash.monthlyTransactionChart.xAxis[0].remove();
        accDash.monthlyTransactionChart.yAxis[0].remove();
        accDash.monthlyTransactionChart.addSeries({
            'type' : 'pie',
            'name' : options.name,
            'data' : options.data,
            'tooltip' : options.tooltip
        }, false);
    }
    accDash.monthlyTransactionChart.redraw();
}

accDash.buildAccountOverviewDashboard = function() {
    accDash.accountOverviewData = {
            'depositAccounts' : [],
            'totalDeposits' : 0,
            'totalLoans' : 0,
            'totalCollateral' : 0
    };
    var tagRoot = "AccountList";
    var tagList = '["accountID","currency","currentStatus","productID","balance"]';
    var payload = {
            "ServiceDomain":"Party",
            "OperationName":"Party_CustomerAccountList_Read",
    };
    
    var populater = function(response, extras) {
        var remainingAccountUpdates = 0;
        var remainingLoanUpdates = 0;
        //Need to add in exchange rate conversion here for accounts that are not in SGD
        var updateAccounts = function(productID, accountID, balance, exchangeRate) {
            accDash.accountOverviewData.totalDeposits += parseFloat((parseFloat(balance)  * exchangeRate).toFixed(2));
            var accountDetails = [accDash.getProductName(productID) + " " + accountID, parseFloat((parseFloat(balance) * exchangeRate).toFixed(2))];
            accDash.accountOverviewData.depositAccounts.push(accountDetails);
            remainingAccountUpdates--;
        };
        var populater2 = function(response, extras) {
            updateAccounts(extras.productID, extras.accountID, extras.balance, parseFloat(response.SpotRate1));
        };
        var populater3 = function(response, extras) {
            accDash.accountOverviewData.totalCollateral += parseFloat(response.assetValue1);
            remainingLoanUpdates--;
        };
        for(var i = 1; i <= response["accountID.length"]; i++) {
            if(response["productID" + i] >= "100" && response["productID" + i] < "200" && response["currentStatus" + i] == "Open") {
                remainingAccountUpdates++;
                if(response["currency" + i] != "SGD") {
                    var tagRoot = "MarketData_SpotRate_ReadResponse";
                    var tagList = '["SpotRate"]';
                    var payload = {
                        "ServiceDomain":"MarketData",
                        "OperationName":"MarketData_SpotRate_Read",
                        "BaseCurrency": response["currency" + i],
                        "QuoteCurrency": "SGD"
                    };
                    network.doESB(populater2, tagRoot, tagList, JSON.stringify(payload), {
                        'productID' : response["productID" + i],
                        'accountID' : response["accountID" + i],
                        'balance' : response["balance" + i],
                    }, true);
                } else {
                    updateAccounts(response["productID" + i], response["accountID" + i], response["balance" + i], 1);
                }
            } else if(response["productID" + i] >= "200" && response["productID" + i] < "300" && response["currentStatus" + i] == "Open") {
                remainingLoanUpdates++;
                accDash.accountOverviewData.totalLoans += parseFloat(response["balance" + i]);

                var tagRoot = "LendingAccount";
                var tagList = '["assetValue"]';
                var payload = {
                        "ServiceDomain":"Account",
                        "OperationName":"Account_Loan_Read",
                        "accountID": response["accountID" + i]
                };
                network.doESB(populater3, tagRoot, tagList, JSON.stringify(payload), null, true);
            }
        }
        
        var drawChart = function tryDrawing () {
            if(remainingLoanUpdates != 0 && remainingAccountUpdates != 0) {
                setTimeout(tryDrawing, 1000);
            } else {
                ui.loader.update("Built accounts overview data");
                accDash.showCharts();
            }
        };
        drawChart();
    };
    
    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
};

accDash.AOChartSerialData = null;
accDash.buildAccountOverviewChart = function() {

    accDash.AOChartSerialData = [{
        name: 'Overview',
        colorByPoint: true,
        data: [{
            name: 'Deposits',
            y: accDash.accountOverviewData.totalDeposits,
            color: '#9FF781',
            drilldown: {
                name: 'Deposit',
                data: accDash.accountOverviewData.depositAccounts
            }
        }, {
            name: 'Loans',
            y: accDash.accountOverviewData.totalLoans,
            color: '#F78181',
            drilldown: {
                name: 'Loan',
                data: [
                    ['Total Liabilites', accDash.accountOverviewData.totalLoans],
                    ['Collateral Assets', accDash.accountOverviewData.totalCollateral],
                    ['Liquid Assets', accDash.accountOverviewData.totalDeposits]
                ]
            }
        }]
    }];
    
    accDash.accountOverviewChart = new Highcharts.Chart({
        chart: {
            renderTo : 'accountsOverviewChart',
            type: 'pie'
        },
        credits: {
            enabled: false
        },
        
        title: {
            text: 'Overview of Deposit and Loan Accounts'
        },
        subtitle: {
            text: 'All amounts have been normalized to SGD'
        },
        xAxis: {
            categories: true
        },
        
        legend: {
            enabled: false
        },
        
        plotOptions: {
            series: {
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: <br>{point.percentage:.1f} %',
                    style: {
                        width: '100px'
                    }
                },
                shadow: false,
                cursor: 'pointer',
                point: {
                    events: {
                        click: function() {
                            var drilldown = this.drilldown;
                            var options;
                            var isReturn;
                            if (drilldown) { // drill down
                                options = {
                                    'name': drilldown.name,
                                    'data': drilldown.data,
                                };
                                isReturn = false;
                            } else { // restore
                                options = {};
                                isReturn = true;
                            }
                            setAccountOverviewChart(options, isReturn);
                        }
                    }
                },
            },
            pie: {
                size: '45%'
            }
        },
            tooltip: {
                valuePrefix: '$',
                valueSuffix: ' SGD'
        },
        
        series: accDash.AOChartSerialData
        
    });
};

function setAccountOverviewChart(options, isReturn) {
    for(var i = accDash.accountOverviewChart.series.length - 1; i >= 0; i--) {
        accDash.accountOverviewChart.series[0].remove(false);
    }
    
    if(isReturn) {
        for(var i = 0; i < accDash.AOChartSerialData.length; i++) {
            accDash.accountOverviewChart.addSeries(accDash.AOChartSerialData[i], false); 
        }
    } else {
        accDash.accountOverviewChart.addSeries({
            'type' : 'pie',
            'name' : options.name,
            'data' : options.data,
        }, false);
    }
    accDash.accountOverviewChart.redraw();
}
