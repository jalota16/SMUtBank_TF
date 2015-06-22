package com.smutbank.IBS.props;

import java.io.InputStream;
import java.io.FileOutputStream;
import java.io.File;
import java.net.URL;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Scanner;

import com.smutbank.IBS.services.SoapBar;

public class IBSProperties {

    private final static String PROPSFILE = "conf/IBS.ibsprops";
    
    private static LinkedHashMap<String,String> IBSprops;
    private static LinkedHashSet<String> restrictedServicesList;
    private static LinkedHashSet<String> pdfGenerationQueue;
    private static String ESBurl;
    private static String soapContentType;
    
    static {
        InputStream iStream = IBSProperties.class.getClassLoader().getResourceAsStream(PROPSFILE);
        String json = new Scanner(iStream).useDelimiter("\\A").next();
        IBSprops = SoapBar.jsonToHashMap(json);
        buildVars(IBSprops);
    }
    
    private static void buildVars(LinkedHashMap<String,String> props) {
        ESBurl = props.get("tBankServerProtocol") + "://" + props.get("tBankServerIP") + ":" + props.get("tBankServiceMediationPort") + props.get("tBankServiceMediationPath");
        soapContentType = props.get("SoapContentType") + "\"" + props.get("tBankServiceMediationSoapAction") + "\"";
        
        String[] list = ((props.get("RestrictedServicesList") == "")? new String[0] : IBSProperties.getIBSProp("RestrictedServicesList").split(","));
        pdfGenerationQueue = new LinkedHashSet<String>();
        restrictedServicesList = new LinkedHashSet<String>();
        for(String serviceName : list) {
            restrictedServicesList.add(serviceName);
        }
    }
    
    private static void saveToFile() {
        String json = SoapBar.hashMapToJson(IBSprops);
        //System.out.println(json);
        URL curPath = IBSProperties.class.getClassLoader().getResource(PROPSFILE);
        FileOutputStream out = null;
        try {
            File propsFile = new File(curPath.toURI().getPath());
            System.out.println("IBSProps updated at: " + curPath.toURI().getPath());
            out = new FileOutputStream(propsFile);
            out.write(json.getBytes());
        } catch(Exception e) {
        	System.out.println("Error writing  props!");
        } finally {
            try {
                if(out != null) {
                    out.close();
                }
            } catch(Exception e) {
            	System.out.println("Error closing props writer!");
            }
        }
    }
    
    public static HashSet<String> getRestrictedServicesList() {
        return restrictedServicesList;
    }
    
    public static HashSet<String> getPDFGenerationQueue() {
    	return pdfGenerationQueue;
    }
    
    public static LinkedHashMap<String,String> getIBSProps() {
        return IBSprops;
    }
    
    public static void setIBSProps(LinkedHashMap<String,String> newIBSProps) {
        IBSprops = newIBSProps;
        buildVars(IBSprops);
        saveToFile();
    }
    
    public static String getIBSProp(String propertyName) {
        return IBSprops.get(propertyName);
    }
    
    public static String getESBurl() {
        return ESBurl;
    }
    
    public static String getSoapContentType() {
        return soapContentType;
    }

}