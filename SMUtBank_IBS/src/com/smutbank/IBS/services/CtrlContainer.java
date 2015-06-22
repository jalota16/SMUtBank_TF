package com.smutbank.IBS.services;

import com.smutbank.IBS.actions.IBSSystem;

public class CtrlContainer {

    private static ASController asc;
    private static SoapBar soapBar;
    private static boolean isInit = false;
    
    private static void init() {
    	isInit = true;
    	if(asc == null) {
            try {
                asc = new ASController();
            } catch(Exception e) {
                IBSSystem.printConsole("Error init ASController: " + e.getMessage());
                e.printStackTrace();
            }
        }
    	if(soapBar == null) {
            soapBar = new SoapBar();
        }
    }
    
    public static ASController getAsc() {
        if(!isInit) {
        	init();
        } else if(asc == null) {
        	while(asc == null) {
        		try {
					Thread.sleep(2000);
				} catch (InterruptedException e) {
					return null;
				}
        	}
        }
        return asc;
    }
    
    public static void disconnectASC() {
    	if(asc != null) {
    		asc.disconnect();
        	asc = null;
    	}
    	if(soapBar != null) {
    		try {
    			soapBar.disconnect();
    		} catch(Exception e) {
    		}
    		soapBar = null;
    	}
    	isInit = false;
    }
    
    public static SoapBar getSoapBar() {
    	if(!isInit) {
        	init();
        } else if(soapBar == null) {
        	while(soapBar == null) {
        		try {
					Thread.sleep(2000);
				} catch (InterruptedException e) {
					return null;
				}
        	}
        }
        return soapBar;
    }

}