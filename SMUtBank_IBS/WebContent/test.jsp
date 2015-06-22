<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="ISO-8859-1"%>
<%@taglib uri="/struts-tags" prefix="s" %>
<%@ page import="com.opensymphony.xwork2.ActionContext" %>
<%@ page import="com.opensymphony.xwork2.util.ValueStack" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<title>bankrevels testing</title>
<script type="text/javascript" src="sha.js"></script>
<script type="text/javascript" src="admin.js"></script>
</head>
<body>
<%@ page import="java.util.*" %>
<%
	String sessionID = (String)session.getAttribute("sessionID");
%>
<s:debug />
Status: <s:property value="status" />
<s:set name="redirect" value=" '/test.jsp' " scope="session"/>
	
	<!-- IBS -->
	<form action="http://localhost:8080/SMUtBank_IBS">
	    <input type="submit" value="Go to Localhost IBS">
	</form>
	
	<form action="http://10.0.106.169:8080/SMUtBank_IBS">
	    <input type="submit" value="Go to hosted IBS">
	</form>
	<br>
	
	<!-- RIB -->
	<form action="http://localhost:8080/SMUtBank_IBS/login.action" target="_blank">
	    <input type="submit" value="Go to localhost RIB">
	</form>
	
	<form action="http://10.0.106.169:8080/SMUtBank_IBS/login.action" target="_blank">
	    <input type="submit" value="Go to hosted RIB">
	</form>
	<br>
	
	<!-- IBS startup/shutdown -->
	<form action="startup.action">
	    <input type="submit" value="Startup IBS">
	</form>
	
	<form action="shutdown.action">
	    <input type="submit" value="Shutdown IBS for redeployment">
	</form>
	<br>
	
	<!-- Mobile2FA -->
	<button type="button" onclick="getChallenge()">Do RMB challenge</button> <br>
	Challenge code: <div id="challenge"></div>
	
	<button type="button" onclick="getSession()">Do RMB session</button> <br>
	RMB session ID: <div id="rmbSessionID"></div>
	
	<!-- SMSOTP -->
	<form action="ribGetOTP.action" method="post">
	     <input name="username" value="ibtest"/>
	     <input name="password" value="123456"/>
	     <input type="submit" value="get SMS OTP"/>
	</form>
	
	<form action="ribOTPAuth.action" method="post">
	     <input name="OTP" value=""/>
	     <input type="submit" value="OTP Authenticate"/>
	</form>
	
	<!-- StackTest -->
	<form action="testLoginStack.action">
	    <input type="submit" value="Test Login Stack">
	</form>
	<br>
	
	<!-- Logout -->
	<button type="button" onclick="rmbInvalidate()">RMB session logout</button> <br>
	
	<form action="ribInvalidateSession.action" method="post">
	    <input value="RIB Session Logout" type="submit" />
	</form>
	<br>
	
	<%
		if(sessionID != null) {
			out.println("Logged in with sessionID: " + sessionID);
		} else {
			out.println("Currently not logged in");
		}
	%>
	
	<form action="GenKey.action" method="post">
	     <input name="PIN" value="123456"/>
	     <input name="salt" value="44CAEF0BADAFE9A7"/>
	     <input type="submit" value="test GenKey"/>
	</form>
	
	<!-- place holder for ESB action -->
	
	<form action="rmbESBService.action" method="post">
	     <input name="tagRoot" value="AccountList"/>
	     <input name="tagList" value="['accountID']"/>
	     <input name="sessionID" value=<%=sessionID %> />
	     <input name="jsonRequest" value="{ConsumerID:RMB,TransactionID:7891,CacheEnabled:false,ServiceDomain:Party,OperationName:Party_CustomerAccountList_Read}"/>
	     <input type="submit" value="test RMB ESBService"/>
	</form>
	<br/>
	
	<!-- QuikPay -->
	<form>
		From account: <input id="fromAccount" />
	</form>
	<button type="button" onclick="createQPT()">Create QuikPay Transaction</button> <br/>
	<button type="button" onclick="updateQPT()">Update QuikPay Transaction</button> <br/>
	<button type="button" onclick="getQPT()">Get QuikPay Transaction</button> <br/>
	<button type="button" onclick="effectQPT()">Effect QuikPay Transaction</button> <br/>
	Status: <span id="quikpayStatus"></span><br/>
	QuikPayID: <span id="quikpayID"></span><br/>
	accountCredit: <span id="accountCredit"></span><br/>
	accountDebit: <span id="accountDebit"></span><br/>
	amount: <span id="amount"></span><br/>
	TransactionID: <span id="TransactionID"></span><br/>
	BalanceBefore: <span id="BalanceBefore"></span><br/>
	BalanceAfter: <span id="BalanceAfter"></span><br/>
	
	<br/>
	
	<!-- Admin -->
	<form action="admin.action" method="post">
	     <input type="hidden" name="prop" value="ibs"/>
	     <input value="IBS Admin" type="submit" />
	</form>
	
</body>
</html>