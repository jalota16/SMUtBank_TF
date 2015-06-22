package com.smutbank.IBS.rmscheduler;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.UUID;

import com.smutbank.IBS.actions.IBSSystem;
import com.smutbank.IBS.services.CtrlContainer;
import com.tibco.as.space.DateTime;
import com.tibco.as.space.FieldDef;
import com.tibco.as.space.Tuple;
import com.tibco.as.space.FieldDef.FieldType;

public class AppointmentManager {
	
	public AppointmentManager(){
		
	}
	
	//get customer specific appointment according to identifier
	public Tuple returnCustomerAppointment(String custID, String startDateTime) throws ParseException{
		Tuple key = Tuple.create();
		
		key.put("customerID", "" + Integer.parseInt(custID));
		key.put("startTime", startDateTime);
		Tuple appointment = null;
		
		try {
			appointment = CtrlContainer.getAsc().get("RMSchedule", key);
		} catch (Exception e) {
			System.out.println("Error retrieving customer appointment");
		}
		
		return appointment;
	}
	//get all customer appointments within a period
	/*public ArrayList<Tuple> returnAppointmentsByCustomer(String customer_ID, String startDateTime, String endDateTime){
		//retrieve appointments of specific customer_ID
		ArrayList<Tuple> appointments = new ArrayList<Tuple> ();
		ArrayList<Tuple> tempAppointments = new ArrayList<Tuple> ();
		ArrayList<Tuple> sortedAppts = new ArrayList<Tuple> ();
		
		int cID = Integer.parseInt(customer_ID);
		String filter = "customerID = " + cID;
		try {
			appointments = CtrlContainer.getAsc().filter("RMSchedule", filter);
		} catch (Exception e) {
			System.out.println("Error filtering by customerID");
			return null;
		}
		for(Tuple appt: tempAppointments){
			if(appt.get("customerID").toString().equals(customer_ID)){
				appointments.add(appt);
			}
		}

		Date start = dateParser(startDateTime,"dateTime");
		Date end = dateParser(endDateTime,"dateTime");
		//retrieve appointments within specific date
		for(Tuple t: appointments){
			Date apptStartDate = dateParser(t.get("startTime").toString(),"dateTime");
			Date apptEndDate = dateParser(t.get("endTime").toString(), "dateTime");
			if(apptStartDate.compareTo(start) >= 0 && apptEndDate.compareTo(end) <= 0){
				sortedAppts.add(t);
			}
		}
		return sortedAppts;
	}*/
	//get all customer appointments within a period
	public ArrayList<Tuple> returnAppointmentsByCustomer(String customer_ID, String startDateTime, String endDateTime){
		//retrieve appointments of specific customer_ID
		ArrayList<Tuple> appointments = new ArrayList<Tuple> ();
		ArrayList<Tuple> sortedAppts = new ArrayList<Tuple> ();
		
		int cID = Integer.parseInt(customer_ID);
		String filter = "customerID = " + cID;
		try {
			appointments = CtrlContainer.getAsc().filter("RMSchedule", filter);
		} catch (Exception e) {
			System.out.println("Error filtering by customerID");
			return null;
		}
		IBSSystem.printConsole("appt size: " + appointments.size());

		Date start = dateParser(startDateTime,"dateTime");
		Date end = dateParser(endDateTime,"dateTime");
		//retrieve appointments within specific date
		for(Tuple t: appointments){
			Date apptStartDate = dateParser(t.get("startTime").toString(),"dateTime");
			Date apptEndDate = dateParser(t.get("endTime").toString(), "dateTime");
			if(apptStartDate.compareTo(start) >= 0 && apptEndDate.compareTo(end) <= 0){
				sortedAppts.add(t);
			}
		}
		
		return sortedAppts;
	}
	//get all appointments which RM has between a period
	public ArrayList<Tuple> returnAppointmentsByRM(String rmID, String startDate, String endDate){
		//retrieve appointments of specific rmID
		ArrayList<Tuple> appointments = new ArrayList<Tuple> ();
		ArrayList<Tuple> sortedAppts = new ArrayList<Tuple> ();
		
		Date start = dateParser(startDate, "stringToDate");
		Date end = dateParser(endDate,"stringToDate");
		
		//testing
		//Date start = dateParser(startDate, "dateTime");
		//Date end = dateParser(endDate,"dateTime");
		
		//String filter = "rmID != " + rmID;
		String filter = "rmID != " + rmID;
		try {
			appointments = CtrlContainer.getAsc().filter("RMSchedule", filter);
		} catch (Exception e) {
			IBSSystem.printConsole("Error filtering by rmID");
			return null;
		}
		
		//retrieve appointments within specific date
		for(Tuple t: appointments){
			Date apptStartDate = dateParser(t.get("startTime").toString(),"dateTime");
			Date apptEndDate = dateParser(t.get("endTime").toString(), "dateTime");
			
			
			if(t.get("rmID").toString().equals(rmID)){
				//IBSSystem.printConsole("test: " + start + " compareto : " + apptStartDate);
				//IBSSystem.printConsole("test: " + end + " compareto : " + apptEndDate);
				//IBSSystem.printConsole("Start: " + apptStartDate.compareTo(start) + ",end: " + apptEndDate.compareTo(end));
				if(apptStartDate.compareTo(start) >= 0 && apptEndDate.compareTo(end) <= 0){
					sortedAppts.add(t);
				}
			}
		}
		return sortedAppts;
	}
	//get rm specific appointment according to identifier
	public Tuple returnRMAppointment(String custID, String startDateTime) throws ParseException{
		Tuple key = Tuple.create();
			
		key.put("rmID", custID);
		key.put("startTime", startDateTime);
		Tuple appointment = null;
			
		try {
			appointment = CtrlContainer.getAsc().get("RMSchedule", key);
		} catch (Exception e) {
			IBSSystem.printConsole("Error retrieving customer appointment");
		}
			
		return appointment;
	}
	
	public static Date dateParser(String date, String formatType){
		DateFormat dtFormatter = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
		DateFormat dFormatter = new SimpleDateFormat("dd/MM/yyyy");
		DateFormat tFormatter = new SimpleDateFormat("HH:mm:ss");
		DateFormat sFormatter = new SimpleDateFormat("EEE MMM dd HH:mm:ss z yyyy");
		
		Date dt = new Date();
		
		try{
			if(formatType.equals("dateTime")){
				dt = dtFormatter.parse(date);
			}else if(formatType.equals("date")){
				dt = dFormatter.parse(date);
			}else if(formatType.equals("time")){
				dt = tFormatter.parse(date);
			}else if(formatType.equals("stringToDate")){
				dt = sFormatter.parse(date);
			}
		}catch(ParseException e){
			e.printStackTrace();
		}
		return dt;
	}
	
	public void createAppointment(String customerID, String rmID, String startDateTime, String endDateTime, String loanData) throws Exception{
		//create new record
		Tuple newAppt = Tuple.create();	
		
		//update database
		newAppt.put("customerID", "" + Integer.parseInt(customerID));
		newAppt.put("rmID", rmID);
		newAppt.put("startTime", startDateTime);
		newAppt.put("endTime", endDateTime);
		newAppt.put("loanData", loanData);
		
		try {
			CtrlContainer.getAsc().put("RMSchedule", newAppt);
			IBSSystem.printConsole("New appointment created");
		} catch (Exception e) {
			e.printStackTrace();
			IBSSystem.printConsole("Error creating appointment");
			throw new Exception();
		}
		
	}
	public boolean deleteAppointment(String customerID, String startDateTime){
		boolean success = false;
		//create key (customerID, startDateTime)
		Tuple key = Tuple.create();
		
		key.put("customerID", "" + Integer.parseInt(customerID));
		key.put("startTime", startDateTime);
		
		try {
			boolean deletion = CtrlContainer.getAsc().delete("RMSchedule", key);
			IBSSystem.printConsole("Customer Appointment successfully deleted");
			success = deletion;
		} catch (Exception e) {
			IBSSystem.printConsole("Error deleting customer appointment");
		}
		return success;
	}
	//HARDCODED RMIDs
	public ArrayList<String> retrieveAllRM(){
		ArrayList<String> rmList = new ArrayList<String> ();
		rmList.add("0000000001");
		rmList.add("0000000002");
		rmList.add("0000000003");
		
		return rmList;
	}
}
