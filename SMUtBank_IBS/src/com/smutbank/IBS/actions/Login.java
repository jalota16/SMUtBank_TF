package com.smutbank.IBS.actions;

import java.io.IOException;
import java.io.PrintWriter;
import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import javax.servlet.http.HttpServletResponse;

import org.apache.struts2.ServletActionContext;
import org.apache.struts2.interceptor.SessionAware;

import com.opensymphony.xwork2.ActionContext;
import com.opensymphony.xwork2.ActionSupport;
import com.smutbank.IBS.services.ASController;
import com.smutbank.IBS.services.CtrlContainer;
import com.smutbank.IBS.services.SoapBar;
import com.smutbank.bankrevels.Crypto;
import com.tibco.as.space.DateTime;
import com.tibco.as.space.Tuple;

public class Login extends ActionSupport implements SessionAware {

    private static final long serialVersionUID = 1L;
    protected final static String LOGINTRANSACTIONTABLENAME = "LoginTransaction";
    protected final static String LOGINSESSIONTABLENAME = "LoginSession";
    protected final static String LOGINSESSIONNOTIFICATIONTABLENAME = "LoginSessionNotification";

    private static Map<String, Object> session;

    public void setSession(Map session) {
        Login.session = session;
    }
    
    //--------------------- Refresh Session

    public void refreshSession() throws Exception {
        sendAjaxStatus("success");
    }

    //--------------------- Logout Receivers

    public void rmbInvalidateSession() throws Exception {
        HashMap<String,String> responseData = doInvalidateSession(getRequestParam("sessionID"));
        IBSSystem.printConsole(responseData.get("status"));
        sendResponse(SoapBar.hashMapToJson(responseData));
    }

    public void ribInvalidateSession() throws Exception {
        IBSSystem.printConsole("RIB Logging out");
        doInvalidateSession((String)session.get("sessionID"));

        //Remove session data on logout
        session.put("sessionID", "");
        session.put("username", "");
        session.put("PIN", "");
        sendAjaxStatus("success");
    }

    //--------------------- RIB SMS OTP Receivers

    public void createRibSMSOTPTransaction() throws Exception {
        HashMap<String,String> requestData = getJsonRequest();
        String username = requestData.get("LoginID");
        String PIN = requestData.get("Pin");

        if(username == null || PIN == null) {
            sendAjaxStatus("Invalid sequence, please login first");
        }

        if(username == "" || PIN == "") {
            sendAjaxStatus("Username and/or password cannot be blank");
        }

        //Store username and PIN in session for 2FA use
        session.put("username", username);
        session.put("PIN", PIN);

        requestData.put("ServiceDomain", "Party");
        requestData.put("OperationName", "Party_Login_2FAPIN_Create");

        HashMap<String,String> responseData = new HashMap<String,String>();
        try {
            responseData = doSMSOTPLoginTransaction(requestData);
            if(responseData.get("Message1") == null) {
            	sendAjaxESBStatus("Unable to authenticate, service error");
            	return;
            }
            if(responseData.get("Message1").equalsIgnoreCase("success")) {
                sendAjaxESBStatus("Authenticated");
            } else {
                sendAjaxESBStatus("Invalid username and/or password");
            }
        } catch(Exception e) {
            sendAjaxStatus("Unable to contact tBank server");
        }
    }

    public void createRibSMSOTPSession() throws Exception {
        HashMap<String,String> requestData = getJsonRequest();

        if((String)session.get("username") == null) {
            sendAjaxStatus("Login timeout, please login again");
        }

        requestData.put("LoginID", (String)session.get("username"));
        requestData.put("ServiceDomain", "Party");
        requestData.put("OperationName", "Party_Login_Authenticate");

        HashMap<String,String> responseData = new HashMap<String,String>();
        try {
            responseData =  doSMSOTPLoginSession(requestData, true);
            String sessionID = responseData.get("sessionID");
            IBSSystem.printConsole("RIB SMS Login with sessionID: " + sessionID);
            session.put("sessionID", sessionID);
            ArrayList<String> parameters= new ArrayList<String>();
            parameters.add("sessionID");
            parameters.add(sessionID);
            storeCustomerName(sessionID);
            sendAjaxESBStatus("Authenticated", parameters);
        } catch(Exception e) {
            sendAjaxESBStatus("Invalid SMS OTP entered");
        }
    }

//    public void directRIBLogin() throws Exception {
//        String sessionID = createNewSession("208", "1");
//        session.put("sessionID", sessionID);
//        session.put("username", "ibtest");
//        session.put("PIN", "1234");
//        storeCustomerName(sessionID);
//        
//        ArrayList<String> parameters= new ArrayList<String>();
//        parameters.add("sessionID");
//        parameters.add(sessionID);
//        storeCustomerName(sessionID);
//        sendAjaxESBStatus("Authenticated", parameters);
//    }

    public void newM2FA() throws Exception{
        String sessionID = (String)session.get("sessionID");
        HashMap<String,String> requestData = new HashMap<String,String>();
        requestData.put("ConsumerID", "RIB");
        requestData.put("TransactionID", sessionID);
        requestData.put("ServiceDomain", "Party");
        requestData.put("OperationName", "Party_Login_Mobile2FA_Create2FA");
        requestData.put("CacheEnabled", "false");
        requestData.put("username", (String)session.get("username"));
        requestData.put("PIN", (String)session.get("PIN"));

        ArrayList<String> tagList = new ArrayList<String>();
        tagList.add("QR2FA");

        HashMap<String,String> responseData = ESBService.doSecuredESBService(sessionID, null, requestData, "Party_Login_Mobile2FA_Create2FAResponse", tagList);
        
        session.put("qr2fa", responseData.get("QR2FA1"));

        sendAjaxStatus("success");
    }

    //--------------------- RIB Mobile 2FA Receivers

    public void createRibMobile2FASession() throws Exception {
        LinkedHashMap<String,String> responseData = new LinkedHashMap<String, String>();
        responseData.put("status", "ok");
        String challenge = getJsonRequest().get("challenge");
        String responseText = "";

        Tuple keyset=Tuple.create();
        keyset.put("challenge", challenge);

        ASController asc = CtrlContainer.getAsc();
        try{
            Tuple loginNotification = asc.take(LOGINSESSIONNOTIFICATIONTABLENAME, keyset);
            if(loginNotification == null) {
                throw new Exception();
            }
            session.put("sessionID", loginNotification.getString("sessionID"));
            storeCustomerName(loginNotification.getString("sessionID"));
            responseData.put("message", "Authenticated");
            sendResponse(SoapBar.hashMapToJson(responseData));
            return;
        } catch(Exception e) {
            responseText = "Waiting for mobile authentication";
        }
        try {
            asc.get(LOGINTRANSACTIONTABLENAME, keyset);
        } catch (Exception e) {
            e.printStackTrace();
            responseText = "Mobile authentication time out";
        }
        responseData.put("message", responseText);
        sendResponse(SoapBar.hashMapToJson(responseData));
    }

    //--------------------- RMB Mobile 2FA Receivers

    public void createRmbMobile2FATransaction() throws Exception {
        HashMap<String,String> responseData = new HashMap<String,String>();
        try {
            HashMap<String,String> requestData = getJsonRequest();
            responseData = doMobile2FALoginTransaction(requestData);
            responseData.put("status", "ok");
            IBSSystem.printConsole(getRequestParam("channel"));
            if(getRequestParam("channel").equalsIgnoreCase("RIB")) {
                session.put("username", requestData.get("username"));
                session.put("PIN", requestData.get("PIN"));
            }
        } catch(Exception e) {
            responseData.put("status", e.getMessage());
        } finally {
            sendResponse(SoapBar.hashMapToJson(responseData));
        }
    }

    public void createRmbMobile2FASession() throws Exception {
        HashMap<String,String> responseData = new HashMap<String,String>();
        try {
            HashMap<String,String> requestData = getJsonRequest();
            responseData = doMobile2FALoginSession(requestData, Boolean.parseBoolean(requestData.get("notify")));
            responseData.put("status", "ok");
        } catch(Exception e) {
            responseData.put("status", e.getMessage());
        } finally {
            IBSSystem.printConsole(responseData);
            sendResponse(SoapBar.hashMapToJson(responseData));
        }
    }

    //------------------------- Mobile 2FA methods

    protected static HashMap<String,String> doMobile2FALoginTransaction(HashMap<String,String> requestData) throws Exception{
        String challenge = newChallenge();

        Tuple newTransaction = Tuple.create();
        newTransaction.put("username", requestData.get("username"));
        newTransaction.put("PIN", requestData.get("PIN"));
        newTransaction.put("challenge", challenge);
        newTransaction.put("lastSessionTime",DateTime.create());
        CtrlContainer.getAsc().put(LOGINTRANSACTIONTABLENAME, newTransaction);

        HashMap<String,String> responseData = new HashMap<String,String>();
        responseData.put("challenge", challenge);
        return responseData;
    }

    private HashMap<String,String> doMobile2FALoginSession(HashMap<String,String> requestData, boolean notify) throws Exception{
        ASController asc = CtrlContainer.getAsc();
        Tuple keyset=Tuple.create();
        keyset.put("challenge", requestData.get("challenge"));
        try {
            Tuple loginTransaction = asc.get(LOGINTRANSACTIONTABLENAME, keyset);
            requestData.put("username", loginTransaction.getString("username"));
            requestData.put("PIN", loginTransaction.getString("PIN"));
        } catch (Exception e) {
            throw new Exception("Login Transaction Time Out");
        }

        ArrayList<String> tagList = new ArrayList<String>();
        tagList.add("customerID");
        tagList.add("bankID");
        HashMap<String,String> response = ESBService.doESBService(requestData, "Party_Login_Mobile2FA_AuthenticateResponse", tagList);

        if (response.get("customerID1") != null){
            HashMap<String,String> responseData = new HashMap<String,String>();
            String sessionID = createNewSession(response.get("customerID1"), response.get("bankID1"));
            if(notify) {
                Tuple notification = Tuple.create();
                notification.put("challenge", requestData.get("challenge"));
                notification.put("sessionID", sessionID);
                asc.put(LOGINSESSIONNOTIFICATIONTABLENAME, notification);
            }
            responseData.put("sessionID", sessionID);
            asc.delete(LOGINTRANSACTIONTABLENAME, keyset);
            return responseData;
        } else {
            throw new Exception("Authentication failed");
        }
    }

    //---------------------------------- SMS OTP login 

    protected static HashMap<String,String> doSMSOTPLoginTransaction(HashMap<String,String> requestData) throws Exception {
        ArrayList<String> tagList = new ArrayList<String>();
        tagList.add("Message");
        HashMap<String,String> response = ESBService.doESBService(requestData, "Party_Login_2FAPIN_CreateResponse", tagList);

        return response;
    }

    protected static HashMap<String,String> doSMSOTPLoginSession(HashMap<String,String> requestData, boolean createSession) throws Exception {
        ArrayList<String> tagList = new ArrayList<String>();
        tagList.add("CustomerID");
        tagList.add("bankID");
        tagList.add("Status");
        HashMap<String,String> response = ESBService.doESBService(requestData, "Party_Login_AuthenticateResponse", tagList);

        if (response.get("CustomerID1") != null && response.get("Status1").equalsIgnoreCase("1")){
            HashMap<String,String> responseData = new HashMap<String,String>();
            if(createSession) {
                responseData.put("sessionID", createNewSession(response.get("CustomerID1"), response.get("bankID1")));
            } else {
                responseData.put("customerID", response.get("CustomerID1"));
            }
            return responseData;
        } else {
            IBSSystem.printConsole("SMS OTP invalid for customerID: " + response.get("CustomerID1"));
            return null;
        }
    }

    //------------------------------------- Logout

    private HashMap<String,String> doInvalidateSession(String sessionID) throws Exception {
        HashMap<String,String> responseData = new HashMap<String,String>();
        if(sessionID != null && !sessionID.isEmpty() && !sessionID.equalsIgnoreCase("null")) {
            IBSSystem.printConsole("Invalidating sessionID: " + sessionID);
            Tuple key = Tuple.create();
            key.put("sessionID", sessionID);
            if(CtrlContainer.getAsc().delete(LOGINSESSIONTABLENAME, key)) {
                responseData.put("status", "Logged out successfully.");
            } else {
                responseData.put("status", "session not found");
            }
        } else {
            responseData.put("status", "session ID not provided");
        }
        return responseData;
    }

    //------------------------------------------- Util

    public static String getSessionInfo(String sessionID, String fieldName) {
        Tuple keyset=Tuple.create();
        keyset.put("sessionID", sessionID);
        try {
            Tuple loginSession = CtrlContainer.getAsc().get("LoginSession", keyset);
            if(loginSession == null) {
                throw new Exception();
            }
            return loginSession.getString(fieldName);
        } catch (Exception e) {
            return null;
        }
    }

    private static void storeCustomerName(String sessionID) throws MalformedURLException {
        HashMap<String,String> requestData = new HashMap<String,String>();
        requestData.put("ConsumerID", "RIB");
        requestData.put("TransactionID", "IBS Login transactions");
        requestData.put("ServiceDomain", "Party");
        requestData.put("OperationName", "Party_Customer_Read");
        requestData.put("CacheEnabled", "false");
        requestData.put("PageNumber", "1");
        requestData.put("PageSize", "1");
        ArrayList<String> tagList = new ArrayList<String>();
        tagList.add("givenName");
        tagList.add("familyName");
        HashMap<String,String> responseData = ESBService.doSecuredESBService(sessionID, null, requestData, "CDMCustomer", tagList);
        session.put("customerName", responseData.get("givenName1") + " " + responseData.get("familyName1").toUpperCase());
    }

    private static String createNewSession(String customerID, String bankID) throws Exception {
        String newSessionID = UUID.randomUUID().toString();
        Tuple newSession = Tuple.create();
        newSession.put("sessionID", newSessionID);
        newSession.put("customerID", customerID);
        newSession.put("bankID", bankID);
        newSession.put("lastSessionTime", DateTime.create());
        CtrlContainer.getAsc().put(LOGINSESSIONTABLENAME,newSession);
        return newSessionID;
    }

    private static String newChallenge(){
        return Crypto.getRandomHexString(32);
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

    private String getRequestParam(String paramName) {
        Map request= ActionContext.getContext().getParameters();
        try {
            return ((String[])request.get(paramName))[0];
        } catch(Exception e) {
            return null;
        }
    }

    private void sendAjaxStatus(String status) throws IOException{
        HashMap<String,String> input = new HashMap<String,String>();
        input.put("status", status);
        sendResponse(SoapBar.hashMapToJson(input));
    }

    private void sendAjaxESBStatus(String esbStatus) throws IOException{
        sendAjaxESBStatus(esbStatus, new ArrayList<String>() );
    }

    private void sendAjaxESBStatus(String esbStatus, ArrayList<String> keyValues) throws IOException{
        HashMap<String,String> input = new HashMap<String,String>();
        input.put("status", "ok");
        input.put("esbStatus", esbStatus);
        for (int  i = 0 ; i < keyValues.size() ; i+=2  ){
            input.put(keyValues.get(i), keyValues.get(i+1));    
        }
        sendResponse(SoapBar.hashMapToJson(input));
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
