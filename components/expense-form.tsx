"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, PartyPopper, Plus } from "lucide-react";
import { CATEGORIES, categoryById } from "@/lib/categories";
import { formatVND } from "@/lib/format";
import { useExpenses } from "@/hooks/useExpenses";
import type { CategoryId, Expense, PaymentMethod } from "@/lib/types";

const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "cash", label: "Tiền mặt" },
  { id: "bank", label: "Chuyển khoản" },
  { id: "ewallet", label: "Ví điện tử" },
];

const QUICK_AMOUNTS = [20000, 50000, 100000, 200000, 500000];

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function ExpenseForm() {
  const router = useRouter();
  const { addExpense } = useExpenses();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId>("an-uong");
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [when, setWhen] = useState(() => toLocalInput(new Date().toISOString()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Expense | null>(null);

  const preview = useMemo(() => Number(amount.replace(/[^\d]/g, "")) || 0, [amount]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!preview || preview <= 0) {
      setError("Vui lòng nhập số tiền lớn hơn 0.");
      return;
    }
    if (!when || Number.isNaN(+new Date(when))) {
      setError("Ngày giờ chưa hợp lệ, vui lòng chọn lại.");
      return;
    }
    setSaving(true);
    try {
      const created = await addExpense({
        amount: preview,
        category,
        note: note.trim(),
        payment_method: method,
        spent_at: new Date(when).toISOString(),
      });
      // Hiện xác nhận rõ ràng thay vì redirect ngay
      // (tránh cảm giác "bấm lưu xong chẳng thấy gì")
      setSaved(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại, thử lại.");
    } finally {
      setSaving(false);
    }
  }

  function resetForNext() {
    setSaved(null);
    setAmount("");
    setNote("");
    setWhen(toLocalInput(new Date().toISOString()));
    setError("");
  }

  // text-base (16px) cho input để iOS không tự zoom khi focus
  const inputCls =
    "mt-2 w-full rounded-2xl border border-black/10 bg-transparent p-3.5 text-base outline-none focus:border-[#65558f] dark:border-white/15";

  if (saved) {
    const c = categoryById(saved.category);
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-4 pt-5 pb-10 sm:px-6">
        <div className="m3-card flex flex-col items-center p-8 text-center sm:p-12">
          <span
            className="grid size-16 place-items-center rounded-full text-white"
            style={{ background: "var(--m3-primary)" }}
          >
            <PartyPopper className="size-8" />
          </span>
          <h1 className="mt-4 text-2xl font-black">Đã lưu!</h1>
          <p className="mt-1 text-4xl font-black" style={{ color: "var(--m3-primary)" }}>
            {formatVND(saved.amount)}
          </p>
          <p className="mt-2 text-sm opacity-70">
            {c.label} •{" "}
            {new Date(saved.spent_at).toLocaleString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              day: "numeric",
              month: "numeric",
            })}
            {saved.note ? ` • ${saved.note}` : ""}
          </p>
          <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
            <button
              onClick={() => router.push("/")}
              className="m3-primary-btn flex min-h-[52px] items-center justify-center gap-2 !rounded-2xl p-4 text-base font-extrabold"
            >
              <Check className="size-5" /> Xem tổng quan
            </button>
            <button
              onClick={resetForNext}
              className="m3-tonal flex min-h-[52px] items-center justify-center gap-2 !rounded-2xl p-4 text-base font-extrabold"
            >
              <Plus className="size-5" /> Nhập tiếp
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-4 pt-5 pb-10 sm:px-6">
      <header className="m3-card flex items-center gap-3 p-4">
        <Link href="/" aria-label="Về dashboard" className="m3-tonal grid size-11 shrink-0 place-items-center !rounded-full">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg font-extrabold">Nhập chi tiêu</h1>
          <p className="truncate text-xs opacity-60">Lưu xong dashboard cập nhật realtime</p>
        </div>
      </header>

      <form onSubmit={submit} className="m3-card flex flex-col gap-5 p-4 sm:p-7">
        <div>
          <label className="text-sm font-bold">Số tiền (VND)</label>
          <input
            inputMode="numeric"
            autoComplete="off"
            placeholder="VD: 50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-2 w-full rounded-3xl border border-black/10 bg-black/[0.03] p-4 text-3xl font-black outline-none focus:border-[#65558f] sm:p-5 dark:border-white/15 dark:bg-white/5"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((q) => (
              <button
                type="button"
                key={q}
                onClick={() => setAmount(String(q))}
                className="m3-tonal min-h-[40px] rounded-full px-3.5 text-xs font-extrabold transition active:scale-95"
              >
                {q >= 1000 ? `${q / 1000}k` : q}
              </button>
            ))}
          </div>
          {preview > 0 && <p className="mt-2 text-sm font-bold text-[#65558f]">= {formatVND(preview)}</p>}
        </div>

        <div>
          <label className="text-sm font-bold">Danh mục</label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CATEGORIES.map((c) => {
              const Icon = c.Icon;
              const active = category === c.id;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`flex min-h-[52px] items-center gap-2 rounded-2xl border p-3 text-left text-sm font-bold transition active:scale-[0.98] ${
                    active ? "border-transparent text-white" : "border-black/10 dark:border-white/15"
                  }`}
                  style={active ? { background: c.color } : undefined}
                >
                  <Icon className="size-5 shrink-0" />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-bold">Ngày giờ</label>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className={`${inputCls} [color-scheme:light] dark:[color-scheme:dark]`}
            />
          </div>
          <div>
            <label className="text-sm font-bold">Phương thức</label>
            <div className="m3-segmented mt-2 grid grid-cols-3 gap-1">
              {METHODS.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  data-active={method === m.id}
                  onClick={() => setMethod(m.id)}
                  className="min-h-[44px] px-2 py-2.5 text-xs"
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold">Ghi chú</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: Cơm trưa, đổ xăng..."
            maxLength={120}
            className={inputCls}
          />
        </div>

        {error && <p className="rounded-2xl bg-red-500/10 p-3 text-sm font-bold text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="m3-primary-btn flex min-h-[52px] items-center justify-center gap-2 !rounded-2xl p-4 text-base font-extrabold disabled:opacity-50"
        >
          <Check className="size-5" />
          {saving ? "Đang lưu..." : "Lưu chi tiêu"}
        </button>
      </form>
    </div>
  );
}
