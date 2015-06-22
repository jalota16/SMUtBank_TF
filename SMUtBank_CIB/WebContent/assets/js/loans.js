var loans = {};
var rmScheduler = {};

loans.productList = null;
loans.accountList = null;

loans.transactionAmount = null;
loans.lastValidNewLoan = null;

loans.init = function() {
    loans.stencils = {
        loansMain: stencil.define("loansMain", "#main"),
        loansMenu: stencil.define("loansMenu", "#loansContainer"),
        newLoan: stencil.define("newLoan", "#loansContainer", ["newLoanType"]),
        newLoanInfo: stencil.define("newLoanInfo", "#loanInfo"),
        loansRepayment: stencil.define("loansRepayment", "#loansContainer", ["loanAccounts"]),
        loanRepaymentInfo: stencil.define("loanRepaymentInfo", "#repaymentPartialInfo"),
        newLoanDetails: stencil.define("newLoanDetails", "none", ["settlementAccount"]),
        appointmentScheduler: stencil.define("appointmentScheduler", "#loansContainer"),
        schedulerLightbox: stencil.define("schedulerLightbox", "none")
    };
};

loans.buildPage = function() {
    loans.getProductList();
    loans.getAccountList();
    if(document.location.search !== "") {
        var query = loans.getQueryParams(document.location.search);
        if(query.account !== "") {
            loans.buildLoanRepayment();
            loans.setAccountListToAccount(query.account);
            return;
        }
    }
    loans.stencils.loansMain.render({});
    loans.buildMainMenu();
};

loans.getQueryParams = function getQueryParams(qs) {
    qs = qs.split("+").join(" ");

    var params = {}, tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])]= decodeURIComponent(tokens[2]);
    }

    return params;
};

loans.getProductName = function(productCode) {
    var length = loans.productList["ns:Product.length"];
    for(var i = 1; i <= length; i++) {
        if(loans.productList["ns:Product" + i + ".ns:ProductID"] == productCode) {
            return loans.productList["ns:Product" + i + ".ns:ProductName"];
        }
    }
    return "Unknown Product Type";
};

loans.getProductList = function() {
    var tagRoot = "ProductList";
    var tagList = '["ns:Product"]';
    var payload = '{"ServiceDomain":"MDM","OperationName":"MDM_ProductList_Read"}';
    
    var setProductList = function(list) {
        loans.productList = list;
    };
    network.doESB(setProductList, tagRoot, tagList, payload, true);
};

loans.getAccountList = function() {
    var tagRoot = "AccountList";
    var tagList = '["accountID","productID","currency","balance","currentStatus"]';
    var payload ='{"ServiceDomain":"Party","OperationName":"Party_CustomerAccountList_Read"}';
    
    var populater = function(list) {
        loans.accountList = list;
    };
    network.doESB(populater, tagRoot, tagList, payload, true);
};

loans.buildMainMenu = function() {
    loans.stencils.loansMenu.render({});
    $("#main").fadeIn();
};

loans.buildNewLoan = function() {
    var newLoanType = [];
    var newLoanDataset = {
        newLoanType: newLoanType
    };
    for(var i = 1; i <= loans.productList["ns:Product.length"]; i++) {
        if(loans.productList["ns:Product" + i + ".ns:ProductID"] >= 200 && loans.productList["ns:Product" + i + ".ns:ProductID"] < 300) {
            newLoanType.push({
                productID: loans.productList["ns:Product" + i + ".ns:ProductID"],
                productName: loans.productList["ns:Product" + i + ".ns:ProductName"]
            });
        }
    }
    loans.stencils.newLoan.render(newLoanDataset);
    document.getElementById("loansContainer").style.textAlign = "center";
};

loans.calculateLoanInstallment = function() {
    if(document.getElementById("loanAmt").value === "" || document.getElementById("loanTerm").value === "") {
        alert("Please enter a principle and/or loan term");
        return;
    }
    
    var populater = function(response, extras) {
        if(response.status == "ok" && response.esbStatus == "invocation successful") {
            var loanInfoDataset = {
                monthlyRepayment: loans.getDollars(response["ns:MonthlyInstallment1"]) + ".<span style='font-size:large'>" + loans.getCents(response["ns:MonthlyInstallment1"]) + "</span>",
                interestRate: (parseFloat(response["ns:InterestRate1"])*100).toFixed(2) + "% p.a.",
                maturityDate: moment(response["ns:MaturityDate1"], 'YYYY-MM-DD').format('DD MMM YYYY')
            };
            loans.stencils.newLoanInfo.render(loanInfoDataset);
            
            loans.lastValidNewLoan = {
                "productID" : document.getElementById("newLoanType")[document.getElementById("newLoanType").selectedIndex].value,
                "principle" : document.getElementById("loanAmt").value,
                "numOfMonths" : document.getElementById("loanTerm").value,
                "monthlyInstallment" : response["ns:MonthlyInstallment1"],
                "maturityDate" : response["ns:MaturityDate1"],
                "interestRate" : response["ns:InterestRate1"],
                "interest" : response["ns:Interest1"]
            };
            
            $("#loanInfo").slideDown();
            loans.buildNewLoanChart(
                document.getElementById("newLoanType")[document.getElementById("newLoanType").selectedIndex].value,
                document.getElementById("loanAmt").value,
                document.getElementById("loanTerm").value,
                response["ns:MonthlyInstallment1"]
            );
        }
    };
    
    var tagRoot = "InstallmentResponse";
    var tagList = '["ns:MonthlyInstallment","ns:MaturityDate","ns:InterestRate"]';
    var payload = {
            "ServiceDomain":"Product",
            "OperationName":"Product_LoanInstallment_Calculate",
            "ProductID":document.getElementById("newLoanType")[document.getElementById("newLoanType").selectedIndex].value,
            "Principle":document.getElementById("loanAmt").value,
            "NumberOfMonths":document.getElementById("loanTerm").value,
            "AccountOpenDate":moment().format('YYYY-MM-DD'),
    };
    
    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
};

loans.buildNewLoanChart = function(loanType, loanAmt, loanTerm, monthlyRepayment) {
    var principleToTotal = ((parseFloat(loanAmt) / (monthlyRepayment * loanTerm)) * 100);
    
    Highcharts.setOptions({
        colors: ['#24CBE5', '#64E572']
    });

    $('#container').highcharts({
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false
        },
        title: {
            text: 'For a ' + loans.getProductName(loanType) + ' of SGD $' + loanAmt + ' for ' + loanTerm + ' months'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                size: '80%',
                dataLabels: {
                    enabled: true,
                    color: '#000000',
                    connectorColor: '#000000',
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                }
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            type: 'pie',
            name: 'Percentage',
            data: [
                ['Interest amount',   100 - principleToTotal],
                ['Principle amount',   principleToTotal]
            ]
        }]
    });
};

loans.buildLoanRepayment = function(usingAccount) {
    var loanAccounts = [];
    var loanRepaymentDataset = {
        loanAccounts: loanAccounts,
        usingAccount: usingAccount
    };
    for(var i = 1; i <= loans.accountList["accountID.length"]; i++) {
        if(loans.accountList["productID" + i] >= 200 && loans.accountList["productID" + i] < 300 && loans.accountList["currentStatus" + i] == 'Open') {
            loanAccounts.push({
                accountNumber: loans.accountList["accountID" + i],
                accountName: loans.getProductName(loans.accountList["productID" + i]) + " " + loans.accountList["accountID" + i]
            });
        }
    }
    document.getElementById("loansContainer").style.textAlign = "left";
    loans.stencils.loansRepayment.render(loanRepaymentDataset);
};

loans.showRepayment = function() {
    if($(".partialRepaymentOnly").is(':hidden')) {
        $(".partialRepaymentOnly").show();
    } else {
        $(".partialRepaymentOnly").hide();
    }
};

loans.calculateLoanRepayment = function() {
    if(document.getElementById("repaymentType").checked) {
        if(document.getElementById("repaymentAmount").value === "") {
            alert("Repayment amount cannot be blank");
            return;
        } else if(document.getElementById("loanAccounts")[document.getElementById("loanAccounts").selectedIndex].value == null) {
            alert("You have no valid loan accounts");
            return;
        }
        var populater = function(response, extras) {
            if(response.status == "ok" && response.esbStatus == "invocation successful") {
                var loanRepaymentInfoDataset = {
                    paymentBalance: loans.getPrettyAmount(loans.getDollars(response["PartialRepaymentResponse1.ns:BalanceAfterRepayment"]),true) + ".<span style='font-size:large'>" + loans.getCents(response["PartialRepaymentResponse1.ns:BalanceAfterRepayment"]) + "</span>",
                    interestAmount: loans.getPrettyAmount(loans.getDollars(response["PartialRepaymentResponse1.ns:NewInterest"]),true) + ".<span style='font-size:large'>" + loans.getCents(response["PartialRepaymentResponse1.ns:NewInterest"]) + "</span>",
                    monthlyInstallment: loans.getPrettyAmount(loans.getDollars(response["PartialRepaymentResponse1.ns:NewMonthlyInstallment"]),true) + ".<span style='font-size:large'>" + loans.getCents(response["PartialRepaymentResponse1.ns:NewMonthlyInstallment"]) + "</span>",
                    accountBalance: loans.getPrettyAmount(loans.getDollars(response["PartialRepaymentResponse1.ns:SettlementAccountBalance"]),true) + ".<span style='font-size:large'>" + loans.getCents(response["PartialRepaymentResponse1.ns:SettlementAccountBalance"]) + "</span>",
                    penaltyAmount: (response["PartialRepaymentResponse1.ns:PenaltyAmount"] == 0)? "No penalty" : '<span style="font-size:large">SGD</span> $<span>' + loans.getPrettyAmount(loans.getDollars(response["PartialRepaymentResponse1.ns:PenaltyAmount"]),true) + ".<span style='font-size:large'>" + loans.getCents(response["PartialRepaymentResponse1.ns:PenaltyAmount"]) + "</span></span>",
                    penaltyRate: (response["PartialRepaymentResponse1.ns:PenaltyAmount"] == 0)? "N.A." : (parseFloat(response["PartialRepaymentResponse1.ns:PenaltyRate"])*100).toFixed(2) + "%",
                    maturityDate: moment(response["PartialRepaymentResponse1.ns:NewMaturityDate"], 'YYYY-MM-DD').format('DD MMM YYYY'),
                    accountNumber: response["PartialRepaymentResponse1.ns:SettlementAccountID"]
                };
                loans.transactionAmount = response["PartialRepaymentResponse1.ns:RepaymentAmountAfterPenalty"];
                if(response["PartialRepaymentResponse1.ns:Status"] == 'OK') {
                    loanRepaymentInfoDataset.repaymentStatus = "Your repayment has been approved";
                    loanRepaymentInfoDataset.statusColour = "green";
                    loanRepaymentInfoDataset.repaymentStatusSub = "*Click the button below to make a repayment immediately";
                    loanRepaymentInfoDataset.repaymentButtonDisplay = "inline";
                } else {
                    loanRepaymentInfoDataset.repaymentStatus = response["PartialRepaymentResponse1.ns:Status"];
                    loanRepaymentInfoDataset.statusColour = "crimson";
                    loanRepaymentInfoDataset.repaymentStatusSub = "*You will not be able to make a repayment until errors have been resolved";
                    loanRepaymentInfoDataset.repaymentButtonDisplay = "none";
                }
                loans.stencils.loanRepaymentInfo.render(loanRepaymentInfoDataset);
                
                var populater2 = function(response, extras) {
                    loans.buildPartialRepaymentCharts(
                            extras.bbr,
                            extras.bar,
                            parseFloat(response["ns:NewInterest1"]),
                            extras.newInterest,
                            extras.omi,
                            extras.nmi,
                            isKMD
                    );
                    
                    document.getElementById("frame1").style.display = "block";
                    document.getElementById("frame2").style.display = "block";
                    document.getElementById("frame3").style.display = "block";
                    document.getElementById("frame4").style.display = "none";
                    document.getElementById("frame5").style.display = "block";
                    
                    document.getElementById("repaymentButton").onclick = function() {loans.doPartialRepayment();};
                    
                    $("#repaymentPartialInfo").slideDown(600);
                };
                
                var isKMD = document.getElementById("keepMaturityDate").checked;
                var omi = (isKMD)? parseFloat(response["PartialRepaymentResponse1.ns:OldMonthlyInstallment"]) : parseFloat(response["PartialRepaymentResponse1.ns:OldLoanTerm"]);
                var nmi = (isKMD)? parseFloat(response["PartialRepaymentResponse1.ns:NewMonthlyInstallment"]) : parseFloat(response["PartialRepaymentResponse1.ns:NewLoanTerm"]);
                
                var tagRoot = "Product_LoanPartialRepayment_CalculateResponse";
                var tagList = '["ns:NewInterest"]';
                var payload = {
                        "ServiceDomain":"Product",
                        "OperationName":"Product_LoanPartialRepayment_Calculate",
                        "loan:AccountID":document.getElementById("loanAccounts")[document.getElementById("loanAccounts").selectedIndex].value,
                        "loan:RepaymentAmount":0,
                        "loan:KeepMaturityDate":document.getElementById("keepMaturityDate").checked,
                };
                
                //Do a before and after comparision
                network.doESB(populater2, tagRoot, tagList, JSON.stringify(payload), {
                    "bbr":parseFloat(response["PartialRepaymentResponse1.ns:BalanceBeforeRepayment"]),
                    "bar":parseFloat(response["PartialRepaymentResponse1.ns:BalanceAfterRepayment"]),
                    "newInterest":parseFloat(response["PartialRepaymentResponse1.ns:NewInterest"]),
                    "omi" : omi,
                    "nmi" : nmi
                }, true);
            }
        };
        
        var tagRoot = "Product_LoanPartialRepayment_CalculateResponse";
        var tagList = '["PartialRepaymentResponse"]';
        var payload = {
                "ServiceDomain":"Product",
                "OperationName":"Product_LoanPartialRepayment_Calculate",
                "loan:AccountID":document.getElementById("loanAccounts")[document.getElementById("loanAccounts").selectedIndex].value,
                "loan:RepaymentAmount":document.getElementById("repaymentAmount").value,
                "loan:KeepMaturityDate":document.getElementById("keepMaturityDate").checked,
        };
        
        network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
    } else {
        var populater = function(response, extras) {
            if(response.status == "ok" && response.esbStatus == "invocation successful") {
                var loanRepaymentInfoDataset = {
                    repaymentWithPenalty: loans.getPrettyAmount(loans.getDollars(response["FullRepaymentResponse1.ns:RepaymentAmountAfterPenalty"]),true) + ".<span style='font-size:large'>" + loans.getCents(response["FullRepaymentResponse1.ns:RepaymentAmountAfterPenalty"]) + "</span>",
                    penaltyAmount: '<span style="font-size:large">SGD</span> $<span>' + loans.getPrettyAmount(loans.getDollars(response["FullRepaymentResponse1.ns:PenaltyAmount"]),true) + ".<span style='font-size:large'>" + loans.getCents(response["FullRepaymentResponse1.ns:PenaltyAmount"]) + "</span></span>",
                    penaltyRate: (parseFloat(response["FullRepaymentResponse1.ns:PenaltyRate"])*100).toFixed(2) + "%",
                    accountBalance: loans.getPrettyAmount(loans.getDollars(response["FullRepaymentResponse1.ns:SettlementAccountBalance"]),true) + ".<span style='font-size:large'>" + loans.getCents(response["FullRepaymentResponse1.ns:SettlementAccountBalance"]) + "</span>",
                    accountNumber: response["FullRepaymentResponse1.ns:SettlementAccountID"]
                };
                loans.transactionAmount = response["FullRepaymentResponse1.ns:RepaymentAmountAfterPenalty"];
                
                if(response["FullRepaymentResponse1.ns:Status"] == 'OK') {
                    loanRepaymentInfoDataset.repaymentStatus = "Your repayment has been approved";
                    loanRepaymentInfoDataset.statusColour = "green";
                    loanRepaymentInfoDataset.repaymentStatusSub = "*Click the button below to make a repayment immediately";
                    loanRepaymentInfoDataset.repaymentButtonDisplay = "inline";
                } else {
                    loanRepaymentInfoDataset.repaymentStatus = response["FullRepaymentResponse1.ns:Status"];
                    loanRepaymentInfoDataset.statusColour = "crimson";
                    loanRepaymentInfoDataset.repaymentStatusSub = "*You will not be able to make a repayment until errors have been resolved";
                    loanRepaymentInfoDataset.repaymentButtonDisplay = "none";
                }
                
                
                var populater2 = function(response, extras) {
                    loanRepaymentInfoDataset.outstandingLoanPayments = loans.getPrettyAmount(loans.getDollars(response["ns:NewLoanAmount1"]),true) + ".<span style='font-size:large'>" + loans.getCents(response["ns:NewLoanAmount1"]) + "</span>";
                    loans.stencils.loanRepaymentInfo.render(loanRepaymentInfoDataset);
                    loans.buildFullRepaymentCharts(
                            parseFloat(response["ns:NewLoanAmount1"]),
                            parseFloat(extras.rwp)
                    );
                    
                    document.getElementById("frame1").style.display = "none";
                    document.getElementById("frame2").style.display = "none";
                    document.getElementById("frame3").style.display = "none";
                    document.getElementById("frame4").style.display = "block";
                    document.getElementById("frame5").style.display = "block";
                    
                    document.getElementById("repaymentButton").onclick = function() {loans.doFullRepayment();};
                    
                    $("#repaymentPartialInfo").slideDown(600);
                    
                };
                
                var tagRoot = "Product_LoanPartialRepayment_CalculateResponse";
                var tagList = '["ns:NewLoanAmount"]';
                var payload = {
                        "ServiceDomain":"Product",
                        "OperationName":"Product_LoanPartialRepayment_Calculate",
                        "loan:AccountID":document.getElementById("loanAccounts")[document.getElementById("loanAccounts").selectedIndex].value,
                        "loan:RepaymentAmount":0,
                        "loan:KeepMaturityDate":1,
                };
                
                network.doESB(populater2, tagRoot, tagList, JSON.stringify(payload), {"rwp":response["FullRepaymentResponse1.ns:RepaymentAmountAfterPenalty"]}, true);
            }
        };
        
        var tagRoot = "Product_LoanFullRepayment_CalculateResponse";
        var tagList = '["FullRepaymentResponse"]';
        var payload = {
                "ServiceDomain":"Product",
                "OperationName":"Product_LoanFullRepayment_Calculate",
                "loan:AccountID":document.getElementById("loanAccounts")[document.getElementById("loanAccounts").selectedIndex].value,
        };
        
        network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
    }
    
};

loans.buildPartialRepaymentCharts = function(beforeRepayment, afterRepayment, interestBefore, interestAfter, monthlyBefore, monthlyAfter, isKMD) {
    $('#repaymentBalanceChart').highcharts({
        chart: {
            type: 'bar'
        },
        colors: [
           '#2f7ed8', 
           '#0d233a'
        ],
        credits: {
            enabled: false
            },
        title: {
            text: 'Repayment Balance',
            align: 'left'
        },
        subtitle: {
            text: 'Singapore Dollars'
        },
        xAxis: {
            categories: ['Repayment Amount'],
            title: {
                text: null
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Amount (SGD)',
                align: 'high'
            },
            labels: {
                overflow: 'justify'
            }
        },
        tooltip: {
            valueSuffix: ' SGD'
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true,
                    align: 'right',
                    color: '#FFFFFF',
                }
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: 0,
            y: 20,
            floating: true,
            borderWidth: 1,
            backgroundColor: '#FFFFFF',
            shadow: true
        },
        series: [{
            name: 'Initial amount',
            data: [beforeRepayment]
        }, {
            name: 'New amount',
            data: [afterRepayment]
        }]
    });
    
    $('#interestPaymentChart').highcharts({
        chart: {
            type: 'bar'
        },
        colors: [
           '#ff7f7f', 
           '#ff3232'
        ],
        credits: {
            enabled: false
            },
        title: {
            text: 'Interest Amount',
            align: 'left'
        },
        subtitle: {
            text: 'Singapore Dollars'
        },
        xAxis: {
            categories: ['Interest Amount'],
            title: {
                text: null
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Amount (SGD)',
                align: 'high'
            },
            labels: {
                overflow: 'justify'
            }
        },
        tooltip: {
            valueSuffix: ' SGD'
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true,
                    align: 'right',
                    color: '#FFFFFF',
                }
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: 0,
            y: 20,
            floating: true,
            borderWidth: 1,
            backgroundColor: '#FFFFFF',
            shadow: true
        },
        series: [{
            name: 'Initial amount',
            data: [interestBefore]
        }, {
            name: 'New amount',
            data: [interestAfter]
        }]
    });
    
    $('#monthlyPaymentChart').highcharts({
        chart: {
            type: 'bar'
        },
        colors: [
           '#01DF74', 
           '#31B404'
        ],
        credits: {
            enabled: false
            },
        title: {
            text: (isKMD)? 'Monthly Installment' : 'Loan Term Remaining',
            align: 'left'
        },
        subtitle: {
            text: (isKMD)? 'Singapore Dollars': 'Remaining Months'
        },
        xAxis: {
            categories: (isKMD)? ['Monthly Installment'] : ['Loan Term'],
            title: {
                text: null
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: (isKMD)? 'Amount (SGD)' : 'Month',
                align: 'high'
            },
            labels: {
                overflow: 'justify'
            }
        },
        tooltip: {
            valueSuffix: (isKMD)? ' SGD' : ' months'
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true,
                    align: 'right',
                    color: '#FFFFFF',
                }
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: 0,
            y: 20,
            floating: true,
            borderWidth: 1,
            backgroundColor: '#FFFFFF',
            shadow: true
        },
        series: [{
            name: (isKMD)? 'Initial amount' : 'Old Loan Term',
            data: [monthlyBefore]
        }, {
            name: (isKMD)? 'New amount' : 'New Loan Term',
            data: [monthlyAfter]
        }]
    });
};

loans.buildFullRepaymentCharts = function(olp, rwp) {
    $('#fullRepaymentChart').highcharts({
        chart: {
            type: 'bar'
        },
        credits: {
            enabled: false
            },
        title: {
            text: 'Full Loan Repayment'
        },
        subtitle: {
            text: ''
        },
        xAxis: {
            categories: ['Repayment Options'],
            title: {
                text: null
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Amount (SGD)',
                align: 'high'
            },
            labels: {
                overflow: 'justify'
            }
        },
        tooltip: {
            valueSuffix: ' SGD'
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true,
                    align: 'right',
                    color: '#FFFFFF',
                }
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: 0,
            y: 20,
            floating: true,
            borderWidth: 1,
            backgroundColor: '#FFFFFF',
            shadow: true
        },
        series: [{
            name: 'Outstanding Loan Payments',
            data: [olp]
        }, {
            name: 'Repayment with penalty',
            data: [rwp]
        }]
    });
};

loans.doPartialRepayment = function() {
    var tagRoot = "Transaction_LoanPartialRepayment_CreateResponse";
    var tagList = '[""]';
    var payload = {
            "ServiceDomain":"Transaction",
            "OperationName":"Transaction_LoanPartialRepayment_Create",
            "accountID":document.getElementById("loanAccounts")[document.getElementById("loanAccounts").selectedIndex].value,
            "transactionAmount":loans.transactionAmount,
            "transactionBranch":"IBS",
            "officerID":"RIB",
            "keepMaturityDate":document.getElementById("keepMaturityDate").checked
    };
    
    var populater = function(response, extras) {
        if(response.status == "ok" && response.esbStatus == "invocation successful") {
            document.getElementById("repaymentStatus").innerHTML = "Repayment completed successfully";
            document.getElementById("repaymentStatusSub").innerHTML = "";
        } else {
            document.getElementById("repaymentStatus").innerHTML = "Error processing transaction";
            document.getElementById("repaymentStatusSub").innerHTML = response.esbStatus;
        }
        document.getElementById("calculateButton").style.display = "none";
        document.getElementById("repaymentButton").innerHTML = "BACK";
        document.getElementById("repaymentButton").onclick = function() {loans.buildMainMenu();};
    };
    
    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
};

loans.doFullRepayment = function() {
    var tagRoot = "Transaction_LoanFullRepayment_CreateResponse";
    var tagList = '[""]';
    var payload = {
            "ServiceDomain":"Transaction",
            "OperationName":"Transaction_LoanFullRepayment_Create",
            "accountID":document.getElementById("loanAccounts")[document.getElementById("loanAccounts").selectedIndex].value,
            "transactionAmount":loans.transactionAmount,
            "transactionBranch":"IBS",
            "transactionDate": moment().toISOString(),
            "paymentMode":"IBS",
            "narrative":"RIB Self Repayment",
            "currency":"SGD",
    };
    
    var populater = function(response, extras) {
        if(response.status == "ok" && response.esbStatus == "invocation successful") {
            document.getElementById("repaymentStatus").innerHTML = "Repayment completed successfully";
            document.getElementById("repaymentStatusSub").innerHTML = "";
        }  else {
            document.getElementById("repaymentStatus").innerHTML = "Error processing transaction";
            document.getElementById("repaymentStatusSub").innerHTML = response.esbStatus;
        }
        document.getElementById("calculateButton").style.display = "none";
        document.getElementById("repaymentButton").innerHTML = "BACK";
        document.getElementById("repaymentButton").onclick = function() {loans.buildMainMenu();};
    };
    
    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
};

loans.getDollars = function(amount) {
    var balance = parseFloat(amount).toFixed(2);
    return (balance - loans.getCents(amount)/100);
};

loans.getPrettyAmount = function(amount, noCents) {
    var dollars = loans.getDollars(amount).toString();
    var cents = loans.getCents(amount);
    
    for(var i = dollars.length - 3; i > 0; i -= 3) {
        dollars = dollars.substring(0, i) + "," + dollars.substring(i, dollars.length);
    }
    if(noCents) {
        return dollars;
    } else {
        return dollars + "." + cents;
    }
};

loans.getCents = function(amount) {
    var balance = parseFloat(amount).toFixed(2);
    var balanceCents = ((balance - Math.floor(balance)) * 100).toFixed(0);
    balanceCents = (balanceCents < 10)? (balanceCents == 0)? "00" : "0" + balanceCents : balanceCents;
    return balanceCents;
};

loans.newLoanDetails = function() {
    var nld = new myPop("newLoanDetails");
    var settlementAccounts = [];
    var newLoanDetailsDataset = {
        settlementAccount: settlementAccounts
    };
    for(var i = 1; i <= loans.accountList["accountID.length"]; i++) {
        if(loans.accountList["productID" + i] == 101 && loans.accountList["currentStatus" + i] == 'Open') {
            settlementAccounts.push({
                accountNumber: loans.accountList["accountID" + i],
                accountName: loans.getProductName(loans.accountList["productID" + i]) + " " + loans.accountList["accountID" + i] + " - " + loans.accountList["currency" + i] + "$" + loans.getPrettyAmount(loans.accountList["balance" + i])
            });
        }
    }
    nld.popOut(loans.stencils.newLoanDetails.render(newLoanDetailsDataset, "string"));
};

loans.validateLoanCreation = function() {
    if(document.getElementById("loanTitle").value === "" || document.getElementById("assetValue").value === "") {
        document.getElementById("nldStatus").innerHTML = "Fields cannot be blank";
        return;
    }
    if(!(/^\d+$/.test(document.getElementById("assetValue").value))) {
        document.getElementById("nldStatus").innerHTML = "Collateral Asset Value can only be digits";
        return;
    }
    var tagRoot = "ProductParameters";
    var tagList = '["ProductParameters"]';
    var payload = {
            "ServiceDomain":"Product",
            "OperationName":"Product_Parameters_Read",
            "GlobalProductID": loans.lastValidNewLoan.productID,
    };
    
    var populater = function(response, extras) {
        if(response.esbStatus == "invocation successful") {
            if(parseFloat(loans.lastValidNewLoan.principle) >= parseFloat(response["ProductParameters1.ns:MinOpeningBalance"])) {
                if(response["ProductParameters1.ns:MaxLtvRatio"] > 0) {
                    if((parseFloat(loans.lastValidNewLoan.principle) / parseFloat(document.getElementById("assetValue").value)) <= response["ProductParameters1.ns:MaxLtvRatio"]) {
                        loans.lastValidNewLoan.penaltyRate = response["ProductParameters1.ns:PenaltyRate"];
                        loans.lastValidNewLoan.ltvRatio = parseFloat(loans.lastValidNewLoan.principle) / parseFloat(document.getElementById("assetValue").value).toFixed(2);
                        loans.lastValidNewLoan.settlementAccount = document.getElementById("settlementAccount")[document.getElementById("settlementAccount").selectedIndex].value;
                        loans.lastValidNewLoan.title = document.getElementById("loanTitle").value;
                        loans.lastValidNewLoan.assetValue = document.getElementById("assetValue").value;
                        //close popup and build rmscheduler
                        ui.closePopup("newLoanDetails");
                        rmScheduler.buildScheduler();
                    } else {
                        document.getElementById("nldStatus").innerHTML = "You can only loan up to " + response["ProductParameters1.ns:MaxLtvRatio"] * 100 + "% of your collateral asset value";
                    }
                } else {
                    loans.lastValidNewLoan.penaltyRate = response["ProductParameters1.ns:PenaltyRate"];
                    loans.lastValidNewLoan.ltvRatio = 1;
                    loans.lastValidNewLoan.settlementAccount = document.getElementById("settlementAccount")[document.getElementById("settlementAccount").selectedIndex].value;
                    loans.lastValidNewLoan.title = document.getElementById("loanTitle").value;
                    loans.lastValidNewLoan.assetValue = 0;
                    //close popup and build rmscheduler
                    ui.closePopup("newLoanDetails");
                    rmScheduler.buildScheduler();
                }
            } else {
                document.getElementById("nldStatus").innerHTML = "You do not meet the opening balance of $" + response["ProductParameters1.ns:MinOpeningBalance"];
            }
        }
    };
    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
};

rmScheduler.buildScheduler = function(isManage) {
    loans.stencils.appointmentScheduler.render({});
    if(isManage) {
        document.getElementById("rmSchedulerBack").onclick = function() {loans.buildMainMenu();};
    }
    
    scheduler.config.xml_date = "%Y-%m-%d %H:%i";
    scheduler.config.mark_now = false;
    scheduler.config.container_autoresize = true;
    scheduler.config.check_limits = true;
    scheduler.config.limit_start = moment().add(1, 'days').toDate();
    scheduler.config.limit_end = moment().add(1, 'months').toDate();
    scheduler.config.limit_view = true;
    scheduler.config.details_on_dblclick = true;
    scheduler.config.dblclick_create = !isManage;
    scheduler.config.details_on_create = true;
    scheduler.config.auto_end_date = true;
    scheduler.config.collision_limit = 1;
    scheduler.config.drag_create = false;
    scheduler.config.drag_move = false;
    scheduler.config.drag_resize = false;
    scheduler.config.event_duration = 60;
    scheduler.config.first_hour = 9;
    scheduler.config.last_hour = 18;
    scheduler.config.limit_time_select = true;
    scheduler.config.time_step = 60;
    scheduler.config.icons_select = [];

    scheduler.init('scheduler_here', moment().add(1, 'days').toDate(), "week");
    
    scheduler.showLightbox = function(id) {
        var event = scheduler.getEvent(id);
        var lightbox = new myPop("modalLightbox");
        lightbox.popOut(loans.stencils.schedulerLightbox.render({}, "string"));
        if(isManage) {
            document.getElementById('previewLightbox').style.display = "none";
            document.getElementById('confirmLightbox').style.display = "none";
        }
        document.getElementById('eventStartDateTime').innerHTML = moment(event.start_date).format("DD MMM YYYY hh:mma") + " - " + moment(event.end_date).format("hh:mma");
        scheduler.startLightbox(id, document.getElementById("modalLightbox"));
    };
    
    for(var i = 1; i <= 7; i++) {
        rmScheduler.setBlocked(moment().add(1, 'days').subtract(i, 'days').toDate(), 0*60, 24*60);
        rmScheduler.setBlocked(moment().add(1, 'month').add(i, 'days').toDate(), 0*60, 24*60);
    }
    rmScheduler.setBlocked(6, 13*60, 24*60); //sat
    rmScheduler.setBlocked(0, 0*60, 24*60); //sun
    rmScheduler.getInvalidSlots();
    rmScheduler.getUserSlots();
};

rmScheduler.getInvalidSlots = function() {
    var payload = {
            "startDateTime":moment().add(1, 'days').format("DD/MM/YYYY HH:mm:ss"),
            "endDateTime":moment().add(1, 'months').format("DD/MM/YYYY HH:mm:ss"),
    };
    
    var populater = function(response, extras) {
        if(response.esbStatus == "invocation successful") {
            for(var i = 1; i < response["invalidSlots.length"]; i++) {
                var start = moment(response["invalidSlots" + i + ".startDateTime"], "DD/MM/YYYY HH:mm:ss");
                var end = moment(response["invalidSlots" + i + ".endDateTime"], "DD/MM/YYYY HH:mm:ss");
                rmScheduler.setInvalid(start.toDate(), start.hour() * 60  + start.minute(), end.hour() * 60 + end.minute());
            }
        }
    };
    network.doIBS(populater, "ajaxGetAllAppointments.action", JSON.stringify(payload), null, true);
};

rmScheduler.getUserSlots = function() {
    var payload = {
            "startDateTime":moment().add(1, 'days').format("DD/MM/YYYY HH:mm:ss"),
            "endDateTime":moment().add(1, 'months').format("DD/MM/YYYY HH:mm:ss"),
    };
    
    var populater = function(response, extras) {
        if(response.esbStatus == "invocation successful") {
            for(var i = 1; i <= response["appt.length"]; i++) {
                var start = moment(response["appt" + i + ".startTime"], "DD/MM/YYYY HH:mm:ss").toDate();
                var end = moment(response["appt" + i + ".endTime"], "DD/MM/YYYY HH:mm:ss").toDate();
                rmScheduler.setEvent(start, end);
            }
        }
    };
    network.doIBS(populater, "ajaxGetAllAppointments.action", JSON.stringify(payload), null, true);
};

rmScheduler.createLoanAccount = function(event) {
    var tagRoot = "Account_Loan_CreateResponse";
    var tagList = '["accountID"]';
    var payload = {
            "ServiceDomain":"Account",
            "OperationName":"Account_Loan_Create",
            "productID": loans.lastValidNewLoan.productID,
            "productName": loans.getProductName(loans.lastValidNewLoan.productID),
            "loanTerm": loans.lastValidNewLoan.numOfMonths,
            "ltvRatio": loans.lastValidNewLoan.ltvRatio,
            "repaymentGraceDay": 14,
            "assetValue": loans.lastValidNewLoan.assetValue,
            "fixedTerm": loans.lastValidNewLoan.numOfMonths,
            "title": loans.lastValidNewLoan.title,
            "isInterestWaived": false,
            "currency": "SGD",
            "homeBranch": "IBS",
            "officerID": "RIB",
            "accountOpenDate": moment().format("YYYY-MM-DD"),
            "balance": loans.lastValidNewLoan.principle,
            "currentStatus": "Pending",
            "interestRate": loans.lastValidNewLoan.interestRate,
            "assignedAccountForAccountManagementFeeDeduction": loans.lastValidNewLoan.settlementAccount,
            "isServiceChargeWaived": false,
            "penaltyRate": loans.lastValidNewLoan.penaltyRate,
            "SettlementAccount": loans.lastValidNewLoan.settlementAccount,
    };
    
    var populater = function(response, extras) {
        if(response.esbStatus == "invocation successful") {
            loans.lastValidNewLoan.accountID = response.accountID1;
            rmScheduler.doCreateAppointment(
                moment(event.start_date).format("DD/MM/YYYY HH:mm:ss"),
                moment(event.end_date).format("DD/MM/YYYY HH:mm:ss"),
                JSON.stringify(loans.lastValidNewLoan)
            );
        }
    };
    network.doESB(populater, tagRoot, tagList, JSON.stringify(payload), null, true);
};

rmScheduler.doCreateAppointment = function(startDateTime, endDateTime, loanData) {
    var payload = {
            "startDateTime": startDateTime,
            "endDateTime": endDateTime,
            "loanData": loanData,
    };
    
    var populater = function(response, extras) {
        if(response.esbStatus == "Appointment created") {
            document.getElementById('lightboxStatus').innerHTML = response.esbStatus;
            document.getElementById('closeLightbox').onclick = function() {rmScheduler.previewAppointment();};
            rmScheduler.buildScheduler(true);
            setTimeout(function(){$('#lightboxStatus').fadeOut("slow", "swing", function() {ui.closePopup('modalLightbox');scheduler.endLightbox(true);});}, 3000);
        } else {
            document.getElementById('lightboxStatus').innerHTML = response.esbStatus;
            setTimeout(function(){$('#lightboxStatus').fadeOut("slow", "swing", function() {ui.closePopup('modalLightbox');scheduler.endLightbox(false);});}, 3000);
        }
    };
    network.doIBS(populater, "ajaxCreateRMAppointment.action", JSON.stringify(payload), null, true);
};

rmScheduler.doDeleteAppointment = function(startDateTime, eventID) {
    var payload = {
            "startDateTime": startDateTime,
    };
    
    var populater = function(response, extras) {
        if(response.esbStatus == "Appointment deleted") {
            document.getElementById('lightboxStatus').innerHTML = response.esbStatus;
            scheduler.deleteEvent(eventID);
            setTimeout(function(){$('#lightboxStatus').fadeOut("slow", "swing", function() {ui.closePopup('modalLightbox');scheduler.endLightbox(false);});}, 3000);
        } else {
            document.getElementById('lightboxStatus').innerHTML = response.esbStatus;
            setTimeout(function(){$('#lightboxStatus').fadeOut("slow", "swing", function() {ui.closePopup('modalLightbox');scheduler.endLightbox(false);});}, 3000);
        }
    };
    network.doIBS(populater, "ajaxDeleteRMAppointment.action", JSON.stringify(payload), null, true);
};

rmScheduler.setBlocked = function(date, startTime, endTime) {
    scheduler.addMarkedTimespan({
        days: date,
        zones: [startTime, endTime],
        html: "<b><i>Not Avaliable</i></b>",
        css: "gray_section",
        type: "dhx_time_block"
    });
    scheduler.updateView();
};

rmScheduler.setInvalid = function(date, startTime, endTime) {
    scheduler.addMarkedTimespan({
        days: date,
        zones: [startTime, endTime],
        html: "<b><i>Timeslot fully occupied</i></b>",
        css: "red_section",
        type: "dhx_time_block"
    });
    scheduler.updateView();
};

rmScheduler.setEvent = function(startDateTime, endDateTime) {
    scheduler.addEvent({
        start_date: startDateTime,
        end_date: endDateTime,
        text: "Appointment with RM",
    });
};

rmScheduler.previewAppointment = function() {
    ui.closePopup('modalLightbox');
    scheduler.endLightbox(true);
};

rmScheduler.confirmAppointment = function() {
    document.getElementById('confirmLightbox').disabled = true;
    var event = scheduler.getEvent(scheduler.getState().lightbox_id);
    //Set schedule to IBS
    rmScheduler.createLoanAccount(event);
};

rmScheduler.deleteAppointment = function() {
    var eventID = scheduler.getState().lightbox_id;
    var event = scheduler.getEvent(scheduler.getState().lightbox_id);
    rmScheduler.doDeleteAppointment(moment(event.start_date).format("DD/MM/YYYY HH:mm:ss"), eventID);
};

rmScheduler.cancelLightbox = function() {
    ui.closePopup('modalLightbox');
    scheduler.endLightbox(false);
};