package com.smutbank.IBS.services;

import com.smutbank.IBS.actions.IBSSystem;
import com.smutbank.IBS.props.IBSProperties;
import com.tibco.as.space.*;
import com.tibco.as.space.FieldDef.FieldType;
import com.tibco.as.space.IndexDef.IndexType;
import com.tibco.as.space.Member.DistributionRole;
import com.tibco.as.space.browser.Browser;
import com.tibco.as.space.browser.BrowserDef;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;

public class ASController {
    
    private final String METASPACENAME = "IBDATAGRID";
    private Metaspace ms;
    
    private HashMap<String,Space> spaceDir = new HashMap<String,Space>();
    
    public ASController() throws Exception {
    	//timer start
    	long startTime = System.nanoTime();
    	
    	IBSSystem.printConsole("Initializing ASController...");
    	connect();
        intiDefaultSpaces();
        waitForSpaceInit();
        
      //timer end
        IBSSystem.printConsole("ASController initialized in: " + (System.nanoTime() - startTime) / 1000000.00 + "ms");
    }
    
    private void connect() {
    	//timer start
    	long startTime = System.nanoTime();
    	String memberName = (IBSProperties.getIBSProp("ActiveSpacesMemberName") == "")? "IBServer": IBSProperties.getIBSProp("ActiveSpacesMemberName");
    	MemberDef memberDef = MemberDef.create();
        memberDef.setDiscovery("tibpgm");
        memberDef.setListen("tcp");
        memberDef.setMemberName(memberName);
        try {
            String datastorePath = (!IBSProperties.getIBSProp("ASDataStorePath").equals(""))? IBSProperties.getIBSProp("ASDataStorePath").replace("/", "\\") : ASController.class.getResource("/").toURI().getPath().substring(1).replace("/", "\\") + "ASDataStore\\";
        	IBSSystem.printConsole("AS Datastore set at: " + datastorePath);
            memberDef.setDataStore(datastorePath);
        } catch(Exception e) {
            IBSSystem.printConsole("Error setting datastore path, reverting to default");
        }
        
        Tuple context = Tuple.create();
        context.put("platform", "java");
        context.put("jointime", DateTime.create());
        memberDef.setContext(context);
        
        try {
        	IBSSystem.printConsole("Connecting to AS Metaspace: " + METASPACENAME + " as: " + memberDef.getMemberName());
        	ms = Metaspace.connect(METASPACENAME, memberDef);
        }
        catch(ASException e) {
            IBSSystem.printConsole("Error connecting to MS, trying to get from Commons");
            ms = ASCommon.getMetaspace(METASPACENAME);
        }
        
      //timer end
        IBSSystem.printConsole("Connected in: " + (System.nanoTime() - startTime) / 1000000.00 + "ms");
    }
    
    public void disconnect() {
    	try {
    		ms.closeAll();
    	} catch(Exception e) {
    		IBSSystem.printConsole("Failed to disconnect from AS server");
    	}
    }
    
    private void intiDefaultSpaces() {
    	//timer start
    	long startTime = System.nanoTime();
    	
    	SpaceDef loginTransDef = null;
		try {
			//IBSSystem.printConsole("Trying to find def");
			loginTransDef = ms.getSpaceDef("LoginTransaction");
			//IBSSystem.printConsole(loginTransDef);
			if(loginTransDef == null) {
				loginTransDef = SpaceDef.create("LoginTransaction");
		        loginTransDef.putFieldDef(FieldDef.create("challenge", FieldType.STRING));
		        loginTransDef.putFieldDef(FieldDef.create("username", FieldType.STRING));
		        loginTransDef.putFieldDef(FieldDef.create("PIN", FieldType.STRING));
		        loginTransDef.putFieldDef(FieldDef.create("transCreationTime", FieldType.DATETIME).setNullable(true));
		        loginTransDef.setKeyDef(KeyDef.create().setFieldNames("challenge").setIndexType(IndexType.HASH));
		        loginTransDef.setPersistenceDistributionPolicy(SpaceDef.DistributionPolicy.NON_DISTRIBUTED);
		        loginTransDef.setPersistencePolicy(SpaceDef.PersistencePolicy.NONE);
		        loginTransDef.setHostAwareReplication(false);
		        loginTransDef.setTTL(180000);
		        loginTransDef.setReplicationCount(1);
		        try {
					ms.defineSpace(loginTransDef);
				} catch (ASException e) {
					 IBSSystem.printConsole(e.getMessage());
				}
			}
		} catch (ASException e) {
			IBSSystem.printConsole(e.getMessage());
		}
        
        SpaceDef loginSessionDef = null;
		try {
			loginSessionDef = ms.getSpaceDef("LoginSession");
			
			if(loginSessionDef == null) {
				loginSessionDef = SpaceDef.create("LoginSession");
		        loginSessionDef.putFieldDef(FieldDef.create("sessionID", FieldType.STRING));
		        loginSessionDef.putFieldDef(FieldDef.create("customerID", FieldType.STRING));
		        loginSessionDef.putFieldDef(FieldDef.create("bankID", FieldType.STRING).setNullable(true));
		        loginSessionDef.putFieldDef(FieldDef.create("lastSessionTime", FieldType.DATETIME).setNullable(true));
		        loginSessionDef.setKeyDef(KeyDef.create().setFieldNames("sessionID").setIndexType(IndexType.HASH));
		        loginSessionDef.setPersistenceDistributionPolicy(SpaceDef.DistributionPolicy.NON_DISTRIBUTED);
		        loginSessionDef.setPersistencePolicy(SpaceDef.PersistencePolicy.NONE);
		        loginSessionDef.setHostAwareReplication(false);
		        loginSessionDef.setTTL(600000);
		        loginSessionDef.setReplicationCount(1);
		        
		        try {
					ms.defineSpace(loginSessionDef);
				} catch (ASException e) {
					 IBSSystem.printConsole(e.getMessage());
				}
			}
		} catch (ASException e) {
			IBSSystem.printConsole(e.getMessage());
		}
		
        SpaceDef loginSessionNotificationDef = null;
		try {
			loginSessionNotificationDef = ms.getSpaceDef("LoginSessionNotification");
			if(loginSessionNotificationDef == null) {
				loginSessionNotificationDef = SpaceDef.create("LoginSessionNotification");
		        loginSessionNotificationDef.putFieldDef(FieldDef.create("sessionID", FieldType.STRING));
		        loginSessionNotificationDef.putFieldDef(FieldDef.create("challenge", FieldType.STRING));
		        loginSessionNotificationDef.setKeyDef(KeyDef.create().setFieldNames("challenge").setIndexType(IndexType.HASH));
		        loginSessionNotificationDef.setPersistenceDistributionPolicy(SpaceDef.DistributionPolicy.NON_DISTRIBUTED);
		        loginSessionNotificationDef.setPersistencePolicy(SpaceDef.PersistencePolicy.NONE);
		        loginSessionNotificationDef.setHostAwareReplication(false);
		        loginSessionNotificationDef.setTTL(60000);
		        loginSessionNotificationDef.setReplicationCount(1);
		        try {
					ms.defineSpace(loginSessionNotificationDef);
				} catch (ASException e) {
					 IBSSystem.printConsole(e.getMessage());
				}
			}
		} catch (ASException e) {
			IBSSystem.printConsole(e.getMessage());
		}
        
        SpaceDef wsdlMsgsDef = null;;
		try {
			wsdlMsgsDef = ms.getSpaceDef("WsdlMsgs");
			
			if(wsdlMsgsDef == null) {
				wsdlMsgsDef = SpaceDef.create("WsdlMsgs");
		        wsdlMsgsDef.putFieldDef(FieldDef.create("operationName", FieldType.STRING));
		        wsdlMsgsDef.putFieldDef(FieldDef.create("wsdlMsg", FieldType.STRING));
		        wsdlMsgsDef.putFieldDef(FieldDef.create("wsdlFilepath", FieldType.STRING).setNullable(true));
		        wsdlMsgsDef.setKeyDef(KeyDef.create().setFieldNames("operationName").setIndexType(IndexType.HASH));
		        wsdlMsgsDef.setPersistenceDistributionPolicy(SpaceDef.DistributionPolicy.NON_DISTRIBUTED);
		        wsdlMsgsDef.setPersistencePolicy(SpaceDef.PersistencePolicy.NONE);
		        wsdlMsgsDef.setHostAwareReplication(false);
		        wsdlMsgsDef.setReplicationCount(1);
		        
		        try {
					ms.defineSpace(wsdlMsgsDef);
				} catch (ASException e) {
					 IBSSystem.printConsole(e.getMessage());
				}
			}
		} catch (ASException e) {
			 IBSSystem.printConsole(e.getMessage());
		}
		
		SpaceDef wsdlMsgsRepListDef = null;;
		try {
			wsdlMsgsRepListDef = ms.getSpaceDef("WsdlMsgsRepList");
			
			if(wsdlMsgsRepListDef == null) {
				wsdlMsgsRepListDef = SpaceDef.create("WsdlMsgsRepList");
				wsdlMsgsRepListDef.putFieldDef(FieldDef.create("operationName", FieldType.STRING));
				wsdlMsgsRepListDef.putFieldDef(FieldDef.create("inTag", FieldType.STRING));
				wsdlMsgsRepListDef.putFieldDef(FieldDef.create("rootTag", FieldType.STRING));
				wsdlMsgsRepListDef.putFieldDef(FieldDef.create("repBranch", FieldType.STRING));
				wsdlMsgsRepListDef.setKeyDef(KeyDef.create().setFieldNames("operationName", "rootTag").setIndexType(IndexType.HASH));
				wsdlMsgsRepListDef.setPersistenceDistributionPolicy(SpaceDef.DistributionPolicy.NON_DISTRIBUTED);
				wsdlMsgsRepListDef.setPersistencePolicy(SpaceDef.PersistencePolicy.NONE);
				wsdlMsgsRepListDef.setHostAwareReplication(false);
				wsdlMsgsRepListDef.setReplicationCount(1);
		        
		        try {
					ms.defineSpace(wsdlMsgsRepListDef);
				} catch (ASException e) {
					 IBSSystem.printConsole(e.getMessage());
				}
			}
		} catch (ASException e) {
			 IBSSystem.printConsole(e.getMessage());
		}

        SpaceDef quikPayTransDef = null;
		try {
			quikPayTransDef = ms.getSpaceDef("QuikPayTransaction");
			
			if(quikPayTransDef == null) {
				quikPayTransDef = SpaceDef.create("QuikPayTransaction");
				quikPayTransDef.putFieldDef(FieldDef.create("transactionID", FieldType.STRING));
		        quikPayTransDef.putFieldDef(FieldDef.create("accountDebit", FieldType.STRING).setNullable(true));
		        quikPayTransDef.putFieldDef(FieldDef.create("accountCredit", FieldType.STRING));
		        quikPayTransDef.putFieldDef(FieldDef.create("amount", FieldType.STRING).setNullable(true));
		        quikPayTransDef.setKeyDef(KeyDef.create().setFieldNames("transactionID").setIndexType(IndexType.HASH));
		        quikPayTransDef.setPersistenceDistributionPolicy(SpaceDef.DistributionPolicy.NON_DISTRIBUTED);
		        quikPayTransDef.setPersistencePolicy(SpaceDef.PersistencePolicy.NONE);
		        quikPayTransDef.setHostAwareReplication(false);
		        quikPayTransDef.setTTL(180000);
		        quikPayTransDef.setReplicationCount(1);
		        
		        try {
					ms.defineSpace(quikPayTransDef);
				} catch (ASException e) {
					 IBSSystem.printConsole(e.getMessage());
				}
			}
		} catch (ASException e) {
			IBSSystem.printConsole(e.getMessage());
		}
		
		SpaceDef rmScheduleDef = null;
		try {
			rmScheduleDef = ms.getSpaceDef("RMSchedule");
			
			if(rmScheduleDef == null) {
				rmScheduleDef = SpaceDef.create("RMSchedule");
				rmScheduleDef.putFieldDef(FieldDef.create("startTime", FieldType.STRING));
				rmScheduleDef.putFieldDef(FieldDef.create("endTime", FieldType.STRING));
				rmScheduleDef.putFieldDef(FieldDef.create("customerID", FieldType.STRING));
				rmScheduleDef.putFieldDef(FieldDef.create("rmID", FieldType.STRING));
				rmScheduleDef.putFieldDef(FieldDef.create("loanData", FieldType.STRING));
				rmScheduleDef.setKeyDef(KeyDef.create().setFieldNames("startTime", "customerID").setIndexType(IndexType.HASH));
				rmScheduleDef.setPersistenceDistributionPolicy(SpaceDef.DistributionPolicy.NON_DISTRIBUTED);
				rmScheduleDef.setPersistenceType(SpaceDef.PersistenceType.SHARE_NOTHING);
				rmScheduleDef.setPersistencePolicy(SpaceDef.PersistencePolicy.ASYNC);
				rmScheduleDef.setHostAwareReplication(false);
				rmScheduleDef.setReplicationCount(1);
		        
		        try {
					ms.defineSpace(rmScheduleDef);
				} catch (ASException e) {
					 IBSSystem.printConsole(e.getMessage());
				}
			}
		} catch (ASException e) {
			IBSSystem.printConsole(e.getMessage());
		}
        
        SpaceDef verificationApprovalDef = null;;
		try {
			verificationApprovalDef = ms.getSpaceDef("VerificationApproval");
			
			if(verificationApprovalDef == null) {
				verificationApprovalDef = SpaceDef.create("VerificationApproval");
				verificationApprovalDef.putFieldDef(FieldDef.create("verificationCode", FieldType.STRING));
				verificationApprovalDef.putFieldDef(FieldDef.create("sessionID", FieldType.STRING));
				verificationApprovalDef.setKeyDef(KeyDef.create().setFieldNames("verificationCode").setIndexType(IndexType.HASH));
				verificationApprovalDef.setPersistenceDistributionPolicy(SpaceDef.DistributionPolicy.NON_DISTRIBUTED);
				verificationApprovalDef.setPersistencePolicy(SpaceDef.PersistencePolicy.NONE);
				verificationApprovalDef.setHostAwareReplication(false);
                verificationApprovalDef.setTTL(15000);
                verificationApprovalDef.setReplicationCount(1);
		        
		        try {
					ms.defineSpace(verificationApprovalDef);
				} catch (ASException e) {
					 IBSSystem.printConsole(e.getMessage());
				}
			}
		} catch (ASException e) {
			 IBSSystem.printConsole(e.getMessage());
		}

        try {
            spaceDir.put(loginTransDef.getName(),ms.getSpace(loginTransDef.getName(), DistributionRole.SEEDER));
            spaceDir.put(loginSessionDef.getName(),ms.getSpace(loginSessionDef.getName(), DistributionRole.SEEDER));
            spaceDir.put(loginSessionNotificationDef.getName(),ms.getSpace(loginSessionNotificationDef.getName(), DistributionRole.SEEDER));
            spaceDir.put(wsdlMsgsDef.getName(),ms.getSpace(wsdlMsgsDef.getName(), DistributionRole.SEEDER));
            spaceDir.put(wsdlMsgsRepListDef.getName(),ms.getSpace(wsdlMsgsRepListDef.getName(), DistributionRole.SEEDER));
            spaceDir.put(quikPayTransDef.getName(),ms.getSpace(quikPayTransDef.getName(), DistributionRole.SEEDER));
            spaceDir.put(rmScheduleDef.getName(),ms.getSpace(rmScheduleDef.getName(), DistributionRole.SEEDER));
            spaceDir.put(verificationApprovalDef.getName(),ms.getSpace(verificationApprovalDef.getName(), DistributionRole.SEEDER));
        } catch(ASException e) {
            IBSSystem.printConsole(e.getMessage());
        }
        
      //timer end
        IBSSystem.printConsole("Grid initialized in: " + (System.nanoTime() - startTime) / 1000000.00 + "ms");
    }
    
    private void waitForSpaceInit() throws Exception{
    	//timer start
    	long startTime = System.nanoTime();
    	
    	for(String k : spaceDir.keySet()) {
            Space s = spaceDir.get(k);
            if(!s.isReady()) {
                if(s.getSpaceDef().getPersistencePolicy() != SpaceDef.PersistencePolicy.NONE) {
                	IBSSystem.printConsole("Attempting space recovery: " + s.getName());
                	ms.recoverSpace(s.getName(), RecoveryOptions.create().setLoadWithData(true));
                }
                IBSSystem.printConsole("Waiting for space: " + s.getName() + " to be ready" );
                s.waitForReady();
            } else {
                IBSSystem.printConsole("Space: " + s.getName() + " is ready");
            }
        }
        IBSSystem.printConsole("All spaces ready!");
        
      //timer end
        IBSSystem.printConsole("Time spent waiting: " + (System.nanoTime() - startTime) / 1000000.00 + "ms");
    }
    
    private Space getSpace(String spaceName) throws Exception {
        Space selected = spaceDir.get(spaceName);
        if(selected == null) {
            throw new Exception("Space name invalid");
        } else {
            return selected;
        }
    }
    
    public void put(String spaceName, Tuple dataset) throws Exception {
        Space space = getSpace(spaceName);
        space.put(dataset);
    }
    
    public Tuple get(String spaceName, Tuple keyset) throws Exception {
        Space space = getSpace(spaceName);
        try {
            return space.get(keyset);
        } catch(ASException e) {
            throw new Exception(e.getMessage());
        }
    }
   
    public Tuple take(String spaceName, Tuple keyset) throws Exception {
        Space space = getSpace(spaceName);
        try {
            return space.take(keyset);
        } catch(ASException e) {
            throw new Exception(e.getMessage());
        }
    }
    
    public boolean delete(String spaceName, Tuple keyset) throws Exception {
        try {
            take(spaceName, keyset);
        } catch(ASException e) {
            return false;
        }
        return true;
    }
    
    public ArrayList<Tuple> filter(String spaceName, String filter) throws Exception{
    	Space space = getSpace(spaceName);
    	ArrayList<Tuple> resultSet = new ArrayList<Tuple>();
    	Browser browser = null;
    	try {
    		BrowserDef bd = BrowserDef.create(0, BrowserDef.TimeScope.ALL, BrowserDef.DistributionScope.ALL);
    		browser = space.browse(BrowserDef.BrowserType.GET, bd, filter);
    		
    		Tuple current = null;
    		while((current = browser.next()) != null) {
                resultSet.add(current);
    		}
    		return resultSet;
    	} catch(Exception e) {
    		throw new Exception(e.getMessage());
    	} finally {
    		if(browser != null) {
    			browser.stop();
    		}
    	}
    }

}