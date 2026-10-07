export type PaymentMethod = "cash" | "bank" | "ewallet";

/** chi = chi tiêu, thu = thu nhập */
export type FlowKind = "chi" | "thu";

export type ChiCategoryId =
  | "an-uong"
  | "di-chuyen"
  | "mua-sam"
  | "hoa-don"
  | "giai-tri"
  | "suc-khoe"
  | "giao-duc"
  | "khac";

export type ThuCategoryId =
  | "luong"
  | "thuong"
  | "kinh-doanh"
  | "qua-tang"
  | "thu-khac";

export type CategoryId = ChiCategoryId | ThuCategoryId;

export interface Expense {
  id: string;
  amount: number;
  kind: FlowKind;
  category: CategoryId;
  note: string;
  payment_method: PaymentMethod;
  spent_at: string; // ISO
  created_at?: string;
  device_id?: string;
}

export interface NewExpense {
  amount: number;
  kind: FlowKind;
  category: CategoryId;
  note: string;
  payment_method: PaymentMethod;
  spent_at: string; // ISO
}
