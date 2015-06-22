package com.smutbank.IBS.actions;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import com.opensymphony.xwork2.ActionSupport;
import com.smutbank.IBS.props.IBSProperties;
import com.smutbank.IBS.services.CtrlContainer;

public class IBSSystem extends  ActionSupport implements ServletContextListener {
	
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public String shutdown() {
		//timer start
    	long startTime = System.nanoTime();
		
		CtrlContainer.disconnectASC();
		
		String msg = "IBS shut down in: " + (System.nanoTime() - startTime) / 1000000.00 + "ms";

		//IBSSystem.printConsole(msg);
		System.out.println(msg);
		return SUCCESS;
	}
	
	public String startup() {
		//timer start
    	long startTime = System.nanoTime();
		
		CtrlContainer.getAsc();
		CtrlContainer.getSoapBar();
		
		//timer end
        String msg = "IBS initialized in: " + (System.nanoTime() - startTime) / 1000000.00 + "ms";

		//IBSSystem.printConsole(msg);
        System.out.println(msg);
		return SUCCESS;
	}
	
	public static void printConsole(Object message) {
		if(Boolean.parseBoolean(IBSProperties.getIBSProp("verbose"))) {
			System.out.println(message);
		}
	}

	@Override
	public void contextDestroyed(ServletContextEvent arg0) {
		shutdown();
	}

	@Override
	public void contextInitialized(ServletContextEvent arg0) {
		startup();
	}
	
}
