import {
  Briefcase,
  Bike,
  Gift,
  GraduationCap,
  HeartPulse,
  HeartHandshake,
  Clapperboard,
  Package,
  Receipt,
  ShoppingBag,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import type { CategoryId, FlowKind } from "./types";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  color: string;
  Icon: typeof UtensilsCrossed;
}

/** Danh mục chi tiêu */
export const CATEGORIES: CategoryMeta[] = [
  { id: "an-uong", label: "Ăn uống", color: "#F0850C", Icon: UtensilsCrossed },
  { id: "di-chuyen", label: "Đi lại", color: "#0B87E5", Icon: Bike },
  { id: "mua-sam", label: "Mua sắm", color: "#9C27B0", Icon: ShoppingBag },
  { id: "hoa-don", label: "Hóa đơn", color: "#E5355B", Icon: Receipt },
  { id: "giai-tri", label: "Giải trí", color: "#00A693", Icon: Clapperboard },
  { id: "suc-khoe", label: "Sức khỏe", color: "#E91E63", Icon: HeartPulse },
  { id: "giao-duc", label: "Giáo dục", color: "#3F51B5", Icon: GraduationCap },
  { id: "khac", label: "Khác", color: "#757575", Icon: Package },
];

/** Danh mục thu nhập */
export const INCOME_CATEGORIES: CategoryMeta[] = [
  { id: "luong", label: "Lương", color: "#00A86B", Icon: Briefcase },
  { id: "thuong", label: "Thưởng", color: "#0B87E5", Icon: Gift },
  { id: "kinh-doanh", label: "Kinh doanh", color: "#9C27B0", Icon: TrendingUp },
  { id: "qua-tang", label: "Quà tặng", color: "#F471B5", Icon: HeartHandshake },
  { id: "thu-khac", label: "Khác", color: "#757575", Icon: Package },
];

export const categoriesFor = (kind: FlowKind): CategoryMeta[] =>
  kind === "thu" ? INCOME_CATEGORIES : CATEGORIES;

const ALL = [...CATEGORIES, ...INCOME_CATEGORIES];

export const categoryById = (id: string): CategoryMeta =>
  ALL.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

/** Màu dùng cho series Thu nhập trên biểu đồ */
export const THU_COLOR = "#00A86B";
