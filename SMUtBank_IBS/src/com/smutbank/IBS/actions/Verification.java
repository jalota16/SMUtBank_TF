package com.smutbank.IBS.actions;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import javax.servlet.http.HttpServletResponse;

import org.apache.struts2.ServletActionContext;
import org.apache.struts2.interceptor.ParameterAware;
import org.apache.struts2.interceptor.SessionAware;

import com.opensymphony.xwork2.ActionContext;
import com.opensymphony.xwork2.ActionSupport;
import com.opensymphony.xwork2.util.ValueStack;
import com.smutbank.IBS.services.ASController;
import com.smutbank.IBS.services.CtrlContainer;
import com.smutbank.IBS.services.SoapBar;
import com.tibco.as.space.Tuple;

public class Verification extends ActionSupport implements SessionAware, ParameterAware {
	
	private static final String VERIAPPROVALTABLENAME = "VerificationApproval";
	private Map<String, Object> session;
	private Map parameters;
	
	@Override
	public void setSession(Map session) {
		this.session = session;
	}
	
	@Override
	public void setParameters(Map parameters) {
		this.parameters = parameters;
	}
	
	public void initiateVerifyOTP2FA() throws Exception {
		HashMap<String,String> requestData = new HashMap<String,String>();
		/*
		String channel = getRequestParam("channel");
		String sessionID = "";
		String username = "";
		String pin = "";
		if(channel != null) {
			if(channel.equalsIgnoreCase("RMB")) {
				sessionID = getRequestParam("sessionID");
				username = getRequestParam("username");
				pin = getRequestParam("PIN");
			} else if(channel.equalsIgnoreCase("RIB")) {
				sessionID = (String)session.get("sessionID");
				username = (String)session.get("username");
				pin = (String)session.get("PIN");
			} else {
				sendResponse(getStatusResponse("Unable to set verification params"));
			}
		}
		*/
		requestData.put("ConsumerID", "RIB");
		requestData.put("TransactionID", (String)session.get("sessionID"));
		requestData.put("CacheEnabled", "false");
		requestData.put("LoginID", (String)session.get("username"));
        requestData.put("Pin", (String)session.get("PIN"));
        requestData.put("ServiceDomain", "Party");
        requestData.put("OperationName", "Party_Login_2FAPIN_Create");
        
        HashMap<String,String> responseData = Login.doSMSOTPLoginTransaction(requestData);
        if(responseData.get("Message1").equalsIgnoreCase("Success")) {
        	sendResponse(getStatusResponse("An OTP SMS has been sent to your registered mobile number"));
        } else {
        	sendResponse(getStatusResponse("OTP SMS service is currently unavaliable, please try again later"));
        }
	}
	
	public void verifyOTP2FA() throws Exception {
		HashMap<String,String> requestData = getJsonRequest();
		requestData.put("LoginID", (String)session.get("username"));
        requestData.put("ServiceDomain", "Party");
        requestData.put("OperationName", "Party_Login_Authenticate");
        
        try {
			HashMap<String,String> responseData = Login.doSMSOTPLoginSession(requestData, false);
			if(Integer.parseInt(Login.getSessionInfo(getJsonRequest().get("TransactionID"), "customerID")) == Integer.parseInt(responseData.get("customerID"))) {
				String verificationID = UUID.randomUUID().toString();
				try {
	                Tuple verification = Tuple.create();
	                verification.put("sessionID",(String)session.get("sessionID"));
	                verification.put("verificationCode", verificationID);
	                CtrlContainer.getAsc().put(VERIAPPROVALTABLENAME,verification);
	            } catch(Exception e) {
	            	sendResponse(getStatusResponse("Error storing verification"));
	            }
				HashMap<String,String> returnData = new HashMap<String,String>();
				returnData.put("status", "ok");
				returnData.put("verificationID", verificationID);
				IBSSystem.printConsole("Mobile 2FA verified: Customer: " + Login.getSessionInfo((String)session.get("sessionID"), "customerID") + " for VerificationID: " + verificationID);
				sendResponse(SoapBar.hashMapToJson(returnData));
			} else {
				throw new Exception();
			}
		} catch (Exception e) {
			sendResponse(getStatusResponse("OTP entered is invalid"));
		}
	}
	
	public void initiateVerifyMobile2FA() throws Exception {
		HashMap<String,String> requestData = new HashMap<String,String>();
		String channel = getRequestParam("channel");
		String username = "";
		String pin = "";
		if(channel != null) {
			if(channel.equalsIgnoreCase("RMB")) {
				username = getRequestParam("username");
				pin = getRequestParam("PIN");
			} else if(channel.equalsIgnoreCase("RIB")) {
				username = (String)session.get("username");
				pin = (String)session.get("PIN");
			} else {
				sendResponse(getStatusResponse("Unable to get verification params"));
			}
		}
		
		requestData.put("username", username);
        requestData.put("PIN", pin);
        
        HashMap<String,String> responseData = Login.doMobile2FALoginTransaction(requestData);
        responseData.put("status", "ok");
        sendResponse(SoapBar.hashMapToJson(responseData));
	}
	
	public void verifyMobile2FA() throws Exception {
		LinkedHashMap<String,String> responseData = new LinkedHashMap<String, String>();
        responseData.put("status", "ok");
        String challenge = getJsonRequest().get("challenge");
        String responseText = "";
        
        IBSSystem.printConsole("Mobile 2FA Verification: Challenge code: " + challenge);
        Tuple keyset=Tuple.create();
        keyset.put("challenge", challenge);
        
        ASController asc = CtrlContainer.getAsc();
        try{
            Tuple loginNotification = asc.take(Login.LOGINSESSIONNOTIFICATIONTABLENAME, keyset);
            if(loginNotification == null) {
            	throw new Exception();
            }
            
            if(Integer.parseInt(Login.getSessionInfo(getJsonRequest().get("TransactionID"), "customerID")) == Integer.parseInt((Login.getSessionInfo(loginNotification.getString("sessionID"), "customerID")))) {
            	String verificationID = UUID.randomUUID().toString();
            	Tuple verification = Tuple.create();
                verification.put("sessionID",getJsonRequest().get("TransactionID"));
                verification.put("verificationCode", verificationID);
            	asc.delete(Login.LOGINSESSIONTABLENAME, loginNotification);
            	asc.put(VERIAPPROVALTABLENAME,verification);;
            	responseData.put("message", "Authenticated");
            	responseData.put("verificationID", verificationID);
            	
            	IBSSystem.printConsole("Mobile 2FA verified: Customer: " + Login.getSessionInfo((String)session.get("sessionID"), "customerID") + " for VerificationID: " + verificationID);
            	sendResponse(SoapBar.hashMapToJson(responseData));
            	return;
            } else {
            	responseData.put("message", "Invalid Mobile 2FA");
            	sendResponse(SoapBar.hashMapToJson(responseData));
            	return;
            }
        } catch(Exception e) {
        	responseText = "Waiting for mobile authentication";
        }
        try {
        	asc.get(Login.LOGINTRANSACTIONTABLENAME, keyset);
        } catch (Exception e) {
            e.printStackTrace();
        	responseText = "Mobile authentication time out";
        }
        responseData.put("message", responseText);
        sendResponse(SoapBar.hashMapToJson(responseData));
	}
	
	private String getRequestParam(String paramName) {
        try {
        	return ((String[])parameters.get(paramName))[0];
        } catch(Exception e) {
        	return null;
        }
	}
	
	private String getStatusResponse(String statusMsg) {
		HashMap<String,String> responseData = new HashMap<String,String>();
		responseData.put("status", "ok");
		responseData.put("esbStatus", statusMsg);
		return SoapBar.hashMapToJson(responseData);
	}
	
	private HashMap<String,String> getJsonRequest() throws Exception {
    	String jsonInput = getRequestParam("jsonRequest");
    	if (jsonInput==null) {
			throw new Exception("No Json Input");
		}
    	
    	HashMap<String,String> data = SoapBar.jsonToHashMap(jsonInput);
    	if (data==null) {
			throw new Exception("No data");
		}
    	return data;
    }
	
	private void setRIBStatus(String message) {
		ValueStack vs = ActionContext.getContext().getValueStack();
		vs.set("status", message);
	}
	
	private void sendResponse(String r) throws IOException{
		HttpServletResponse response = ServletActionContext.getResponse();
        response.setContentType("text/plain ");
        PrintWriter out = response.getWriter();
        out.print(r);
        out.flush();
        out.close();
	}

}
