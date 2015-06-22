package jms;

import java.io.IOException;

import javax.jms.*;

public class JMS implements ExceptionListener, MessageListener {

	Connection connection = null;
	Session session = null;
	MessageConsumer msgConsumer = null;
	Destination destination = null;
	boolean useTopic = true;

	String serverUrl = "tcp://localhost:5678";
	String userName = "SMUBank";
	String password = "SMUSIS";

	Destination replyDestination = null; // for request-reply
	MessageConsumer replyConsumer; // for request-reply
	MessageProducer msgProducer = null;

	public String sendMessage(String message, String queueName) {
		try {

			TextMessage msg;

			int i;

			if (message.length() == 0) {
				System.err
						.println("***Error: must specify at least one message text\n");
			}
			
			System.err.println("Publishing to destination '" + queueName
					+ "'\n");

			ConnectionFactory factory = new com.tibco.tibjms.TibjmsConnectionFactory(
					serverUrl);
			connection = factory.createConnection(userName, password);
			/* create the session */
			session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
			/* create the destination */

			destination = session.createQueue(queueName);

			replyDestination = session.createQueue(queueName+"_reply"); // for
																// request-reply
			/* create the producer */

			msgProducer = session.createProducer(destination); // changed for
																// request-reply
			replyConsumer = session.createConsumer(replyDestination); // for
																		// request-reply
			/* start the connection */
			connection.start();

			/* publish messages */

			msg = session.createTextMessage();

			/* set message text */

			msg.setText((String) message);

			msg.setJMSReplyTo(replyDestination); // for request-reply

			/* publish message */
			msgProducer.setPriority(9);
			msgProducer.send(msg); // changed for request-reply

			System.err.println("Published message: " + msg.getText());
			System.out.println("Sent request");
			System.out.println("\tTime:       " + System.currentTimeMillis()
					+ " ms");
			System.out.println("\tMessage ID: " + msg.getJMSMessageID());
			System.out.println("\tCorrel. ID: " + msg.getJMSCorrelationID());
			System.out.println("\tReply to:   " + msg.getJMSReplyTo());
			System.out.println("\tContents:   " + msg.getText());

			// Send a request and wait for a reply. Code also can be added to
			// time-out the wait

			TextMessage replyFromProcess = (TextMessage) replyConsumer.receive();
			
			// Process the reply.
			System.out.println("this is the reply "  + replyFromProcess.getText());
			connection.close();			
			return replyFromProcess.getText();
		}catch (JMSException e) {
			e.printStackTrace();
			System.exit(-1);
		}
		return "";
	}

	public void receive(String message, String queueName) {

		try {
			int c;

			ConnectionFactory factory = new com.tibco.tibjms.TibjmsConnectionFactory(
					serverUrl);

			/* create the connection */
			connection = factory.createConnection(userName, password);

			/* create the session */
			session = connection.createSession(false,
					javax.jms.Session.AUTO_ACKNOWLEDGE);

			/* set the exception listener */
			connection.setExceptionListener(this);

			/* create the destination */
			destination = session.createQueue(queueName);

			System.err.println("Subscribing to destination: " + queueName);

			/* create the consumer */
			msgConsumer = session.createConsumer(destination);

			/* set the message listener */
			msgConsumer.setMessageListener(this);

			/* start the connection */
			connection.start();

			// Note: when message callback is used, the session
			// creates the dispatcher thread which is not a daemon
			// thread by default. Thus we can quit this method however
			// the application will keep running. It is possible to
			// specify that all session dispatchers are daemon threads.
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void receiveMessage() {

	}

	@Override
	public void onMessage(Message msg) {
		try {
			System.err.println("Received message: " + msg);
		} catch (Exception e) {
			System.err.println("Unexpected exception in the message callback!");
			e.printStackTrace();
			System.exit(-1);
		}

	}

	@Override
	public void onException(JMSException arg0) {
		// TODO Auto-generated method stub
		System.err.println("CONNECTION EXCEPTION: " + arg0.getMessage());
	}

}
