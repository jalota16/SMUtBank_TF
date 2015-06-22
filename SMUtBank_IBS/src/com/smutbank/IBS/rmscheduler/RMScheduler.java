package com.smutbank.IBS.rmscheduler;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;

import com.smutbank.IBS.actions.IBSSystem;
import com.tibco.as.space.Tuple;

public class RMScheduler {
	
	private static AppointmentManager apm = new AppointmentManager();
	private final static String openingHours = "09:00:00";
	private final static  String closingHours = "18:00:00";
	private final static String wkendClosingHours = "13:00:00";
	
	//for testing
	public static Tuple getAppointment(String rmID, String sDateTime) throws ParseException{
		//return apm.returnCustomerAppointment(customerID, sDateTime);
		return apm.returnRMAppointment(rmID, sDateTime);
	}
	//for testing
	public static ArrayList<Tuple> apptsByID(String rmID, String sDT, String eDT){
		return apm.returnAppointmentsByRM(rmID, sDT, eDT);
	}
	
	public static boolean createAppointment (String customerID, String startDateTime, String endDateTime, String loanData){
		boolean success = false;
		if(isSlotValid(startDateTime,endDateTime)){
			
			//check how busy RM is in the day
			Date startDate = dateParser(startDateTime, "date");
			Date endDate = new Date(startDate.getTime() +(1000 * 60 * 60 * 24));
					
			//create ranking for the RMs & assign slot
			ArrayList<String> rankedList = new ArrayList<String> ();
			try {
				rankedList = rankRM(apm.retrieveAllRM(), startDate, endDate);
			} catch (Exception e1) {
				// TODO Auto-generated catch block
				IBSSystem.printConsole("cannot retrieve and rank RM");
			}
			
			//look for RMs available during the slot
			Date sDateTime = dateParser(startDateTime, "dateTime");
			Date eDateTime = dateParser(endDateTime, "dateTime");
			
			String rm = null;
			
			
			for(String rmID: rankedList){
				if(isRMAvailable(rmID,sDateTime, eDateTime)){
					rm = rmID;
					break;
				}
			}
			
			//create new appointment
			try {
				apm.createAppointment(customerID, rm, startDateTime, endDateTime, loanData);
				success = true;
			} catch (Exception e){
				e.printStackTrace();
			}
		}else{
			IBSSystem.printConsole("Slot is invalid");
		}
		return success;
	}
	//edit existing appointment
	public static boolean updateAppointment(String custID, String currentStartDT, String newStartDT, String newEndDT, String loanData) throws ParseException{
	
		boolean success = false;
		try{
			//delete existing appointment
			boolean delStatus = deleteAppointment(custID,currentStartDT);
			boolean createStatus = createAppointment(custID, newStartDT, newEndDT, loanData);
			
			if(delStatus && createStatus){
				success = true;
			}
		}catch(Exception e){
			e.printStackTrace();
		}
		return success;
	}
	//delete existing appointment
	public static boolean deleteAppointment(String custID, String startDateTime) throws ParseException{

		boolean success = false;
		try{
			success = apm.deleteAppointment(custID, startDateTime);
		}catch(Exception e){
			e.printStackTrace();
		}
		return success;
	}
	//retrieve all customer appointments
	public static ArrayList<Tuple> retrieveAppointments(String custID, String startDateTime, String endDateTime) throws ParseException{
		return apm.returnAppointmentsByCustomer(custID, startDateTime, endDateTime);
	}
	//retrieve all the invalid slots i.e all RMs are busy during those slots
	public static HashMap<String, String> getInvalidSlots(String startDateTime, String endDateTime){

		HashMap<String, String> invalidList = new HashMap<String, String> ();
		ArrayList<String> invalidTemp = new ArrayList<String> ();
		
		//retrieve list of all the rm
		ArrayList<String> rmList = apm.retrieveAllRM();
		//start with the first rm
		String rmID = rmList.get(0);
		
		Date sDateTime = dateParser(startDateTime,"dateTime");
		Date eDateTime = dateParser(endDateTime,"dateTime");
		
		try{
			ArrayList<Tuple> appointments = apm.returnAppointmentsByRM(rmID, sDateTime.toString(), eDateTime.toString());
			//IBSSystem.printConsole("rmID: " + rmID +  ", size: " + appointments.size());
			for(Tuple t: appointments){
				boolean available = false;
				
				//retrieve appointment start and end time
				String start = t.get("startTime").toString();
				String end = t.get("endTime").toString();
				
				Date sDT = dateParser(start,"dateTime");
				Date eDT = dateParser(end,"dateTime");
				
				for(int i = 1; i < rmList.size(); i++){
					
					String rmgrID = rmList.get(i);
					//if one rm is available, slot will become available
					IBSSystem.printConsole("start: " + sDT + ", end: " + eDT);
					IBSSystem.printConsole("rmgrID: " + rmgrID + ", available: " + isRMAvailable(rmgrID,sDT,eDT));
					
					if(isRMAvailable(rmgrID,sDT,eDT)){
						available = true;
						break;
					}
				}
				IBSSystem.printConsole("out of loop");
				if(available == false){
					IBSSystem.printConsole("added: " + start);
					invalidTemp.add(start);
				}
			}
			
			//populate hashmap
			invalidList.put("invalidSlots.length", Integer.toString(invalidTemp.size()));
			for(int i = 0; i < invalidTemp.size(); i++){
				int objNo = i + 1;
				String keyStart = "invalidSlots" + objNo + ".startDateTime";
				String keyEnd = "invalidSlots" + objNo + ".endDateTime";
				
				String iStart = invalidTemp.get(i);
				
				Date invalidStart = dateParser(iStart,"dateTime");
				
				Calendar cal = Calendar.getInstance();
				
				cal.setTime(invalidStart);
				cal.add(Calendar.HOUR_OF_DAY, 1);
				
				invalidList.put(keyStart, iStart);
				
				DateFormat df = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
				
				invalidList.put(keyEnd, df.format(cal.getTime()));
			}
		}catch(Exception e){
			e.printStackTrace();
		}
		
		return invalidList;
	}
	private static ArrayList<String> rankRM(ArrayList<String> allRM, Date startDate, Date endDate) throws ParseException{
		
		HashMap<String, Integer> hm = new HashMap<String, Integer>();
		
		for(String rmID : allRM){
			ArrayList<Tuple> apptList = apm.returnAppointmentsByRM(rmID, startDate.toString(), endDate.toString());
			hm.put(rmID,apptList.size());
		}
		
		//sort list of RMs according to no.of appointments(least busy to most busy)
		ArrayList<String> orderedList = new ArrayList<String> ();
		List keys = new ArrayList(hm.keySet());
	    List values = new ArrayList(hm.values());
	    
		Collections.sort(keys);
		Collections.sort(values);
		
		Iterator valueIter = values.iterator();
	    
	    while(valueIter.hasNext()){
	    	Object val = valueIter.next();
	    	Iterator keyIter = keys.iterator();
	    	
	    	while(keyIter.hasNext()){
	    		Object key = keyIter.next();
	    		String val1 = hm.get(key).toString();
	            String val2 = val.toString();
	            
	            if(val1.equals(val2)){
	            	hm.remove(key);
	                keys.remove(key);
	                orderedList.add((String)key);
	                break; 
	            }
	    	}
	    }
	    return orderedList;
	}
	private static boolean isSlotValid(String startDateTime, String endDateTime){
		boolean valid = false;
		
		//Date startDate = dateParser(startDateTime, "date");
		Date sDateTime = dateParser(startDateTime, "dateTime");
		Date eDateTime = dateParser(endDateTime, "dateTime");
		
		//check if end date after start date
		if(eDateTime.after(sDateTime)){
			//checks if weekend or weekday
			Calendar start = Calendar.getInstance();
	    	start.setTime(sDateTime);
	    	int day = start.get(Calendar.DAY_OF_WEEK);
	    
	    	//get ending time (Calendar)
	    	Calendar end = Calendar.getInstance();
	    	end.setTime(eDateTime);
	    	
	    	Date opening = dateParser(openingHours, "time");
    		Calendar openingTime = Calendar.getInstance();
    		openingTime.setTime(opening);
    	
    		int dayOfMonth = start.get(Calendar.DAY_OF_MONTH);
    		int month = start.get(Calendar.MONTH);
    		int year = start.get(Calendar.YEAR);
    		
    		openingTime.set(year, month, dayOfMonth);
    		
	    	if(day == 1 || day == 7){
	    		
	    		Date closing = dateParser(wkendClosingHours, "time");
	    		Calendar closingTime = Calendar.getInstance();
	    		closingTime.setTime(closing);
	    		
	    		closingTime.set(year, month, dayOfMonth);
	    		
	    		//get the opening and closing time
	    		IBSSystem.printConsole("start: " + start.compareTo(openingTime) + ",end: " +  end.compareTo(closingTime));
	    		if(start.compareTo(openingTime) >= 0 && end.compareTo(closingTime) <= 0){
	    			valid = true;
	    		}
	    	}else{
	    		Date closing = dateParser(closingHours, "time");
	    		Calendar closingTime = Calendar.getInstance();
	    		closingTime.setTime(closing);
	    		
	    		closingTime.set(year, month, dayOfMonth);
	    		
	    		IBSSystem.printConsole("start: " + sDateTime + " " + start.compareTo(openingTime) + ",end: " + eDateTime + " " + end.compareTo(closingTime));
	    		
	    		if(start.compareTo(openingTime) >= 0 && end.compareTo(closingTime) <= 0){
	    			valid = true;
	    		}
	    	}
		}
    	return valid;
	}
	
	private static boolean isRMAvailable(String rmID, Date sDateTime, Date eDateTime){
		boolean available = true;
		//IBSSystem.printConsole("**isRMAvailable: rmID " + rmID + ", sDT: " + sDateTime + ",eDT: " + eDateTime );
		ArrayList<Tuple> list = apm.returnAppointmentsByRM(rmID, sDateTime.toString(), eDateTime.toString());
		
		IBSSystem.printConsole("LIST SIZE IS: " + list.size());
		for(Tuple t: list){
			
			Date eApptStart = dateParser(t.get("startTime").toString(),"dateTime");
			Date eApptEnd = dateParser(t.getString("endTime").toString(),"dateTime");
			
			
			IBSSystem.printConsole(sDateTime + ": " + sDateTime.compareTo(eApptStart) + ", " + eDateTime + ":" + eDateTime.compareTo(eApptEnd));
			if(sDateTime.compareTo(eApptStart) >= 0 && eDateTime.compareTo(eApptEnd) <=0){
				available = false;
				break;
			}else if(sDateTime.compareTo(eApptStart) <= 0 && eDateTime.compareTo(eApptStart) > 0 && eDateTime.compareTo(eApptEnd) <= 0){
				available = false;
				break;
			}else if(sDateTime.compareTo(eApptStart) >= 0 && sDateTime.compareTo(eApptEnd) < 0 && eDateTime.compareTo(eApptEnd) >= 0){
				available = false;
				break;
			}else if(sDateTime.compareTo(eApptStart) <=0 && eDateTime.compareTo(eApptEnd) >= 0){
				available = false;
				break;
			}
		}
		
		return available;
	}
	
	private static Date dateParser(String date, String formatType){
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
	
}
