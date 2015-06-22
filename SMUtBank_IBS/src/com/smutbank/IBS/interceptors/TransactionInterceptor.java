package com.smutbank.IBS.interceptors;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import org.apache.struts2.ServletActionContext;

import com.opensymphony.xwork2.ActionInvocation;
import com.opensymphony.xwork2.interceptor.Interceptor;
import com.smutbank.IBS.actions.IBSSystem;
import com.smutbank.IBS.props.IBSProperties;
import com.smutbank.IBS.services.SoapBar;

public class TransactionInterceptor implements Interceptor {

	private static final long serialVersionUID = 1L;

	@Override
	public void destroy() {
		IBSSystem.printConsole("Transaction Interceptor is destroyed");

	}

	@Override
	public void init() {
		IBSSystem.printConsole("Transaction Interceptor Started");

	}

	@Override
	public String intercept(ActionInvocation invocation) throws Exception {
		IBSSystem.printConsole("In transaction interceptor!");
		
		//Get the session object to access the sessionID
		Map<String,Object> session = invocation.getInvocationContext().getSession();
		
		//Get the channel to determine if its sessionless or session based
		String channel = null; 
		String sessionID = null;
		
		//Init channel settings
		String[] sessionlessChannels = IBSProperties.getIBSProp("SessionlessChannels").split(","); 
		String[] sessionBasedChannels = IBSProperties.getIBSProp("SessionBasedChannels").split(","); 
		//Get the channel from the request
		try {
			channel = getRequestParam(invocation, "channel");
			if(channel == null || channel.length() == 0) {
				throw new Exception();
			}
		} catch(Exception e) {
			IBSSystem.printConsole("Channel not defined, rejecting request");
			sendResponse(getStatusResponse("Channel not defined"));
			return null;
		}
		
		//Determine the sessionType
		if(Arrays.asList(sessionlessChannels).indexOf(channel) >= 0) {
			IBSSystem.printConsole("Sessionless Channel: " + channel);
			addRequestParam(invocation, "sessionType", "sessionless");
			sessionID = getRequestParam(invocation, "sessionID");
		} else if(Arrays.asList(sessionBasedChannels).indexOf(channel) >= 0) {
			IBSSystem.printConsole("Session Based Channel: " + channel);
			addRequestParam(invocation, "sessionType", "sessionBased");
			sessionID = (String) session.get("sessionID");
			addRequestParam(invocation, "sessionID", sessionID);
		} else {
			IBSSystem.printConsole("Channel unknown, rejecting request");
			sendResponse(getStatusResponse("Channel not defined"));
			return null;
		}
		
		//If no sessionID is specified, must be a login in transaction
		if(sessionID == null || sessionID.length() == 0) {
			sessionID = "IBS Login transactions";
		}
		
		LinkedHashMap<String,String> requestData = (getRequestParam(invocation, "jsonRequest") == null)? new LinkedHashMap<String,String>():SoapBar.jsonToHashMap(getRequestParam(invocation, "jsonRequest"));
		requestData.put("ConsumerID", channel);
		requestData.put("TransactionID", sessionID);
		requestData.put("CacheEnabled", "false");
		addRequestParam(invocation, "jsonRequest", SoapBar.hashMapToJson(requestData));
		//IBSSystem.printConsole(getRequestParam(invocation, "jsonRequest"));
		IBSSystem.printConsole(channel + " ESB request received");
		return invocation.invoke();
	}
	
	private String getRequestParam(ActionInvocation invocation, String paramName) {
		Object varr =  invocation.getInvocationContext().getParameters().get(paramName);
		if (varr == null) {
			return null;
		} else {
			return ((String[]) varr)[0];
		}
	}
	
	private String getStatusResponse(String statusMsg) {
		HashMap<String,String> responseData = new HashMap<String,String>();
		responseData.put("status", statusMsg);
		return SoapBar.hashMapToJson(responseData);
	}
	
	private void addRequestParam(ActionInvocation invocation, String paramName, String parmValue) {
		Map<String,Object> request = invocation.getInvocationContext().getParameters();
		String[] param = {parmValue};
		request.put(paramName, (Object)param);
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
