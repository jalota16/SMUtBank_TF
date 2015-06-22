package com.smutbank.IBS.props;

import java.io.InputStream;
import java.io.FileOutputStream;
import java.io.File;
import java.net.URL;
import java.util.LinkedHashMap;
import java.util.Scanner;

import com.smutbank.IBS.services.SoapBar;

public class RIBProperties {

    private final static String PROPSFILE = "conf/RIB.ribprops";
    
    private static LinkedHashMap<String,String> RIBprops;
    
    static {
        InputStream iStream = RIBProperties.class.getClassLoader().getResourceAsStream(PROPSFILE);
        String json = new Scanner(iStream).useDelimiter("\\A").next();
        RIBprops = SoapBar.jsonToHashMap(json);
    }
    
    private static void saveToFile() {
        String json = SoapBar.hashMapToJson(RIBprops);
        URL curPath = RIBProperties.class.getClassLoader().getResource(PROPSFILE);
        FileOutputStream out = null;
        try {
            File propsFile = new File(curPath.toURI().getPath());
            out = new FileOutputStream(propsFile);
            out.write(json.getBytes());
        } catch(Exception e) {
        } finally {
            try {
                if(out != null) {
                    out.close();
                }
            } catch(Exception e) {
            }
        }
    }
    
    public static LinkedHashMap<String,String> getRIBProps() {
        return RIBprops;
    }
    
    public static void setRIBProps(LinkedHashMap<String,String> newRIBProps) {
        RIBprops = newRIBProps;
        saveToFile();
    }
    
    public static String getRIBProp(String propertyName) {
        return RIBprops.get(propertyName);
    }

}