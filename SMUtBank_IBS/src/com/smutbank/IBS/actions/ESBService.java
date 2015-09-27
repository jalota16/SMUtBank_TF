package com.smutbank.IBS.actions;

import java.io.PrintWriter;
import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import org.apache.struts2.ServletActionContext;

import com.opensymphony.xwork2.ActionContext;
import com.opensymphony.xwork2.ActionSupport;
import com.smutbank.IBS.props.IBSProperties;
import com.smutbank.IBS.services.Bubble;
import com.smutbank.IBS.services.CtrlContainer;
import com.smutbank.IBS.services.Network;
import com.smutbank.IBS.services.SoapBar;
import com.tibco.as.space.Tuple;

public class ESBService  extends ActionSupport {

	private static final String VERIAPPROVALTABLENAME = "VerificationApproval";
	
	public ESBService() throws Exception{}
	
	public void ajaxESBService() throws Exception {
		Map request= ActionContext.getContext().getParameters();
		//IBSSystem.printConsole(((String[])request.get("jsonRequest"))[0]);
		LinkedHashMap<String,String> requestData = SoapBar.jsonToHashMap(((String[])request.get("jsonRequest"))[0]);
		String sessionID = ((String[])request.get("sessionID"))[0];
		String verificationCode = ((String[])request.get("verificationID"))[0];
		String tagRoot = ((String[])request.get("tagRoot"))[0];
		IBSSystem.printConsole(((String[])request.get("tagList"))[0]);
		ArrayList<String> tagList = SoapBar.jsonToArrayList(((String[])request.get("tagList"))[0]);
		
		String responseJSON = SoapBar.hashMapToJson(doSecuredESBService(sessionID, verificationCode, requestData, tagRoot, tagList));
		
        HttpServletResponse response = ServletActionContext.getResponse();
        response.setContentType("text/plain ");
        PrintWriter out = response.getWriter();
        out.print(responseJSON);
        out.flush();
        out.close();
	}

	public static HashMap<String,String> doSecuredESBService(String sessionID, String verificationCode, HashMap<String,String> requestData, String tagRoot, ArrayList<String> tagList) {
        LinkedHashMap<String,String> responseData = new LinkedHashMap<String,String>();
		
		IBSSystem.printConsole("SessionID: " + sessionID);
		
		if (sessionID == null) {
			responseData.put("status", "No sessionID Input");
			return responseData;
		}
        
		int serviceAuthCode = serviceVerification(requestData.get("OperationName"), sessionID, verificationCode);
        if(serviceAuthCode <= 0) {
            String errorMsg = "";
        	if(serviceAuthCode == 0) {
        		errorMsg = "Service Verification: Missing verification parameters";   		
            } else if(serviceAuthCode == -1) {
            	errorMsg = "Service Verification: Verification code not found/expired";
            } else if(serviceAuthCode == -2) {
            	errorMsg = "Service Verification: Verification code does not match session";
            }
        	IBSSystem.printConsole(errorMsg);
        	responseData.put("status", "ok");
            responseData.put("esbStatus", errorMsg);
            return responseData;
        } else {
            if(serviceAuthCode == 1) {
                IBSSystem.printConsole("Service Verification: Non restricted service");
            } else if(serviceAuthCode == 2) {
                IBSSystem.printConsole("Service Verification: Verification code verified");
            }
        }
		
		try {
			String customerID = Login.getSessionInfo(sessionID, "customerID");
			String bankID = Login.getSessionInfo(sessionID, "bankID");
			if(customerID == null && bankID == null) {
				throw new Exception();
			}
			requestData.put("CustomerId", customerID);
			requestData.put("bankID", bankID);
			//workaround for some soap messages where capitalisation is not standardised
			requestData.put("CustomerID", customerID);
			requestData.put("customerID", customerID);
			requestData.put("BankID", bankID);
		} catch (Exception e) {
			responseData.put("status", "sessionID doesn't exist");
			return responseData;
		}
		
		try {
			responseData = doESBService(requestData, tagRoot, tagList);
		} catch (MalformedURLException e) {
			IBSSystem.printConsole("ESBService: Error processing service call");
            responseData.put("status", "ESBService: Error processing service call");
            return responseData;
		}
		
		return responseData;
	}
	
	protected static LinkedHashMap<String,String> doESBService(HashMap<String,String> requestData, String tagRoot, ArrayList<String> tagList) throws MalformedURLException {
		LinkedHashMap<String,String> responseData = new LinkedHashMap<String,String>();
		
		IBSSystem.printConsole("Request Data: " + requestData);
		IBSSystem.printConsole("TagRoot: " + tagRoot);
		IBSSystem.printConsole("TagList: " + tagList);
		
		if (requestData == null) {
			responseData.put("status", "No Request Data");
			return responseData;
		}
		
		if (tagRoot == null) {
			responseData.put("status", "No tagRoot Input");
			return responseData;
		}
		
		if (tagList == null) {
			responseData.put("status", "No tagList Input");
			return responseData;
		}
		
		String operationName = requestData.get("OperationName");
		
		if(operationName == null) {
			responseData.put("status", "Operation Name missing");
			return responseData;
		}
		
		if(requestData.get("ServiceDomain") == null) {
			responseData.put("status", "Service Domain missing");
			return responseData;
		}
		
		IBSSystem.printConsole("Operation Name: " + operationName);
		
		String soapmsg = CtrlContainer.getSoapBar().createSoapMessage(requestData, operationName);
		if (soapmsg == null) {
			responseData.put("status", "IBS: is drowning in soap");
			return responseData;
		}
		IBSSystem.printConsole(soapmsg);
		String soapResponse = Network.postToESB(soapmsg);
		IBSSystem.printConsole(soapResponse);
		responseData = Bubble.scrubBubble(soapResponse, tagRoot, tagList);
		IBSSystem.printConsole(responseData);
		
		if (responseData.isEmpty()){
			responseData.put("status", "no response");
		} else {
			responseData.put("status", "ok");
		}
		
		return responseData;
	}
    
    private static int serviceVerification(String operationName, String sessionID, String verificationCode) {
    	HashSet<String> restrictedServicesList = IBSProperties.getRestrictedServicesList();
    	if(!restrictedServicesList.contains(operationName)) {
            return 1;
        } else {
            if(sessionID == "" || verificationCode == "" || sessionID == null || verificationCode == null) {
                return 0;
            }
            
            String retrievedSessionID = "";
            try {
                Tuple key = Tuple.create();
                key.put("verificationCode",verificationCode);
                Tuple result = CtrlContainer.getAsc().get(VERIAPPROVALTABLENAME,key);
                if(result == null) {
                    throw new Exception();
                } else {
                    retrievedSessionID = result.getString("sessionID");
                }
            } catch(Exception e) {
                return -1;
            }
            
            if(sessionID.equals(retrievedSessionID)) {
                return 2;
            } else {
                return -2;
            }
        }
    }
	
}
