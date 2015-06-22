package com.smutbank.IBS.services;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;

import com.smutbank.IBS.actions.IBSSystem;
import com.smutbank.IBS.props.IBSProperties;

public class Network {

	public static String postToESB(String content) throws MalformedURLException{
		URL url=new URL(IBSProperties.getESBurl());
		String contentType=IBSProperties.getSoapContentType();
		HttpURLConnection connection = null;
		try {
		      connection = (HttpURLConnection)url.openConnection();
		      connection.setRequestMethod("POST");
		      connection.setRequestProperty("Content-Type",contentType);
		      connection.setConnectTimeout(10000);
					
		      connection.setUseCaches (false);
		      connection.setDoInput(true);
		      connection.setDoOutput(true);
		      
		      DataOutputStream wr = new DataOutputStream (connection.getOutputStream ());
		      wr.writeBytes (content);
		      wr.flush ();
		      wr.close ();
	
		      InputStream is = connection.getInputStream();
		      BufferedReader rd = new BufferedReader(new InputStreamReader(is));
		      String line;
		      StringBuffer response = new StringBuffer(); 
		      while((line = rd.readLine()) != null) {
		        response.append(line);
		        response.append('\r');
		      }
		      rd.close();
		      return response.toString();

		    } catch (Exception e) {
		    	IBSSystem.printConsole(e.getMessage());
		    	return e.getMessage();

		    } finally {

		      if(connection != null) {
		        connection.disconnect(); 
		      }
		    }
	}
}
