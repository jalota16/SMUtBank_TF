import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.sql.Timestamp;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;


import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;
import jms.JMS;

import com.google.gson.JsonObject;


/**
 * Servlet implementation class PaymentsFileUploadServlet
 */
@WebServlet("/PaymentsFileUploadServlet")
@MultipartConfig(fileSizeThreshold = 1024 * 1024 * 2, // 2MB
maxFileSize = 1024 * 1024 * 10, // 10MB
maxRequestSize = 1024 * 1024 * 50)
// 50MB
public class PaymentsFileUploadServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;
	String listOfErrors;

	private static final String SAVE_DIR = "C:/tBank/PSH/landing_zone";

	/**
	 * @see HttpServlet#HttpServlet()
	 */
	public PaymentsFileUploadServlet() {
		super();
		// TODO Auto-generated constructor stub
	}

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doGet(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doPost(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		// String description = request.getParameter("description"); //
		// Retrieves <input type="text" name="description">
		listOfErrors="";
		Part filePart = request.getPart("filesParseCSV"); // Retrieves <input
															// type="file"
															// name="file">
		String fileName = getFileName(filePart);
		System.out.println(fileName + " gotten fil;e name");
		System.out.println(filePart.getSize() + "upload size");
		System.out.println(filePart.getContentType() + "content type");
		System.out.println(filePart.getHeaderNames() + "get headers");
		InputStream fileContent = filePart.getInputStream();

		ArrayList<Payment> paymentDetails = new ArrayList<Payment>();
		BufferedReader reader = new BufferedReader(new InputStreamReader(
				fileContent, "UTF-8"));
		String customerID = fileName.split("_")[2].substring(0,
				fileName.split("_")[2].lastIndexOf("."));

		String line;
		while ((line = reader.readLine()) != null) {
			Payment p = new Payment();

			String[] paymentLine = line.split(",");

			java.util.Date date= new java.util.Date();
			System.out.println(new Timestamp(date.getTime()));
			

			if (paymentLine[1].equalsIgnoreCase("CREDIT_TRANSFER")
					|| paymentLine[1].equalsIgnoreCase("DIRECT_DEBIT")) {
				try {
					p = new Payment(customerID,
							Integer.parseInt(paymentLine[0]), paymentLine[1],
							new SimpleDateFormat("yyyy-MM-dd")
									.parse(paymentLine[2]),
							Double.parseDouble(paymentLine[3]),
							paymentLine[4], Integer.parseInt(paymentLine[5]),
							paymentLine[6], Integer.parseInt(paymentLine[7]),
							paymentLine[8], paymentLine[9]);

					JMS jms = new JMS();
					String reply = jms.sendMessage(p.toCSV(), "csv_validate");
					if (reply.contains("invalid")) {
						String perLineError = "<tr>";
						String[] replyArray = reply.split(",");
						for (int i = 0; i < replyArray.length; i++) {
							if (i != 1) {
								if (replyArray[i].contains("invalid")) {
									perLineError = perLineError
											+ "<td><font color='red'>"
											+ replyArray[i] + "</font></td>";
								} else {
									perLineError = perLineError + "<td>"
											+ replyArray[i] + "</td>";
								}
							}
						}
						perLineError = perLineError + "</tr>";

						listOfErrors = listOfErrors + perLineError;
					}

				} catch (NumberFormatException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
					
					////do something about this!
				} catch (ParseException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
					
					///do something about this!!!
				} catch (Exception e) {

				}

			} else {

			}

		}

		reader.close();

		if (listOfErrors.length() == 0) {

			String randomNumber = "" + (long) (Math.random() * 99999999L);
			String filename = "corp_payment_" + randomNumber + "_" + customerID
					+ ".csv";

			String appPath = request.getServletContext().getRealPath("");
			// constructs path of the directory to save uploaded file

			File fileSaveDir = new File(SAVE_DIR);
			if (!fileSaveDir.exists()) {
				fileSaveDir.mkdirs();
			}
			// checkl if fiel exist, if yes delete
			if (this.checkIfFileExist(filename)) {
				// delete file
				try {

					// Delete if tempFile exists
					File fileTemp = new File(SAVE_DIR + "/" + filename);
					if (fileTemp.exists()) {
						fileTemp.delete();
					}
				} catch (Exception e) {
					// if any error occurs
					e.printStackTrace();
				}
			}

			// write file to disk
			for (Part part : request.getParts()) {
				part.write(SAVE_DIR + File.separator + filename);
			}

			JsonObject outerObject = new JsonObject();

			// check if file writing is succesful
			if (this.checkIfFileExist(filename)) {
				// file succesfully uploaded
				outerObject.addProperty("upload", "true");
			} else {
				// file !succesfully uploaded
				outerObject.addProperty("upload", "showfalse");
			}

			// return response
			response.setContentType("application/json");
			PrintWriter out = response.getWriter();
			System.out.println(outerObject);
			out.print(outerObject);
			out.flush();
			out.close();
		} else {
			JsonObject outerObject = new JsonObject();

			outerObject.addProperty("upload", listOfErrors);

			// return response
			response.setContentType("application/json");
			PrintWriter out = response.getWriter();
			System.out.println(outerObject);
			out.print(outerObject);
			out.flush();
			out.close();
		}
	}

	private static String getFileName(Part part) {
		for (String cd : part.getHeader("content-disposition").split(";")) {
			if (cd.trim().startsWith("filename")) {
				String fileName = cd.substring(cd.indexOf('=') + 1).trim()
						.replace("\"", "");
				return fileName.substring(fileName.lastIndexOf('/') + 1)
						.substring(fileName.lastIndexOf('\\') + 1); // MSIE fix.
			}
		}
		return null;
	}

	public boolean checkIfFileExist(String name) {
		// File f = new File(SAVE_DIR+"/"+name);
		if (new File(SAVE_DIR + "/" + name).isFile()) {
			/* do something */
			return true;
		}
		return false;
	}

}
