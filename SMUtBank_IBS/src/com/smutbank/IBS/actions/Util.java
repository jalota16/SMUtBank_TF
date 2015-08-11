package com.smutbank.IBS.actions;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletResponse;

import net.glxn.qrgen.QRCode;
import net.glxn.qrgen.image.ImageType;

import org.apache.commons.io.FileUtils;
import org.apache.struts2.ServletActionContext;
import org.apache.struts2.interceptor.ParameterAware;
import org.apache.struts2.interceptor.SessionAware;

import com.opensymphony.xwork2.ActionSupport;
import com.smutbank.IBS.props.IBSProperties;
import com.smutbank.IBS.services.SoapBar;
import com.smutbank.bankrevels.Crypto;

public class Util extends ActionSupport implements ParameterAware, SessionAware {

	private static final long serialVersionUID = 1L;
	private Map parameters;
	private static Map<String, Object> session;
	
	public void setSession(Map session) {
		Util.session = session;
	}
	
	public void getQRCode() {
		String qrcode = (String)session.get("qr2fa");
		session.remove("qr2fa");
		sendResponse(qrcode);
	}
	
	public void getCustomerName() {
		sendResponse((String)session.get("customerName"));
		//System.out.println("Here it is customerName: "+(String)session.get("customerName"));
		//System.out.println("Here it is: "+(String)session.get("bankID"));
		
	}
	
	public void generateKey() throws IOException{
		String PIN = getRequestParam("PIN");
		String salt = getRequestParam("salt");
		
		String key= Crypto.getSCryptKey(PIN, salt, (int)Math.pow(2, 14), 8, 1, 32);
		HashMap<String,String> map = new HashMap<String,String>();
		map.put("key", key);
		key = SoapBar.hashMapToJson(map);
		sendResponse(key);
	}
	
	public void encodeQR() {
		int height = Integer.parseInt(getRequestParam("height"));
		String content = getRequestParam("content");
		String ecl = (getRequestParam("ecl") == null || getRequestParam("ecl").equals(""))? "M" : getRequestParam("ecl").trim().toUpperCase();
		
		sendImageResponse(QRCode.from(content).to(ImageType.PNG).withCharset("UTF-8").withErrorCorrectionLevel(ecl).withSize(height, height).stream());
	}
	
	public void generateAccountStatement(){
		try {
			String accountID = getRequestParam("accountID");
			int month = Integer.parseInt(getRequestParam("month"));
			int year = Integer.parseInt(getRequestParam("year"));
			boolean isPartial = (getRequestParam("partial") == null || getRequestParam("partial").equals(""))? false : Boolean.parseBoolean(getRequestParam("partial"));
			
			HashMap<String,String> requestData = new HashMap<String,String>();
			requestData.put("ConsumerID", "RIB");
			requestData.put("TransactionID", (String)session.get("sessionID"));
			requestData.put("ServiceDomain", "Account");
			requestData.put("OperationName", "Account_Deposit_Read");
			requestData.put("CacheEnabled", "false");
			requestData.put("accountID", accountID);
			
			ArrayList<String> tagList = new ArrayList<String>();
			tagList.add("customerID");
			HashMap<String,String> response = ESBService.doESBService(requestData, "DepositAccount", tagList);
			
			if (response.get("customerID1") != null){
				if(Integer.parseInt(response.get("customerID1")) != Integer.parseInt(Login.getSessionInfo((String)session.get("sessionID"), "customerID"))) {
					sendResponse("You are attempting to access an account statement that does not belong to you");
					return;
				}
			}
			
			String filename = accountID + "-" + year + "-" + month + ".pdf";
			String IBSUrl = IBSProperties.getIBSProp("RIBUrl");		// AM 20140806 //KC 20141120
			String accountStatementURL = IBSUrl+"accStatement.html?channel=RMB&name=" + (String)session.get("customerName") + "&sessionID=" + (String)session.get("sessionID") + "&account=" + accountID + "&monthYear=" + month + "-" + year + "&partial=" + isPartial;
			
			String pdfPath = (!IBSProperties.getIBSProp("PDFOutputPath").equals(""))? IBSProperties.getIBSProp("PDFOutputPath") + "\\" : this.getClass().getResource("/pdf").toURI().getPath().substring(1);

			if(isPDFAvaliable(pdfPath, filename)) {
				if(IBSProperties.getPDFGenerationQueue().contains(filename)) {
					IBSProperties.getPDFGenerationQueue().remove(filename);
				}
				if(!isPartial) {
					sendPDFResponse(FileUtils.readFileToByteArray(new File(pdfPath + filename)));
					return;
				}
			}
			
			if(IBSProperties.getPDFGenerationQueue().contains(filename)) {
				int counter = 1;
				while(!isPDFAvaliable(pdfPath, filename)) {
					Thread.sleep(2000);
					counter++;
					if(counter == 5) {
						sendResponse("The requested account statement is taking a long time to generate, please try again again in 5 mintues");
						return;
					}
				}
				sendPDFResponse(FileUtils.readFileToByteArray(new File(pdfPath + filename)));
			} else {
				IBSProperties.getPDFGenerationQueue().add(filename);
				String generatorPath = this.getClass().getResource("/wkhtmltopdf").toURI().getPath().substring(1);
				
				List<String> command = new ArrayList<String>();
	            command.add(generatorPath + "wkhtmltopdf");
	            command.add("--title");
	            command.add("\"Account");
	            command.add("Statement");
	            command.add(((String)session.get("customerName")).replace(" ", ""));
	            command.add("AC:" + accountID);
	            command.add(month + "-" + year + "\"");
	            command.add("\"" + accountStatementURL + "\"");
	            command.add("--javascript-delay");
	            command.add("1000");
	            command.add("--zoom");
	            command.add("1.5");
	            command.add("--footer-right");
	            command.add("\"[page]");
	            command.add("of");
	            command.add("[toPage]\"");
	            command.add(pdfPath + filename);

	            ProcessBuilder builder = new ProcessBuilder(command);
	            Map<String, String> environ = builder.environment();
	            final Process process = builder.start();
	            InputStream is = process.getErrorStream();
	            InputStreamReader isr = new InputStreamReader(is);
	            BufferedReader br = new BufferedReader(isr);
	            String line = null;
	            while ((line = br.readLine()) != null) {
	            	IBSSystem.printConsole("WKhtmltopdf> " + line);
	            }
	            IBSSystem.printConsole("Util: Account Statement PDF written to: " + pdfPath + filename);
            	sendPDFResponse(FileUtils.readFileToByteArray(new File(pdfPath + filename)));
			}
		}catch (Exception e){
			e.printStackTrace();
			sendResponse("Account Statement is currently unavaliable");
		}
	}
	
	private boolean isPDFAvaliable(String location, String filenameToSearch) {
		String[] filenames = new File(location).list();
		for(String filename : filenames) {
			if(filename.equalsIgnoreCase(filenameToSearch)) {
				return true;
			}
		}
		return false;
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
		response.setCharacterEncoding("UTF-8");
        response.setContentType("text/plain ");
        PrintWriter out;
		try {
			out = response.getWriter();
			out.print(responseString);	
	        out.flush();
	        out.close();
		} catch (IOException e) {
			IBSSystem.printConsole(e.getMessage());
		}
	}
	
	private void sendImageResponse(ByteArrayOutputStream data) {
		HttpServletResponse response = ServletActionContext.getResponse();
		response.setCharacterEncoding("UTF-8");
        response.setContentType("image/png ");
        ServletOutputStream output = null;
		try {
		    output = response.getOutputStream();
		    data.writeTo(output);
		    output.flush();
		    output.close();
		} catch (IOException e) {
			IBSSystem.printConsole(e.getMessage());
		}
	}
	
	private void sendPDFResponse(byte[] data) {
		HttpServletResponse response = ServletActionContext.getResponse();
		response.setCharacterEncoding("UTF-8");
        response.setContentType("application/pdf ");
        ServletOutputStream output = null;
		try {
		    output = response.getOutputStream();
		    output.write(data);
		    output.flush();
		    output.close();
		} catch (IOException e) {
			IBSSystem.printConsole(e.getMessage());
		}
	}
	
	private String getStatusResponse(String statusMsg) {
		HashMap<String,String> responseData = new HashMap<String,String>();
		responseData.put("status", statusMsg);
		return SoapBar.hashMapToJson(responseData);
	}
	
	public void testTimeout() {
		sendResponse(getStatusResponse("Your session has expired or is invalid, please log in again."));
	}

}
