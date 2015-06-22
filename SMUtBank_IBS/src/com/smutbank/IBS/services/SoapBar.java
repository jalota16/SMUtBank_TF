package com.smutbank.IBS.services;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.io.File;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.lang.reflect.Type;
import java.net.URISyntaxException;

import com.google.gson.reflect.TypeToken;
import com.tibco.as.space.*;
import com.smutbank.IBS.actions.IBSSystem;

public class SoapBar {

    //controller class to handle bubbles and bubble templates
    
    private final String SMOPERATIONNAME = "ServiceMediationOperation";
    private final String SMFILENAME = "ServiceMediation.wsdl";
    private final String SMSERVICECONTENTTAGNAME = "/smr:ServiceContent";
    
    private final String SMRTAGMARKER = "<ServiceReqHeader>";
    
    private final String WSDLMSGTABLENAME = "WsdlMsgs";
    private final String WSDLREPBRANCHTABLENAME = "WsdlMsgsRepList";
    
    private  String WSDLDIR = "wsdl/";
    private SoapGen soapGen;
    
    public SoapBar() {
    	//timer start
    	long startTime = System.nanoTime();
    	
    	IBSSystem.printConsole("Initializing SoapBar...");
    	//rebuildAllBubbleTemplates();
        //IBSSystem.printConsole("Preloading SOAP Messages...");
        //manualLoading();
        try {
        	IBSSystem.printConsole("Starting SoapGen...");
        	soapGen = new SoapGen();
        	IBSSystem.printConsole("Building all SOAP messages...");
            rebuildAllBubbleTemplates();
        } catch(Exception e) {
            IBSSystem.printConsole("Error building SOAP messages!");
            IBSSystem.printConsole(e.getMessage());
        }
        //exit SoapGen after use, runs out of memory for unknown reasons
        IBSSystem.printConsole("Closing SoapGen...");
        //Commented out because it seems like it can clean itself properly..
        //soapGen.close();
        soapGen = null;
        //timer end
        IBSSystem.printConsole("SoapBar initialized in: " + (System.nanoTime() - startTime) / 1000000.00 + "ms");
    }
    
    public void disconnect() {
    	soapGen.close();
    }
    
    public static LinkedHashMap<String,String> jsonToHashMap(String jsonInput) {
        Type mapType = new TypeToken<LinkedHashMap<String,String>>() {}.getType();
        Gson gson = new Gson(); 
        return gson.fromJson(jsonInput, mapType);
    }
    
    public static ArrayList<String> jsonToArrayList(String jsonInput) {
        Type mapType = new TypeToken<ArrayList<String>>() {}.getType();
        Gson gson = new Gson(); 
        return gson.fromJson(jsonInput, mapType);
    }
    
    public static String hashMapToJson(HashMap<String,String> map) {
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        return gson.toJson(map);
    }
    
    private String getBubbleTemplate(String operationName) throws Exception {
    	return getBubbleTemplate(operationName, new HashMap<String,String>());
    }
    
    private String getBubbleTemplate(String operationName, HashMap<String,String> mapFields) throws Exception {
        ASController asc = CtrlContainer.getAsc();
        Tuple key = Tuple.create();
        key.put("operationName",operationName);
        Tuple result = asc.get(WSDLMSGTABLENAME,key);
        StringBuffer wsdlMsg = new StringBuffer(result.getString("wsdlMsg"));
       
        int repCount = 0;
        String rootTag = "";
        for(String field : mapFields.keySet()) {
           if(field.contains(".repetition")) {
               repCount = Integer.parseInt(mapFields.get(field));
               String fieldParts[] = field.split("\\.");
               rootTag = fieldParts[fieldParts.length - 2];
               
               Tuple key1 = Tuple.create();
               key1.put("operationName", operationName);
               key1.put("rootTag", rootTag);
               Tuple repBranchResult = asc.get(WSDLREPBRANCHTABLENAME, key1);
               
               String inTag = repBranchResult.getString("inTag");
               String repBranch = repBranchResult.getString("repBranch");
               int insertStart = wsdlMsg.indexOf(">" ,wsdlMsg.indexOf("<" + inTag + ">")) + 1;
               
               for(int i = 0; i < repCount; i++) {
                   wsdlMsg.insert(insertStart, repBranch);
               }
           }
        }
        return wsdlMsg.toString();
    }
    
    private String getWSDLFilename(String operationName) throws Exception {
        Tuple key = Tuple.create();
        key.put("operationName", operationName);
    	Tuple result = CtrlContainer.getAsc().get(WSDLMSGTABLENAME, key);
    	if(result == null) {
    		return null;
    	} else {
    		return result.getString("wsdlFilepath");
    	}
    }
    
    private void setBubbleTemplate(String operationName, String bubbleTemplate, String wsdlFilename) {
    	ASController asc = CtrlContainer.getAsc();
        
        Tuple wsdlEntry = Tuple.create();
        wsdlEntry.put("operationName",operationName);
        try {
            if(bubbleTemplate.contains("<!--Zero or more repetitions:-->")) {
                IBSSystem.printConsole("Operation: " + operationName + " has repetative branches. Starting splicing operation...");
                //timer
            	long startTime = System.nanoTime();
            	
            	StringBuffer finalSoap = new StringBuffer(bubbleTemplate);
            	int start = finalSoap.indexOf("<!--Zero or more repetitions:-->");
                int end = finalSoap.indexOf(">", start);
                
                int inTagStart = finalSoap.lastIndexOf("<", start - 1) + 1;
                int inTagEnd = finalSoap.indexOf(">", inTagStart);
                String inTag = finalSoap.substring(inTagStart, inTagEnd);
                
                if(inTag.contains(" ")) {
                	inTag = inTag.split(" ")[0];
                }
                
                int rootTagStart = finalSoap.indexOf("<", end) + 1;
                int rootTagEnd = finalSoap.indexOf(">", rootTagStart);
                String rootTag = finalSoap.substring(rootTagStart, rootTagEnd);
                
                if(rootTag.contains(" ")) {
                	rootTag = inTag.split(" ")[0];
                }
                
                int repBranchStart = finalSoap.indexOf("<" + rootTag + ">");
                int repBranchEnd = finalSoap.indexOf("</" + rootTag + ">", repBranchStart) + 3 + rootTag.length();
                int repBranchFinalEnd = finalSoap.lastIndexOf("</" + rootTag + ">") + 3 + rootTag.length();
                String repBranch = finalSoap.substring(repBranchStart, repBranchEnd);
                
                //IBSSystem.printConsole(repBranch);
                
                finalSoap = finalSoap.delete(repBranchStart, repBranchFinalEnd);
                bubbleTemplate = finalSoap.toString();
                
                Tuple repBranchEntry = Tuple.create();
                repBranchEntry.put("operationName" ,operationName);
                repBranchEntry.put("inTag", inTag);
                repBranchEntry.put("rootTag", rootTag);
                repBranchEntry.put("repBranch", repBranch);
                asc.put(WSDLREPBRANCHTABLENAME, repBranchEntry);
                
                //timer end
                IBSSystem.printConsole("Splice operation took: " + (System.nanoTime() - startTime) / 1000000.00 + "ms");
            }
            
            wsdlEntry.put("wsdlMsg", bubbleTemplate);
            wsdlEntry.put("wsdlFilepath", wsdlFilename);
            asc.put(WSDLMSGTABLENAME,wsdlEntry);
        } catch(Exception e) {
           IBSSystem.printConsole("Error in " + operationName + ": " + e);
        }
    }
    
    public String createSoapMessage(String jsonFields, String operationName) {
        try {
            return createSoapMessage(jsonToHashMap(jsonFields), operationName);
        } catch(Exception e) {
            IBSSystem.printConsole(e.getMessage());
            return null;
        }
    }
    
    public String createSoapMessage(HashMap<String,String> mapFields, String operationName) {
        try {
            //IBSSystem.printConsole(getBubbleTemplate(operationName, mapFields));
        	return Bubble.createBubble(mapFields, getBubbleTemplate(operationName, mapFields));
        } catch(Exception e) {
            IBSSystem.printConsole("SoapBar: Error creating soap message");
            return null;
        }
    }
    
    private String extractGenericCoreFields(String genericSoapTemplate) {
    	StringBuffer srhTagName = new StringBuffer(SMRTAGMARKER);
        StringBuffer srhEndTagName = new StringBuffer(srhTagName.toString()).insert(1, "/");
        
        StringBuffer template = new StringBuffer(genericSoapTemplate);
        
        String head = template.substring(0, template.indexOf(srhTagName.toString()));
    	StringBuffer coreTagName = new StringBuffer(template.substring(head.lastIndexOf("<"), head.lastIndexOf(">") + 1));
        StringBuffer coreEndTagName = new StringBuffer(coreTagName.toString()).insert(1, "/");
        
        int coreFieldsStart = template.indexOf(srhEndTagName.toString()) + srhEndTagName.length();
        int coreFieldsEnd = template.lastIndexOf(coreEndTagName.toString());
        StringBuffer coreFields = new StringBuffer(template.substring(coreFieldsStart, coreFieldsEnd).trim());
        
        return coreFields.toString();
    }
    
    private ArrayList<String> extractNamespaces(String genericSoapTemplate, String coreFields) {
    	StringBuffer template = new StringBuffer(coreFields);
    	
    	//Find all unique namespaces
        ArrayList<String> namespaces = new ArrayList<String>();
        int index = template.indexOf(":", 0);
        while(index > 0) {
        	//extract namespace
            int start = template.substring(0, index).lastIndexOf("<") + 1;
        	String namespace = template.substring(start, index).replace("/", "");
        	if(!namespaces.contains(namespace)) {
        		namespaces.add(namespace);
        	}
            index = template.indexOf(":", ++index);
        }
        
      //extract namespace declaration
        ArrayList<String> nsDeclarations = new ArrayList<String>();
        for(String namespace : namespaces) {
        	//IBSSystem.printConsole(" xmlns:" + namespace + "=\"");
            String nsDeclarationMark = " xmlns:" + namespace + "=\"";
            int nsDeclarationStart = genericSoapTemplate.indexOf(nsDeclarationMark);
        	int nsDeclarationEnd = genericSoapTemplate.indexOf("\"", nsDeclarationStart + nsDeclarationMark.length()) + 1;
        	String nsDeclaration = (nsDeclarationStart > 0)? genericSoapTemplate.substring(nsDeclarationStart, nsDeclarationEnd) : "";
        	//String nsDeclarationTag = (nsDeclaration != "")? nsDeclaration.substring(nsDeclaration.lastIndexOf("/") + 1, nsDeclaration.length() - 1) : "";
            //IBSSystem.printConsole(nsDeclarationTag);
        	
        	nsDeclarations.add(nsDeclaration);
        }
        return nsDeclarations;
    }
    
    public void rebuildBubbleTemplate(String wsdlFilename) throws Exception {
        String wsdlFilePath = WSDLDIR + "\\" + wsdlFilename;
        IBSSystem.printConsole(wsdlFilePath);
        //String interfaceName = getInterfaceName(operationName);
        String newBubbleTemplate = "";
        
        try {
            soapGen.loadWSDL(wsdlFilePath);
            for(String interfaceName : soapGen.getInterfaceNames()) {
        		for(String operationName : soapGen.getOperationNames(interfaceName)) {
	            	newBubbleTemplate = soapGen.generateSoapRequest(interfaceName, operationName);
	                //insert template into SM template
	                if(!operationName.equalsIgnoreCase(SMOPERATIONNAME)) {
	                    StringBuffer smBubbleTemplate = new StringBuffer(getBubbleTemplate(SMOPERATIONNAME));
	                    String coreFields = extractGenericCoreFields(newBubbleTemplate);
	                    smBubbleTemplate.insert(smBubbleTemplate.indexOf(SMSERVICECONTENTTAGNAME) - 1, coreFields);
	                    ArrayList<String> nsDeclarations = extractNamespaces(newBubbleTemplate, coreFields);
	                    for(String nsDeclaration : nsDeclarations) {
	                    	smBubbleTemplate.insert(smBubbleTemplate.indexOf(">"), nsDeclaration);
	                    }
	                    newBubbleTemplate = smBubbleTemplate.toString();
	                }
	                setBubbleTemplate(operationName, newBubbleTemplate, wsdlFilename);
            	}
            }
        } catch(Exception e) {
            IBSSystem.printConsole("SoapBar: Error rebuilding operations in " + wsdlFilename);
        }
    }
    
    public void rebuildAllBubbleTemplates() throws Exception {
    	//timer start
    	long startTime = System.nanoTime();
    	ArrayList<String> wsdlFilenames = getAllWsdlFilenames();
        
        for(String wsdlFilename:wsdlFilenames) {
            rebuildBubbleTemplate(wsdlFilename);
        }
      //timer end
        IBSSystem.printConsole("Soap messages generated in: " + (System.nanoTime() - startTime) / 1000000.00 + "ms");
    }
    
    private ArrayList<String> getAllWsdlFilenames() {
       ArrayList<String> wsdlFilenames = new ArrayList<String>();
       File wsdlDir = null;
    	try {
			wsdlDir = new File(this.getClass().getClassLoader().getResource(WSDLDIR).toURI().getPath());
			WSDLDIR = wsdlDir.getAbsolutePath();
		} catch (URISyntaxException e) {
			IBSSystem.printConsole("Error setting WSDL path");
		}
    	//IBSSystem.printConsole(wsdlDir.getAbsolutePath());
        
        for(File file : wsdlDir.listFiles()) {
        	String filename = file.getName().toLowerCase()	;
        	if((!file.isDirectory()) && filename.endsWith("wsdl")) {
        		if(filename.equalsIgnoreCase(SMFILENAME)) {
        			wsdlFilenames.add(0, filename);
        		} else {
        			wsdlFilenames.add(filename);
        		}
        	}
        }
        return wsdlFilenames;
    }

}