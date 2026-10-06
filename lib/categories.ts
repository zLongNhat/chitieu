import {
  UtensilsCrossed,
  Bike,
  ShoppingBag,
  Receipt,
  Clapperboard,
  HeartPulse,
  GraduationCap,
  Package,
} from "lucide-react";
import type { CategoryId } from "./types";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  color: string;
  Icon: typeof UtensilsCrossed;
}

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

export const categoryById = (id: string): CategoryMeta =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
