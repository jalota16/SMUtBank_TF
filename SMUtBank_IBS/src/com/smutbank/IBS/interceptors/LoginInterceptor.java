package com.smutbank.IBS.interceptors;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import org.apache.struts2.ServletActionContext;

import com.opensymphony.xwork2.ActionContext;
import com.opensymphony.xwork2.ActionInvocation;
import com.opensymphony.xwork2.interceptor.Interceptor;
import com.opensymphony.xwork2.util.ValueStack;
import com.smutbank.IBS.actions.IBSSystem;
import com.smutbank.IBS.props.IBSProperties;
import com.smutbank.IBS.services.ASController;
import com.smutbank.IBS.services.CtrlContainer;
import com.smutbank.IBS.services.SoapBar;
import com.tibco.as.space.Tuple;

public class LoginInterceptor implements Interceptor{

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	public void destroy() {
		IBSSystem.printConsole("Login Interceptor is destroyed");
	}
	
	public void init() {
		IBSSystem.printConsole("Login Interceptor Started");
	}
	
	@Override
	public String intercept(ActionInvocation invocation) throws Exception {
		IBSSystem.printConsole("In login interceptor!");
		
		//Init params
		Map<String,Object> session = invocation.getInvocationContext().getSession();
		Map<String,Object> request = invocation.getInvocationContext().getParameters();
		String sessionID = null;
		String channel = null; 
		
		//Init channel settings
		String[] sessionlessChannels = IBSProperties.getIBSProp("SessionlessChannels").split(","); 
		String[] sessionBasedChannels = IBSProperties.getIBSProp("SessionBasedChannels").split(","); 
		String sessionType = null;
		
		//Get the channel from the request
		try {
			channel = ((String[]) request.get("channel"))[0];
		} catch(Exception e) {
			IBSSystem.printConsole("Channel not defined, rejecting request");
			sendResponse(getStatusResponse("Channel not defined"));
			return null;
		}
		
		//Determine the sessionType
		if(Arrays.asList(sessionlessChannels).indexOf(channel) >= 0) {
			IBSSystem.printConsole("Sessionless Channel: " + channel);
			sessionType = "sessionless";
			sessionID = ((String[]) request.get("sessionID"))[0];
		} else if(Arrays.asList(sessionBasedChannels).indexOf(channel) >= 0) {
			IBSSystem.printConsole("Session Based Channel: " + channel);
			sessionType = "sessionBased";
			sessionID = (String) session.get("sessionID");
			addRequestParam(invocation, "sessionID", sessionID);
		} else {
			IBSSystem.printConsole("Channel unknown, rejecting request");
			sendResponse(getStatusResponse("Channel not defined"));
			return null;
		}
		
		//Check for existence of sessionID
		if(sessionID == null || sessionID.length() == 0) {
			sendResponse(getStatusResponse("You are not logged in, please log in before proceeding."));
			IBSSystem.printConsole("No session ID found, rejecting request");
			return null;
		} else {			
			IBSSystem.printConsole("Retrieved sessionID: " + sessionID);
		}
		
		//Check for sessionID validity
		if(!sessionType.equals("")) {
			ASController asc = CtrlContainer.getAsc();
			Tuple key = Tuple.create();
			key.put("sessionID", sessionID);
			try {
				Tuple sessionKey = asc.get("LoginSession", key);
				if(sessionKey != null) {
					asc.put("LoginSession", sessionKey);
					IBSSystem.printConsole("sessionID validated");
					return invocation.invoke();
				} else {
					IBSSystem.printConsole("sessionID expired/invalid");
					sendResponse(getStatusResponse("Your session has expired or is invalid, please log in again."));
				}
			} catch (Exception e) {
				e.printStackTrace();
				sendResponse(getStatusResponse("An error occured while validating the session"));
			}
		}
		return null;
	}
	
	private void addRequestParam(ActionInvocation invocation, String paramName, String parmValue) {
		Map<String,Object> request = invocation.getInvocationContext().getParameters();
		String[] param = {parmValue};
		request.put(paramName, (Object)param);
	}
	
	private String getStatusResponse(String statusMsg) {
		HashMap<String,String> responseData = new HashMap<String,String>();
		responseData.put("status", statusMsg);
		return SoapBar.hashMapToJson(responseData);
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
