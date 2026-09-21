export type FinancialYear = {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
};

export type Labourer = {
  id: string;
  name: string;
  phone: string | null;
  default_rate: number | null;
  notes: string | null;
  created_at: string;
};

export type Vendor = {
  id: string;
  name: string;
  phone: string | null;
  category: string | null;
  notes: string | null;
  created_at: string;
};

export type ProjectStatus = "ongoing" | "completed" | "on_hold";

export type Project = {
  id: string;
  client_id: string | null;
  financial_year_id: string | null;
  name: string;
  site_address: string | null;
  status: ProjectStatus;
  created_at: string;
};

export type ClientWork = {
  id: string;
  client_id: string;
  project_id: string | null;
  financial_year_id: string | null;
  bill_no?: string | null;
  description: string;
  amount: number;
  work_date: string;
  created_at: string;
};

export type PaymentMode = "Cash" | "UPI" | "Bank Transfer" | "Cheque" | "Other";

export type ClientPayment = {
  id: string;
  client_id: string;
  project_id: string | null;
  financial_year_id: string | null;
  amount: number;
  payment_date: string;
  note: string | null;
  payment_mode?: PaymentMode | null;
  created_at: string;
};

export type LabourWork = {
  id: string;
  labourer_id: string;
  project_id: string | null;
  financial_year_id: string | null;
  site_location?: string | null;
  client_name?: string | null;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  work_date: string;
  created_at: string;
};

export type LabourEntryType = "Payment" | "Advance";

export type LabourPayment = {
  id: string;
  labourer_id: string;
  financial_year_id: string | null;
  amount: number;
  payment_date: string;
  note: string | null;
  payment_mode?: PaymentMode | null;
  entry_type?: LabourEntryType;
  created_at: string;
};

export type VendorBill = {
  id: string;
  vendor_id: string;
  project_id: string | null;
  financial_year_id: string | null;
  bill_no?: string | null;
  description: string;
  amount: number;
  bill_date: string;
  created_at: string;
};

export type VendorPayment = {
  id: string;
  vendor_id: string;
  financial_year_id: string | null;
  amount: number;
  payment_date: string;
  note: string | null;
  payment_mode?: PaymentMode | null;
  created_at: string;
};

export type ClientBalance = {
  client_id: string;
  name: string;
  total_work: number;
  total_paid: number;
  balance: number;
};

export type LabourBalance = {
  labourer_id: string;
  name: string;
  total_work: number;
  total_paid: number;
  balance: number;
};

export type VendorBalance = {
  vendor_id: string;
  name: string;
  total_billed: number;
  total_paid: number;
  balance: number;
};

export type TransactionKind =
  | "client_work"
  | "client_payment"
  | "labour_work"
  | "labour_payment"
  | "vendor_bill"
  | "vendor_payment";

export type Transaction = {
  id: string;
  kind: TransactionKind;
  entity_id: string;
  project_id: string | null;
  financial_year_id: string | null;
  description: string;
  amount: number;
  txn_date: string;
  created_at: string;
  created_by?: string | null;
};
