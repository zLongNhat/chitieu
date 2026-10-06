export type PaymentMethod = "cash" | "bank" | "ewallet";

export type CategoryId =
  | "an-uong"
  | "di-chuyen"
  | "mua-sam"
  | "hoa-don"
  | "giai-tri"
  | "suc-khoe"
  | "giao-duc"
  | "khac";

export interface Expense {
  id: string;
  amount: number;
  category: CategoryId;
  note: string;
  payment_method: PaymentMethod;
  spent_at: string; // ISO
  created_at?: string;
  device_id?: string;
}

export interface NewExpense {
  amount: number;
  category: CategoryId;
  note: string;
  payment_method: PaymentMethod;
  spent_at: string; // ISO
}
