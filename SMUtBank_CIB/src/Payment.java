import java.util.Date;


public class Payment {
	private int customerId;
	private String customerIdStr;
	private int lineNumber;
	private String paymentType;
	private Date date;
	private double amount;
//	private String currency;
	private String fromBankCode;
	private int fromBankAccountNumber;
	private String toBankCode;
	private int toBankAccountNumber;
	private String someNumber;
	private String comment;
	
	public Payment(int customerId, int lineNumber, String paymentType, Date date, double amount,
			String fromBankCode, int fromBankAccountNumber,
			String toBankCode, int toBankAccountNumber, String someNumber,
			String comment) {
		super();
		this.customerId=customerId;
		this.lineNumber = lineNumber;
		this.paymentType = paymentType;
		this.date = date;
		this.amount = amount;
//		this.currency = currency;
		this.fromBankCode = fromBankCode;
		this.fromBankAccountNumber = fromBankAccountNumber;
		this.toBankCode = toBankCode;
		this.toBankAccountNumber = toBankAccountNumber;
		this.someNumber = someNumber;
		this.comment = comment;
	}
	
	public Payment(String customerId, int lineNumber, String paymentType, Date date, double amount,
			String fromBankCode, int fromBankAccountNumber,
			String toBankCode, int toBankAccountNumber, String someNumber,
			String comment) {
		super();
		this.customerIdStr=customerId;
		this.lineNumber = lineNumber;
		this.paymentType = paymentType;
		this.date = date;
		this.amount = amount;
//		this.currency = currency;
		this.fromBankCode = fromBankCode;
		this.fromBankAccountNumber = fromBankAccountNumber;
		this.toBankCode = toBankCode;
		this.toBankAccountNumber = toBankAccountNumber;
		this.someNumber = someNumber;
		this.comment = comment;
	}
	
	public int getCustomerId() {
		return customerId;
	}
	public void setCustomerId(int customerId) {
		this.customerId = customerId;
	}
	public String getPaymentType() {
		return paymentType;
	}
	public void setPaymentType(String paymentType) {
		this.paymentType = paymentType;
	}
	public Date getDate() {
		return date;
	}
	public void setDate(Date date) {
		this.date = date;
	}
	public double getAmount() {
		return amount;
	}
	public void setAmount(double amount) {
		this.amount = amount;
	}
//	public String getCurrency() {
//		return currency;
//	}
//	public void setCurrency(String currency) {
//		this.currency = currency;
//	}
	public String getFromBankCode() {
		return fromBankCode;
	}
	public void setFromBankCode(String fromBankCode) {
		this.fromBankCode = fromBankCode;
	}
	public int getFromBankAccountNumber() {
		return fromBankAccountNumber;
	}
	public void setFromBankAccountNumber(int fromBankAccountNumber) {
		this.fromBankAccountNumber = fromBankAccountNumber;
	}
	public String getToBankCode() {
		return toBankCode;
	}
	public void setToBankCode(String toBankCode) {
		this.toBankCode = toBankCode;
	}
	public int getToBankAccountNumber() {
		return toBankAccountNumber;
	}
	public void setToBankAccountNumber(int toBankAccountNumber) {
		this.toBankAccountNumber = toBankAccountNumber;
	}
	public String getSomeNumber() {
		return someNumber;
	}
	public void setSomeNumber(String someNumber) {
		this.someNumber = someNumber;
	}
	public String getComment() {
		return comment;
	}
	public void setComment(String comment) {
		this.comment = comment;
	}
	public int getLineNumber() {
		return lineNumber;
	}
	public void setLineNumber(int lineNumber) {
		this.lineNumber = lineNumber;
	}
	
	public Payment(){super();}
	
	@Override
	public String toString() {
		return "Payment [customerId=" + customerId + ", lineNumber="
				+ lineNumber + ", paymentType=" + paymentType + ", date="
				+ date + ", amount=" + amount 
				+ ", fromBankCode=" + fromBankCode + ", fromBankAccountNumber="
				+ fromBankAccountNumber + ", toBankCode=" + toBankCode
				+ ", toBankAccountNumber=" + toBankAccountNumber
				+ ", someNumber=" + someNumber + ", comment=" + comment + "]";
	}

	public String getCustomerIdStr() {
		return customerIdStr;
	}

	public void setCustomerIdStr(String customerIdStr) {
		this.customerIdStr = customerIdStr;
	}

	public String toCSV(){
		return lineNumber  + ","
				+customerId  + "," + paymentType + ","
				+ date + "," + amount 
				+ "," + fromBankCode + ","
				+ fromBankAccountNumber + "," + toBankCode
				+ "," + toBankAccountNumber
				+ "," + someNumber + "," + comment;
	}
}
