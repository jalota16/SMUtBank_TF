package com.smutbank.IBS.actions;

import java.io.IOException;
import java.io.PrintWriter;
import java.net.MalformedURLException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import javax.servlet.http.HttpServletResponse;

import org.apache.struts2.ServletActionContext;
import org.apache.struts2.interceptor.ParameterAware;

import com.opensymphony.xwork2.ActionInvocation;
import com.opensymphony.xwork2.ActionSupport;
import com.smutbank.IBS.services.CtrlContainer;
import com.smutbank.IBS.services.SoapBar;
import com.tibco.as.space.Tuple;

public class QuikPay extends ActionSupport implements ParameterAware{
	
	private Map parameters;
	
	public void ajaxCreateQuikPayTransaction() {
		LinkedHashMap<String,String> requestData = SoapBar.jsonToHashMap(getRequestParam("jsonRequest"));;
		String transactionID = createQuikPayTransaction(requestData.get("accountCredit"));
		LinkedHashMap<String,String> responseData = new LinkedHashMap<String,String>();
		if(transactionID != null) {
			responseData.put("quikPayID", transactionID);
			responseData.put("status", "ok");
		} else {
			responseData.put("status", "Error creating QuikPay transaction");
		}
		IBSSystem.printConsole("QuikPay transaction created with ID: " + transactionID);
		sendResponse(SoapBar.hashMapToJson(responseData));
	};
	
	private static String createQuikPayTransaction(String accountCredit) {
		String transactionID = UUID.randomUUID().toString();
		Tuple newQPTrans = Tuple.create();
		newQPTrans.put("transactionID", transactionID);
		newQPTrans.put("accountCredit", accountCredit);
		try {
			CtrlContainer.getAsc().put("QuikPayTransaction", newQPTrans);
		} catch (Exception e) {
			IBSSystem.printConsole("Error creating QuikPay tranaction");
			return null;
		}
		return transactionID;
	}
	
	public void ajaxUpdateQuikPayTransaction() {
		LinkedHashMap<String,String> requestData = SoapBar.jsonToHashMap(getRequestParam("jsonRequest"));
		String status = updateQuikPayTransaction(requestData.get("quikPayID"), requestData.get("accountDebit"), requestData.get("amount"));
		LinkedHashMap<String,String> responseData = new LinkedHashMap<String,String>();
		responseData.put("status", status);
		
		if(status.equalsIgnoreCase("ok")) {
			IBSSystem.printConsole("QuikPay transaction updated with ID: " + requestData.get("quikPayID"));
		}
		sendResponse(SoapBar.hashMapToJson(responseData));
	};
	
	private static String updateQuikPayTransaction(String transactionID, String accountDebit, String amount) {
		Tuple qpTrans = null;
		try {
			qpTrans = getQPTransaction(transactionID);
			if(qpTrans == null) {
				throw new Exception();
			}
		} catch (Exception e) {
			return "QuikPay transaction not found!";
		}
		qpTrans.put("accountDebit", accountDebit);
		qpTrans.put("amount", amount);
		try {
			CtrlContainer.getAsc().put("QuikPayTransaction", qpTrans);
		} catch (Exception e) {
			IBSSystem.printConsole("Error updating QuikPay tranaction");
			return "Error updating QuikPay tranaction";
		}
		return "ok";
	}
	
	public void ajaxEffectQuikPayTransaction() {
		LinkedHashMap<String,String> requestData = SoapBar.jsonToHashMap(getRequestParam("jsonRequest"));
		HashMap<String,String> responseData = effectQuikPayTransaction(getRequestParam("sessionID"), requestData);
		
		sendResponse(SoapBar.hashMapToJson(responseData));
	};
	
	private static HashMap<String,String> effectQuikPayTransaction(String sessionID, HashMap<String,String> requestData) {
		HashMap<String,String> responseData = new LinkedHashMap<String,String>();
		Tuple qpTrans = null;
		try {
			qpTrans = getQPTransaction(requestData.get("quikPayID"));
			if(qpTrans == null) {
				throw new Exception();
			}
		} catch (Exception e) {
			responseData.put("status", "QuikPay transaction not found!");
			return responseData;
		}
		
		//do funds transfer here
		LinkedHashMap<String,String> fdRequestData = new LinkedHashMap<String,String>();
		fdRequestData.put("ConsumerID", requestData.get("ConsumerID"));
		fdRequestData.put("TransactionID", requestData.get("TransactionID"));
		fdRequestData.put("CacheEnabled", requestData.get("CacheEnabled"));
		fdRequestData.put("ServiceDomain", "Payment");
		fdRequestData.put("OperationName", "Payment_CreditTransfer_Create");
		fdRequestData.put("accountFrom", qpTrans.getString("accountDebit"));
		fdRequestData.put("accountTo", qpTrans.getString("accountCredit"));
		fdRequestData.put("transactionAmount", qpTrans.getString("amount"));
		fdRequestData.put("transactionReferenceNumber", requestData.get("TransactionID"));
		fdRequestData.put("paymentMode", "QuikPay");
		fdRequestData.put("overrideFlag", "false");
		fdRequestData.put("narrative", "QuikPay - from: " + qpTrans.getString("accountDebit") + " to: " + qpTrans.getString("accountCredit"));
		fdRequestData.put("transactionBranch", "IBS");
		fdRequestData.put("officerID", "IBS");
		fdRequestData.put("merchantID", "0000000001");
		fdRequestData.put("customerID", Login.getSessionInfo(sessionID, "customerID"));
		fdRequestData.put("beneficiaryID", "QuikPay");
		
		ArrayList<String> tagList = new ArrayList<String>();
		tagList.add("TransactionID");
		tagList.add("BalanceBefore");
		tagList.add("BalanceAfter");
		
		try {
			responseData = ESBService.doESBService(fdRequestData, "Payment_CreditTransfer_CreateResponse", tagList);
			responseData.put("status", "ok");
			return responseData;
		} catch (MalformedURLException e) {
			IBSSystem.printConsole("Error effecting fund transfer for QuikPay");
			responseData.put("status", "Error effecting fund transfer for QuikPay");
			return responseData;
		}
	}
	
	public void ajaxGetQuikPayTransaction() {
		LinkedHashMap<String,String> requestData = SoapBar.jsonToHashMap(getRequestParam("jsonRequest"));
		LinkedHashMap<String,String> responseData = new LinkedHashMap<String,String>();
		try {
			Tuple quikPay = getQPTransaction(requestData.get("quikPayID"));
			if(quikPay == null) {
				throw new Exception();
			}
			responseData.put("accountDebit", quikPay.getString("accountDebit"));
			responseData.put("accountCredit", quikPay.getString("accountCredit"));
			responseData.put("amount", quikPay.getString("amount"));
			responseData.put("status", "ok");
		} catch (Exception e) {
			responseData.put("status", "QuikPay transaction not found!");
			sendResponse(SoapBar.hashMapToJson(responseData));
		}
		IBSSystem.printConsole("QuikPay transaction retrieved with ID: " + requestData.get("quikPayID"));
		sendResponse(SoapBar.hashMapToJson(responseData));
	};
	
	private static Tuple getQPTransaction(String transactionID) throws Exception {
		Tuple key = Tuple.create();
		key.put("transactionID", transactionID);
		Tuple qpTrans = null;
		try {
			qpTrans = CtrlContainer.getAsc().get("QuikPayTransaction", key);
		} catch (Exception e) {
			IBSSystem.printConsole("QuikPay transaction with ID: " + transactionID + " not found!");
			throw new Exception("The QuikPay transaction has expired or is invalid");
		}
		return qpTrans;
	}

	@Override
	public void setParameters(Map paramMap) {
		parameters = paramMap;
	}
	
	private String getRequestParam(String paramName) {
		Object varr = null;
		if(parameters != null) {
			varr = parameters.get(paramName);
		}
		if (varr == null) {
			return null;
		} else {
			return ((String[]) varr)[0];
		}
	}
	
	private void sendResponse(String responseString) {
		HttpServletResponse response = ServletActionContext.getResponse();
        response.setContentType("text/plain ");
        PrintWriter out;
		try {
			out = response.getWriter();
			out.print(responseString);	
	        out.flush();
	        out.close();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			IBSSystem.printConsole(e.getMessage());
		}
	}
	
}
