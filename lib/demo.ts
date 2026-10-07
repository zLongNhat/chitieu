import type { Expense } from "./types";

/** Dữ liệu mẫu để user mới vào thấy chi tiêu luôn. */
export function demoExpensesToday(): Expense[] {
  const now = new Date();
  const at = (h: number, m: number) => {
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  return [
    {
      id: "demo-thu-1",
      amount: 800000,
      kind: "thu",
      category: "luong",
      note: "Lương tuần",
      payment_method: "bank",
      spent_at: at(8, 0),
    },
    {
      id: "demo-1",
      amount: 45000,
      kind: "chi",
      category: "an-uong",
      note: "Cơm trưa văn phòng",
      payment_method: "cash",
      spent_at: at(7, 15),
    },
    {
      id: "demo-2",
      amount: 25000,
      kind: "chi",
      category: "di-chuyen",
      note: "Gửi xe + xăng",
      payment_method: "cash",
      spent_at: at(8, 5),
    },
    {
      id: "demo-3",
      amount: 89000,
      kind: "chi",
      category: "an-uong",
      note: "Trà sữa cả team",
      payment_method: "ewallet",
      spent_at: at(12, 30),
    },
    {
      id: "demo-4",
      amount: 150000,
      kind: "chi",
      category: "mua-sam",
      note: "Áo thun",
      payment_method: "bank",
      spent_at: at(15, 45),
    },
    {
      id: "demo-5",
      amount: 120000,
      kind: "chi",
      category: "hoa-don",
      note: "Tiền điện",
      payment_method: "bank",
      spent_at: at(17, 20),
    },
    {
      id: "demo-6",
      amount: 60000,
      kind: "chi",
      category: "giai-tri",
      note: "Vé xem phim",
      payment_method: "ewallet",
      spent_at: at(19, 40),
    },
  ];
}

const LOCAL_KEY = "chitieu-expenses-v1";

/** Fallback localStorage khi chưa cấu hình Supabase. */
export function loadLocal(): Expense[] | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Expense[];
  } catch {
    return null;
  }
}

export function saveLocal(list: Expense[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {
    /* bỏ qua */
  }
}
