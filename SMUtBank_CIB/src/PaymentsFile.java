import java.util.ArrayList;


public class PaymentsFile {
	
	ArrayList<Payment> payments = new ArrayList<Payment>();

	public ArrayList<Payment> getPayments() {
		return payments;
	}

	public void setPayments(ArrayList<Payment> payments) {
		this.payments = payments;
	}
	public int size(){
		return payments.size();
	}

	public PaymentsFile(ArrayList<Payment> payments) {
		super();
		this.payments = payments;
	}
}
