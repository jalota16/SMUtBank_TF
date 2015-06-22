package com.smutbank.IBS.services;

import java.util.*;
import java.io.*;

import javax.xml.parsers.*;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.w3c.dom.*;

import com.smutbank.IBS.actions.IBSSystem;

public class Bubble {

    //handles Soap translation only
    
    private static Document parseXML(String xmlDocument) throws Exception {
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setNamespaceAware(true);
        DocumentBuilder db = dbf.newDocumentBuilder(); 
        return db.parse(new ByteArrayInputStream(xmlDocument.getBytes()));
    }
    
    private static void setText(Document doc, String tagName, String content) throws Exception {
        getNodeComplex(doc, tagName).setTextContent(content);
    }
    
    private static Node getNodeComplex(Document doc, String tagName) throws Exception {
    	return getNodeComplex(doc, tagName, false);
    }
    
    private static Node getNodeComplex(Document doc, String tagName, boolean getParent) throws Exception {
    	if(tagName.contains(".")) {
    		String[] tagParts = tagName.split("\\.");
    		NodeList childrenNodes = null;
    		for(int i = 0; i < tagParts.length; i++) {
    			if(tagParts[i].contains("^")) {
                    String[] multiTagParts = tagParts[i].split("\\^");
    				String multiTag = multiTagParts[0];
    				int tagOrder = Integer.parseInt(multiTagParts[1]) - 1;
    				
    				NodeList multiTags = getNodes(doc, multiTag);
    				if(tagParts.length - 1 == i) {
						return multiTags.item(tagOrder);
					} else {
						childrenNodes = multiTags.item(tagOrder).getChildNodes();
					}
    			} else if(i == 0) {
                    childrenNodes = getNode(doc, tagParts[i], false).getChildNodes();
                } else {
                    for(int j = 0; j < childrenNodes.getLength(); j++) {
                        if(childrenNodes.item(j).getNodeName().equals(tagParts[i])) {
                            if(tagParts.length - 1 == i) {
                                return childrenNodes.item(j);
                            } else {
                                childrenNodes = childrenNodes.item(j).getChildNodes();
                                break;
                            }
                        }
                    }
                }
    		}
    		throw new Exception("Complex Node Name: " + tagName + " is not found");
    	} else {
    		return getNode(doc, tagName, getParent);
    	}
    }
    
    private static Node getNode(Document doc, String tagName, boolean getParent) throws Exception {
    	NodeList result = doc.getElementsByTagName(tagName);
        if(result.getLength() == 1) {
            return result.item(0);
        } else if(result.getLength() == 0)  {
        	tagName = tagName.replaceAll(".*:", ""); // AM 20140722 strip off namespace
        	NodeList secondTry = doc.getDocumentElement().getElementsByTagNameNS("*", tagName);
        	if(secondTry.getLength() == 1) {
        		return secondTry.item(0);
        	}
        	throw new Exception("No nodes found by tag name: " + tagName);
        } else if(getParent) {
        	IBSSystem.printConsole("Found more than 1 node by tag name: " + tagName + ", returning parentNode: " + result.item(0).getParentNode().getNodeName());
        	return result.item(0).getParentNode();
        } else {
        	throw new Exception("Found more than 1 node by tag name: " + tagName + "getParent: " + getParent);
        }
    }
    
    private static NodeList getNodes(Document doc, String tagName) throws Exception {
    	return doc.getElementsByTagName(tagName);
    }
    
    public static String createBubble(HashMap<String,String> input, String bubbleTemplateStr) throws Exception {
        Document bubbleTemplate = parseXML(bubbleTemplateStr);
        
        for(String tagName: input.keySet()) {
            try {
                setText(bubbleTemplate, tagName, input.get(tagName));
            } catch(Exception e) {
                IBSSystem.printConsole("createBubble: No tag found for: " + tagName + " , skipping...");
            }
        }
        return toString(bubbleTemplate);
    }
    
    public static LinkedHashMap<String,String> scrubBubble(String soapMsg, String newRootTag) {
        ArrayList<String> tagCaptureList = new ArrayList<String>();
        tagCaptureList.add(newRootTag);
        return scrubBubble(soapMsg, newRootTag, tagCaptureList);
    }
    
    public static LinkedHashMap<String,String> scrubBubble(String soapMsg, String newRootTag, ArrayList<String> tagCaptureList) {
        LinkedHashMap<String,String> result = new LinkedHashMap<String,String>();
        try {
            //long startTime = System.nanoTime();
            Document soapDoc = parseXML(soapMsg);
            //IBSSystem.printConsole("Time took to run: " + (System.nanoTime() - startTime) / 1000000.00 + "ms");
            //NodeList mainList = getNode(soapDoc,"ServiceRespHeader").getParentNode().getChildNodes();
            try {
	            Node esbStatus = getNodeComplex(soapDoc,"ErrorText");
	            result.put("esbStatus", esbStatus.getTextContent());
	            IBSSystem.printConsole("NodeName: " + esbStatus.getNodeName() + ", NodeValue: " +  esbStatus.getTextContent());
            } catch(Exception e) {
            	result.put("esbStatus", "Unknown, field not found");
            }
            try {
	            Node esbStatusDetails = getNodeComplex(soapDoc,"ErrorDetails");
	            result.put("esbStatusDetails", esbStatusDetails.getTextContent());
	            IBSSystem.printConsole("NodeName: " + esbStatusDetails.getNodeName() + ", NodeValue: " +  esbStatusDetails.getTextContent());
            } catch(Exception e) {
            	result.put("esbStatusDetails", "Unknown, field not found");
            }
            Node tagRoot = getNode(soapDoc,newRootTag, true);
            if(!tagRoot.hasChildNodes()) {
                walkNode(tagRoot, tagRoot.getNodeName(), result);
                return result;
            }
            
            for(String tag : tagCaptureList) {
                NodeList tagResult = soapDoc.getElementsByTagName(tag);
                result.put(tag + ".length", Integer.toString(tagResult.getLength()));
                for(int i = 0; i < tagResult.getLength(); i++) {
                    Node curNode = tagResult.item(i);
                    walkNode(curNode, (curNode.getNodeName() + (i + 1)), result);
                }
            }
        } catch(Exception e) {
            IBSSystem.printConsole(e.getMessage());
        }
        return result;
    }
    
    private static void walkNode(Node curNode, String path, LinkedHashMap<String,String> results) {
        //IBSSystem.printConsole(path);
        if(curNode.hasChildNodes()) {
            NodeList childNodes = curNode.getChildNodes();
            for(int i = 0; i < childNodes.getLength(); i++) {
                if(childNodes.item(i).getNodeName().equals("#text")) {
                    walkNode(childNodes.item(i), path, results);
                } else {
                    walkNode(childNodes.item(i), (path + "." + childNodes.item(i).getNodeName()), results);
                }
            }
        } else {
            if(hasLetters(curNode.getTextContent())) {   
                results.put(path,curNode.getTextContent());
            }
        }
    }
    
    private static boolean hasLetters(String s) {
    	return s.matches("[\\w\\d.&@,+ :-]+");
    }
    
    private static String toString(Document doc) throws Exception {
        TransformerFactory tf = TransformerFactory.newInstance();
        Transformer transformer = tf.newTransformer();
        transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
        StringWriter writer = new StringWriter();
        transformer.transform(new DOMSource(doc), new StreamResult(writer));
        return writer.getBuffer().toString();
    }
    
    private static String toString(Node node) throws Exception {
        TransformerFactory tf = TransformerFactory.newInstance();
        Transformer transformer = tf.newTransformer();
        transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
        StringWriter writer = new StringWriter();
        transformer.transform(new DOMSource(node), new StreamResult(writer));
        return writer.getBuffer().toString();
    }

}