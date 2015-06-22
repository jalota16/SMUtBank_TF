package com.smutbank.IBS.actions;

import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.apache.struts2.ServletActionContext;

import com.opensymphony.xwork2.ActionContext;
import com.opensymphony.xwork2.ActionSupport;
import com.opensymphony.xwork2.util.ValueStack;
import com.smutbank.IBS.props.IBSProperties;
import com.smutbank.IBS.props.RIBProperties;

/*
 This class is to manage the admin page. Execute method will load the key pair values and update will commit the changes to file
 */
public class Admin extends ActionSupport {
	private Map map;
	
	public void setList(Map map){
		this.map=map;
	}
	
	public Map getMap(){
		return map;
	}
	
	public String execute(){
		Map m = null;
		String propName = ServletActionContext.getRequest().getParameter("prop");
		if(propName.equalsIgnoreCase("ibs")) {
			m = IBSProperties.getIBSProps();
		} else if(propName.equalsIgnoreCase("rib")) {
			m = RIBProperties.getRIBProps();
		}
		setList(m);
		ValueStack vs = ActionContext.getContext().getValueStack();
		vs.set("prop", propName);
		//IBSSystem.printConsole(m.get("tBankServerIP"));
		return SUCCESS;
	}
	
	public String update(){
		LinkedHashMap<String,String> m = null;
		String propName = ServletActionContext.getRequest().getParameter("prop");
		if(propName.equalsIgnoreCase("ibs")) {
			m = IBSProperties.getIBSProps();
		} else if(propName.equalsIgnoreCase("rib")) {
			m = RIBProperties.getRIBProps();
		}
		LinkedHashMap<String,String> newMap=new LinkedHashMap<String,String>();
		HttpServletRequest reqeust= ServletActionContext.getRequest();
		Iterator iter=m.entrySet().iterator();
		while (iter.hasNext()){
			Map.Entry entry=(Map.Entry)iter.next();
			String key=(String)entry.getKey();
			String value=reqeust.getParameter(key);
			newMap.put(key, value);
		}
		if(propName.equalsIgnoreCase("ibs")) {
			IBSProperties.setIBSProps(newMap);
		} else if(propName.equalsIgnoreCase("rib")) {
			RIBProperties.setRIBProps(newMap);
		}
		return execute();
	}
}
