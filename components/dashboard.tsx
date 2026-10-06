"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChartPie,
  Copy,
  Download,
  LayoutDashboard,
  Moon,
  Plus,
  RefreshCw,
  Sun,
  Tags,
  Trash2,
  Wallet,
} from "lucide-react";
import { CATEGORIES, categoryById } from "@/lib/categories";
import { MONTH_SHORT, formatTime, formatVND, isSameDay, last7Days } from "@/lib/format";
import { setSyncId } from "@/lib/device";
import { useExpenses } from "@/hooks/useExpenses";

type Tab = "day" | "month";

const compact = (v: number) =>
  v >= 1_000_000 ? `${Math.round(v / 100000) / 10}tr` : v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`;

const METHODS = [
  { id: "cash", label: "Tiền mặt", color: "#0B87E5" },
  { id: "bank", label: "Chuyển khoản", color: "#65558F" },
  { id: "ewallet", label: "Ví điện tử", color: "#E91E63" },
] as const;

const chartTheme = (dark: boolean) =>
  dark
    ? {
        grid: "rgba(255,255,255,0.08)",
        tick: "#938F99",
        primary: "#D0BCFF",
        avg: "#F471B5",
        barFrom: "#D0BCFF",
        barTo: "#4F378B",
        pieStroke: "#1D1B20",
        areaFrom: "rgba(208,188,255,0.50)",
        areaTo: "rgba(208,188,255,0.03)",
      }
    : {
        grid: "rgba(29,27,32,0.10)",
        tick: "#49454F",
        primary: "#65558F",
        avg: "#C2185B",
        barFrom: "#65558F",
        barTo: "#C4B5E8",
        pieStroke: "#FDF8FD",
        areaFrom: "rgba(101,85,143,0.45)",
        areaTo: "rgba(101,85,143,0.03)",
      };

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function M3Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 text-xs shadow-xl"
      style={{
        background: "var(--m3-surface-container-high)",
        border: "1px solid var(--m3-outline)",
        borderRadius: 16,
      }}
    >
      <p className="mb-1 font-bold opacity-70">{label}</p>
      {payload.map((p: { name?: string; value?: number | string; color?: string }, i: number) => (
        <p key={i} className="font-extrabold" style={{ color: p.color ?? "var(--m3-primary)" }}>
          {p.name ? `${p.name}: ` : ""}
          {formatVND(Number(p.value))}
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { expenses, loading, refreshing, error, isDemo, isSupabase, syncId, refetch, deleteExpense, clearDemo } =
    useExpenses();
  const [tab, setTab] = useState<Tab>("day");
  const [dark, setDark] = useState(false);
  const now = useMemo(() => new Date(), []);
  const ct = chartTheme(dark);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("chitieu-theme", next ? "dark" : "light");
    } catch {
      /* bỏ qua */
    }
  };

  /* ---------- mã đồng bộ đa thiết bị ---------- */
  const copySync = async () => {
    try {
      await navigator.clipboard.writeText(syncId);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = syncId;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  };
  const changeSync = () => {
    const v = prompt(
      "Nhập mã đồng bộ từ thiết bị khác để xem chung dữ liệu.\nĐể trống = tạo mã mới.",
      "",
    );
    if (v === null) return; // bấm Cancel
    setSyncId(v);
    window.location.reload();
  };

  /* ---------- derived data ---------- */
  const dayList = useMemo(
    () =>
      expenses
        .filter((e) => isSameDay(new Date(e.spent_at), now))
        .sort((a, b) => +new Date(b.spent_at) - +new Date(a.spent_at)),
    [expenses, now],
  );
  const monthList = useMemo(
    () =>
      expenses
        .filter((e) => {
          const d = new Date(e.spent_at);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        })
        .sort((a, b) => +new Date(b.spent_at) - +new Date(a.spent_at)),
    [expenses, now],
  );

  const totalDay = dayList.reduce((s, e) => s + e.amount, 0);
  const totalMonth = monthList.reduce((s, e) => s + e.amount, 0);

  const yesterday = useMemo(() => {
    const d = new Date(now);
    d.setDate(now.getDate() - 1);
    return expenses
      .filter((e) => isSameDay(new Date(e.spent_at), d))
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses, now]);
  const pctVsYesterday = yesterday > 0 ? Math.round(((totalDay - yesterday) / yesterday) * 100) : totalDay > 0 ? 100 : 0;

  const trendDay = useMemo(() => {
    const days = last7Days(now);
    const rows = days.map((d) => ({
      name: isSameDay(d, now) ? "H.nay" : `${d.getDate()}/${d.getMonth() + 1}`,
      total: expenses.filter((e) => isSameDay(new Date(e.spent_at), d)).reduce((s, e) => s + e.amount, 0),
    }));
    const avg = Math.round(rows.reduce((s, r) => s + r.total, 0) / 7);
    return rows.map((r) => ({ ...r, avg }));
  }, [expenses, now]);

  const trendMonth = useMemo(() => {
    const y = now.getFullYear();
    const rows = MONTH_SHORT.map((name, m) => ({
      name,
      total: expenses
        .filter((e) => {
          const d = new Date(e.spent_at);
          return d.getFullYear() === y && d.getMonth() === m;
        })
        .reduce((s, e) => s + e.amount, 0),
    }));
    const avg = Math.round(rows.reduce((s, r) => s + r.total, 0) / 12);
    return rows.map((r) => ({ ...r, avg }));
  }, [expenses, now]);

  const trend = tab === "day" ? trendDay : trendMonth;
  const maxTrend = trend.reduce((m, r) => Math.max(m, r.total), 0);

  const pieSource = tab === "day" ? dayList : monthList;
  const pieCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of pieSource) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    const total = [...map.values()].reduce((s, v) => s + v, 0) || 1;
    return [...map.entries()].map(([id, value]) => ({
      id,
      name: categoryById(id).label,
      value,
      pct: Math.round((value / total) * 100),
      color: categoryById(id).color,
    }));
  }, [pieSource]);

  const piePay = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of pieSource) map.set(e.payment_method, (map.get(e.payment_method) ?? 0) + e.amount);
    const total = [...map.values()].reduce((s, v) => s + v, 0) || 1;
    return METHODS.map((m) => ({
      ...m,
      value: map.get(m.id) ?? 0,
      pct: Math.round(((map.get(m.id) ?? 0) / total) * 100),
    })).filter((m) => m.value > 0);
  }, [pieSource]);

  const weekBar = useMemo(() => {
    const start = new Date(now);
    const dow = (start.getDay() + 6) % 7; // T2 = 0
    start.setDate(start.getDate() - dow);
    start.setHours(0, 0, 0, 0);
    const names = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    return names.map((name, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        name,
        total: expenses.filter((e) => isSameDay(new Date(e.spent_at), d)).reduce((s, e) => s + e.amount, 0),
      };
    });
  }, [expenses, now]);

  const topCatMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of monthList) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    let best: { id: string; value: number } | null = null;
    for (const [id, value] of map) if (!best || value > best.value) best = { id, value };
    return best;
  }, [monthList]);

  const catMonthTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of monthList) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return CATEGORIES.map((c) => ({ ...c, total: map.get(c.id) ?? 0 }));
  }, [monthList]);

  const avgPerDay = now.getDate() > 0 ? Math.round(totalMonth / now.getDate()) : 0;
  const activeList = tab === "day" ? dayList : monthList;

  /* ---------- export CSV ---------- */
  const exportCSV = () => {
    const rows = [["Ngay", "Danh muc", "Ghi chu", "Phuong thuc", "So tien (VND)"]];
    for (const e of monthList) {
      rows.push([
        new Date(e.spent_at).toLocaleString("vi-VN"),
        categoryById(e.category).label,
        (e.note || "").replace(/"/g, '""'),
        e.payment_method,
        String(e.amount),
      ]);
    }
    const csv = "﻿" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `chi-tieu-${now.getFullYear()}-${now.getMonth() + 1}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl">
        {/* ============ DRAWER (sidebar M3) ============ */}
        <aside
          className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-5 overflow-y-auto p-4 lg:flex"
          style={{ background: "var(--m3-surface)", borderRight: "1px solid var(--m3-surface-container-high)" }}
        >
          <p className="px-3 pt-1 text-lg font-black tracking-tight">Chi tiêu</p>

          <nav>
            <p className="px-3 text-[11px] font-extrabold tracking-widest opacity-50">MENU</p>
            <Link href="/" className="m3-nav-active mt-1.5 flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm">
              <LayoutDashboard className="size-4" /> Tổng quan
            </Link>
            <Link
              href="/add"
              className="mt-1 flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
            >
              <Plus className="size-4" /> Thêm chi tiêu
            </Link>
          </nav>

          <div>
            <p className="flex items-center gap-1.5 px-3 text-[11px] font-extrabold tracking-widest opacity-50">
              <Tags className="size-3.5" /> DANH MỤC THÁNG NÀY
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {catMonthTotals.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-full px-4 py-1.5 text-[13px]">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="size-2.5 rounded-full" style={{ background: c.color }} />
                    {c.label}
                  </span>
                  <span className="font-bold opacity-60">{compact(c.total)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="m3-tonal mt-auto p-4">
            <p className="text-sm font-extrabold">Xuất báo cáo</p>
            <p className="mt-0.5 text-xs opacity-60">CSV chi tiêu tháng {now.getMonth() + 1}</p>
            <button
              onClick={exportCSV}
              className="m3-primary-btn mt-3 flex w-full items-center justify-center gap-1.5 py-2.5 text-sm font-extrabold transition hover:scale-[1.02]"
            >
              <Download className="size-4" /> Tải xuống
            </button>
          </div>
        </aside>

        {/* ============ MAIN ============ */}
        <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 pb-28 sm:p-6 lg:pb-10">
          {/* header */}
          <div className="m3-card flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase opacity-60">Tổng quan chi tiêu</p>
              <h1 className="mt-1 text-xl font-extrabold sm:text-2xl">
                {now.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric", year: "numeric" })}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-xs opacity-70">
                <span className={`inline-block size-2 rounded-full ${isSupabase ? "bg-emerald-500" : "bg-amber-500"}`} />
                {isSupabase ? "Supabase realtime" : "Local (chưa cấu hình Supabase)"}
                {isDemo ? " • đang xem dữ liệu mẫu" : ""}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                <span className="opacity-70">Mã đồng bộ:</span>
                <b className="rounded-md bg-black/5 px-1.5 py-0.5 font-mono dark:bg-white/10">
                  {syncId ? (syncId.length > 12 ? `${syncId.slice(0, 8)}…` : syncId) : "…"}
                </b>
                <button
                  onClick={copySync}
                  aria-label="Copy mã đồng bộ"
                  className="grid size-6 place-items-center rounded-full opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                >
                  <Copy className="size-3.5" />
                </button>
                <button onClick={changeSync} className="font-bold underline opacity-70 hover:opacity-100">
                  đổi
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                aria-label="Đổi theme"
                className="m3-tonal grid size-11 place-items-center !rounded-full transition hover:scale-105"
              >
                {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </button>
              <Link
                href="/add"
                className="m3-primary-btn hidden items-center gap-1.5 px-4 py-3 text-sm font-bold transition hover:scale-[1.03] sm:flex"
              >
                <Plus className="size-5" /> Thêm
              </Link>
            </div>
          </div>

          {/* tabs Ngày | Tháng */}
          <div className="m3-segmented grid grid-cols-2 gap-1" role="tablist">
            {(["day", "month"] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                data-active={tab === t}
                onClick={() => setTab(t)}
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm"
              >
                {t === "day" ? <CalendarDays className="size-4" /> : <ChartPie className="size-4" />}
                {t === "day" ? "Ngày" : "Tháng"}
              </button>
            ))}
          </div>

          {error && !loading && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-3xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
              <p>
                <b>Không tải được dữ liệu:</b> {error}
                <br />
                <span className="opacity-70">Kiểm tra mạng rồi bấm thử lại. Nhập mã đồng bộ đúng máy nếu xem ở thiết bị khác.</span>
              </p>
              <button
                onClick={refetch}
                className="m3-primary-btn flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
              >
                <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} /> Thử lại
              </button>
            </div>
          )}

          {isDemo && !loading && !error && (
            <div className="m3-tonal flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
              <p>
                Bạn đang xem <b>dữ liệu mẫu</b> để thấy giao diện ngay. Nhập khoản đầu tiên để thay bằng số liệu thật.
              </p>
              <div className="flex gap-2">
                <button onClick={clearDemo} className="rounded-full px-3 py-2 text-xs font-bold underline">
                  Xóa mẫu
                </button>
                <Link href="/add" className="m3-primary-btn px-4 py-2 text-xs font-bold">
                  Nhập chi tiêu
                </Link>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="m3-card h-36" />
              ))}
            </div>
          ) : (
            <>
              {/* ===== stat cards ===== */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <div
                  className="relative overflow-hidden p-4 sm:p-5"
                  style={{ background: "var(--m3-primary-container)", color: "var(--m3-on-primary-container)", borderRadius: 28 }}
                >
                  <div className="absolute -right-8 -bottom-10 size-40 rounded-full bg-white/15" />
                  <div className="absolute right-6 -bottom-6 size-20 rounded-full bg-white/15" />
                  <p className="text-sm font-semibold opacity-80">Chi tiêu hôm nay</p>
                  <p className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">{formatVND(totalDay)}</p>
                  <p className="mt-1 text-xs font-semibold opacity-75">{dayList.length} giao dịch</p>
                </div>
                <div
                  className="relative overflow-hidden p-4 sm:p-5"
                  style={{ background: "var(--m3-secondary-container)", color: "var(--m3-on-primary-container)", borderRadius: 28 }}
                >
                  <div className="absolute -right-8 -bottom-10 size-40 rounded-full bg-white/15" />
                  <div className="absolute right-6 -bottom-6 size-20 rounded-full bg-white/15" />
                  <p className="text-sm font-semibold opacity-80">Chi tiêu tháng {now.getMonth() + 1}</p>
                  <p className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">{formatVND(totalMonth)}</p>
                  <p className="mt-1 text-xs font-semibold opacity-75">TB {formatVND(avgPerDay)}/ngày</p>
                </div>
                <div className="m3-card min-w-0 p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-semibold opacity-70">
                      <Wallet className="size-4" /> Giao dịch
                    </p>
                    <span
                      className="flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-extrabold"
                      style={{ background: "var(--m3-tertiary-container)" }}
                    >
                      {pctVsYesterday >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                      {Math.abs(pctVsYesterday)}%
                    </span>
                  </div>
                  <p className="mt-2 text-2xl sm:text-3xl font-black">{tab === "day" ? dayList.length : monthList.length}</p>
                  <p className="mt-1 text-xs opacity-60">so với hôm qua {formatVND(yesterday)}</p>
                </div>
                <div className="m3-card min-w-0 p-4 sm:p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold opacity-70">
                    <Tags className="size-4" /> Top danh mục tháng
                  </p>
                  {topCatMonth ? (
                    <>
                      <p className="mt-2 text-2xl sm:text-3xl font-black">{categoryById(topCatMonth.id).label}</p>
                      <p className="mt-1 text-xs opacity-60">{formatVND(topCatMonth.value)}</p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm opacity-60">Chưa có chi tiêu.</p>
                  )}
                </div>
              </div>

              {/* ===== trend + donut category ===== */}
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="m3-card min-w-0 p-4 sm:p-5 xl:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-extrabold">
                      {tab === "day" ? "Chi tiêu 7 ngày gần nhất" : `Chi tiêu 12 tháng năm ${now.getFullYear()}`}
                    </h2>
                    <div className="flex items-center gap-4 text-xs opacity-60">
                      <span className="flex items-center gap-1.5">
                        <span className="h-0.5 w-5 rounded" style={{ background: ct.primary }} /> Chi tiêu
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-0 w-5 border-t-2 border-dashed" style={{ borderColor: ct.avg }} /> Trung bình
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-56 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {tab === "day" ? (
                        <ComposedChart data={trend} margin={{ top: 10, right: 8, left: -6, bottom: 0 }} barCategoryGap="30%">
                          <defs>
                            <linearGradient id="trendBar" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={ct.barFrom} />
                              <stop offset="100%" stopColor={ct.barTo} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke={ct.grid} vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: ct.tick, fontSize: 11 }} tickLine={false} axisLine={false} interval={0} />
                          <YAxis tickFormatter={compact} tick={{ fill: ct.tick, fontSize: 11 }} tickLine={false} axisLine={false} width={52} />
                          <Tooltip content={<M3Tip />} cursor={{ fill: dark ? "rgba(255,255,255,0.05)" : "rgba(29,27,32,0.05)" }} />
                          <Bar dataKey="total" name="Chi tiêu" fill="url(#trendBar)" radius={[10, 10, 6, 6]} maxBarSize={44} />
                          <Line type="monotone" dataKey="avg" name="Trung bình" stroke={ct.avg} strokeWidth={2} strokeDasharray="6 5" dot={false} />
                        </ComposedChart>
                      ) : (
                        <AreaChart data={trend} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
                          <defs>
                            <linearGradient id="m3Fill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={ct.primary} stopOpacity={0.55} />
                              <stop offset="100%" stopColor={ct.primary} stopOpacity={0.03} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke={ct.grid} vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: ct.tick, fontSize: 11 }} tickLine={false} axisLine={false} interval={0} />
                          <YAxis tickFormatter={compact} tick={{ fill: ct.tick, fontSize: 11 }} tickLine={false} axisLine={false} width={52} />
                          <Tooltip content={<M3Tip />} />
                          <Area type="monotone" dataKey="total" name="Chi tiêu" stroke={ct.primary} strokeWidth={2.5} fill="url(#m3Fill)" />
                          <Line type="monotone" dataKey="avg" name="Trung bình" stroke={ct.avg} strokeWidth={2} strokeDasharray="6 5" dot={false} />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-1 text-xs opacity-60">
                    Cao nhất: <b style={{ color: "var(--m3-primary)" }}>{formatVND(maxTrend)}</b>
                  </p>
                </div>

                <div className="m3-card min-w-0 p-4 sm:p-5">
                  <h2 className="font-extrabold">{tab === "day" ? "Theo mục hôm nay" : "Theo mục tháng này"}</h2>
                  {pieCat.length === 0 ? (
                    <p className="py-10 text-center text-sm opacity-60">
                      Chưa có chi tiêu.{" "}
                      <Link href="/add" className="font-bold underline">
                        Thêm ngay
                      </Link>
                    </p>
                  ) : (
                    <>
                      <div className="relative h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieCat} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke={ct.pieStroke} strokeWidth={2}>
                              {pieCat.map((s) => (
                                <Cell key={s.id} fill={s.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<M3Tip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 grid place-items-center">
                          <div className="text-center">
                            <p className="text-[11px] opacity-60">Tổng</p>
                            <p className="text-sm font-black">{compact(tab === "day" ? totalDay : totalMonth)}</p>
                          </div>
                        </div>
                      </div>
                      <ul className="mt-2 max-h-36 space-y-1.5 overflow-y-auto">
                        {pieCat.map((s) => (
                          <li key={s.id} className="flex items-center justify-between text-[13px]">
                            <span className="flex items-center gap-2 font-semibold">
                              <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                              {s.name} <b className="opacity-50">{s.pct}%</b>
                            </span>
                            <b>{formatVND(s.value)}</b>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {/* ===== payment donut + week bar + history ===== */}
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="m3-card min-w-0 p-4 sm:p-5">
                  <h2 className="font-extrabold">Theo phương thức</h2>
                  {piePay.length === 0 ? (
                    <p className="py-10 text-center text-sm opacity-60">Chưa có dữ liệu.</p>
                  ) : (
                    <>
                      <div className="relative h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={piePay} dataKey="value" nameKey="label" innerRadius={56} outerRadius={78} paddingAngle={4} stroke={ct.pieStroke} strokeWidth={2} startAngle={90} endAngle={-270}>
                              {piePay.map((s) => (
                                <Cell key={s.id} fill={s.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<M3Tip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 grid place-items-center">
                          <p className="text-sm font-black">{formatVND(piePay.reduce((s, x) => s + x.value, 0))}</p>
                        </div>
                      </div>
                      <ul className="mt-2 space-y-2">
                        {piePay.map((s) => (
                          <li key={s.id} className="flex items-center justify-between text-[13px]">
                            <span className="flex items-center gap-2 font-semibold">
                              <span className="grid size-4 place-items-center rounded-full border-2" style={{ borderColor: s.color }}>
                                <span className="size-1 rounded-full" style={{ background: s.color }} />
                              </span>
                              {s.label}
                            </span>
                            <span className="font-bold">
                              {s.pct}% <span className="font-semibold opacity-60">• {compact(s.value)}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                <div className="m3-card min-w-0 p-4 sm:p-5">
                  <h2 className="font-extrabold">Chi tiêu theo thứ (tuần này)</h2>
                  <div className="mt-2 h-56 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weekBar} margin={{ top: 10, right: 4, left: -14, bottom: 0 }}>
                        <defs>
                          <linearGradient id="m3Bar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={ct.barFrom} />
                            <stop offset="100%" stopColor={ct.barTo} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke={ct.grid} vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: ct.tick, fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tickFormatter={compact} tick={{ fill: ct.tick, fontSize: 11 }} tickLine={false} axisLine={false} width={50} />
                        <Tooltip content={<M3Tip />} cursor={{ fill: dark ? "rgba(255,255,255,0.05)" : "rgba(29,27,32,0.05)" }} />
                        <Bar dataKey="total" name="Chi tiêu" fill="url(#m3Bar)" radius={[10, 10, 6, 6]} maxBarSize={34} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="m3-card min-w-0 p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-extrabold">{tab === "day" ? "Lịch sử hôm nay" : "Lịch sử tháng này"}</h2>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={refetch}
                        aria-label="Tải lại"
                        className="grid size-7 place-items-center rounded-full opacity-60 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                      >
                        <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
                      </button>
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-extrabold"
                        style={{ background: "var(--m3-secondary-container)" }}
                      >
                        {activeList.length}
                      </span>
                    </div>
                  </div>
                  {activeList.length === 0 ? (
                    <p className="py-10 text-center text-sm opacity-60">Chưa có giao dịch nào.</p>
                  ) : (
                    <ul className="mt-2 max-h-80 space-y-1 overflow-y-auto pr-1 sm:max-h-72">
                      {activeList.slice(0, 30).map((e) => {
                        const c = categoryById(e.category);
                        const Icon = c.Icon;
                        return (
                          <li
                            key={e.id}
                            className="flex items-center gap-2.5 rounded-2xl p-2 transition hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: c.color }}>
                              <Icon className="size-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-bold">{e.note || c.label}</p>
                              <p className="text-[11px] opacity-60">
                                {formatTime(e.spent_at)}
                                {tab === "month" ? ` • ${new Date(e.spent_at).toLocaleDateString("vi-VN")}` : ""}
                              </p>
                            </div>
                            <b className="shrink-0 text-[13px]">-{compact(e.amount)}</b>
                            <button
                              onClick={() => deleteExpense(e.id)}
                              aria-label="Xóa"
                              className="grid size-8 shrink-0 place-items-center rounded-full opacity-50 transition hover:bg-red-500/10 hover:text-red-500 hover:opacity-100"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* FAB mobile */}
      <Link
        href="/add"
        className="m3-primary-btn fixed right-5 flex items-center gap-2 !rounded-2xl px-6 py-4 text-base font-extrabold transition hover:scale-105 lg:hidden"
        style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <Plus className="size-6" /> Nhập
      </Link>
    </div>
  );
}
