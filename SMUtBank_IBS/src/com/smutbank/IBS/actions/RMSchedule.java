package com.smutbank.IBS.actions;

import java.io.IOException;
import java.io.PrintWriter;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import org.apache.struts2.ServletActionContext;
import org.apache.struts2.interceptor.ParameterAware;
import org.bouncycastle.asn1.ocsp.ResponseData;

import com.opensymphony.xwork2.ActionContext;
import com.opensymphony.xwork2.ActionInvocation;
import com.opensymphony.xwork2.ActionSupport;
import com.smutbank.IBS.services.CtrlContainer;
import com.smutbank.IBS.services.SoapBar;
import com.tibco.as.space.Tuple;
import com.smutbank.IBS.rmscheduler.RMScheduler;

public class RMSchedule extends ActionSupport implements ParameterAware{
	
	private Map parameters;
	
	public void ajaxCreateRMAppointment() {
		
		LinkedHashMap<String,String> requestData = SoapBar.jsonToHashMap(getRequestParam("jsonRequest"));
	
		String sessionID = requestData.get("TransactionID");
		String customerID = Login.getSessionInfo(sessionID, "customerID");
		boolean status = RMScheduler.createAppointment(customerID, requestData.get("startDateTime"), requestData.get("endDateTime"), requestData.get("loanData"));
		
		//Boolean status = RMScheduler.createAppointment("45678", "19/11/2013 15:30:00", "19/11/2013 16:30:00", "loan6");
		LinkedHashMap<String,String> responseData = new LinkedHashMap<String,String>();
		responseData.put("status", "ok");
		if(status) {
			responseData.put("esbStatus", "Appointment created");
		} else {
			responseData.put("esbStatus", "Error creating appointment");
		}
		sendResponse(SoapBar.hashMapToJson(responseData));
	}
	public void ajaxUpdateRMAppointment() throws ParseException {
		LinkedHashMap<String,String> requestData = SoapBar.jsonToHashMap(getRequestParam("jsonRequest"));
		String sessionID = requestData.get("TransactionID");
		String customerID = Login.getSessionInfo(sessionID, "customerID");
		boolean status = RMScheduler.updateAppointment(customerID, requestData.get("currentStartDateTime"), requestData.get("newStartDateTime"), requestData.get("newEndDateTime"), requestData.get("loanData"));
		//Boolean status = RMScheduler.updateAppointment("12345", "19/11/2013 15:30:00", "25/11/2013 15:30:00", "25/11/2013 16:30:00", "updatedLoan5");
		LinkedHashMap<String,String> responseData = new LinkedHashMap<String,String>();
		if(status) {
			//responseData.put("status", "RM Appointment updated successfully");
			responseData.put("status", "invocation successful");
		} else {
			responseData.put("status", "Error updating appointment");
		}
		sendResponse(SoapBar.hashMapToJson(responseData));
	}
	public void ajaxDeleteRMAppointment() throws ParseException {
		LinkedHashMap<String,String> requestData = SoapBar.jsonToHashMap(getRequestParam("jsonRequest"));
		String sessionID = requestData.get("TransactionID");
		String customerID = Login.getSessionInfo(sessionID, "customerID");
		boolean status = RMScheduler.deleteAppointment(customerID, requestData.get("startDateTime"));
		//Boolean status = RMScheduler.deleteAppointment("34567", "19/11/2013 10:00:00" );
		LinkedHashMap<String,String> responseData = new LinkedHashMap<String,String>();
		responseData.put("status", "ok");
		
		if(status) {
			responseData.put("esbStatus", "Appointment deleted");
		} else {
			responseData.put("esbStatus", "Error deleting appointment");
		}
		sendResponse(SoapBar.hashMapToJson(responseData));
	}
	public void ajaxGetAllAppointments() throws ParseException {
		LinkedHashMap<String,String> requestData = SoapBar.jsonToHashMap(getRequestParam("jsonRequest"));
		String sessionID = requestData.get("TransactionID");
		String customerID = Login.getSessionInfo(sessionID, "customerID");
		ArrayList<Tuple> apptList = RMScheduler.retrieveAppointments(customerID,requestData.get("startDateTime"), requestData.get("endDateTime"));
		//ArrayList<Tuple> apptList = RMScheduler.retrieveAppointments("12345", "17/11/2013 15:00:00", "25/12/2013 18:00:00");
		LinkedHashMap<String,String> responseData = new LinkedHashMap<String,String>();
		responseData.put("status", "ok");
		
		if(apptList.size() == 0){
			responseData.put("esbStatus", "No appointments found");
		}else{
			for(int i = 1; i <= apptList.size(); i++){
				Tuple appt = apptList.get(i - 1);
				responseData.put("appt" + i + ".startTime", appt.get("startTime").toString());
				responseData.put("appt" + i + ".endTime", appt.get("endTime").toString());
				responseData.put("appt" + i + ".rmID", appt.get("rmID").toString());
			}
			responseData.put("appt.length", "" + apptList.size());
			responseData.put("esbStatus", "invocation successful");
		}
		sendResponse(SoapBar.hashMapToJson(responseData));
	}
	public void ajaxGetInvalidSlots(){
		LinkedHashMap<String,String> requestData = SoapBar.jsonToHashMap(getRequestParam("jsonRequest"));;
		HashMap<String, String> responseData = RMScheduler.getInvalidSlots(requestData.get("startDateTime"), requestData.get("endDateTime"));
		responseData.put("status", "ok");
		//HashMap<String, String> invalidList = RMScheduler.getInvalidSlots("17/11/2013 15:00:00", "25/12/2013 18:00:00");
		
		if(responseData.size() == 1){
			responseData.put("esbStatus", "No invalid appointments");
		} else {
			responseData.put("esbStatus", "invocation successful");
		}
		sendResponse(SoapBar.hashMapToJson(responseData));
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

	@Override
	public void setParameters(Map paramMap) {
		parameters = paramMap;
	}
		
}
