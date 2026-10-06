"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { demoExpensesToday, loadLocal, saveLocal } from "@/lib/demo";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Expense, NewExpense } from "@/lib/types";

// Một cụm chi tiêu chung cho tất cả thiết bị, không phân biệt theo máy.
const SHARED_ID = "shared";

const LOCAL_SEEDED = "chitieu-seeded-v1";

interface Row {
  id: unknown;
  amount: unknown;
  category: unknown;
  note: unknown;
  payment_method: unknown;
  spent_at: unknown;
  created_at?: unknown;
  device_id?: unknown;
}

function toExpense(r: Row): Expense {
  return {
    id: String(r.id),
    amount: Number(r.amount),
    category: r.category as Expense["category"],
    note: String(r.note ?? ""),
    payment_method: (r.payment_method as Expense["payment_method"]) ?? "cash",
    spent_at: String(r.spent_at),
    created_at: r.created_at ? String(r.created_at) : undefined,
    device_id: r.device_id ? String(r.device_id) : undefined,
  };
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const loadedOnce = useRef(false);

  const loadData = useCallback(async (first: boolean) => {
    if (first) setLoading(true);
    else setRefreshing(true);
    try {
      const sb = supabase();
      if (sb && isSupabaseConfigured) {
        const { data, error: err } = await sb
          .from("expenses")
          .select("*")
          .eq("device_id", SHARED_ID)
          .order("spent_at", { ascending: false })
          .limit(1000);
        if (err) throw err;
        if (data && data.length > 0) {
          setExpenses((data as Row[]).map(toExpense));
          setIsDemo(false);
        } else {
          // Chưa có dòng nào: hiện dữ liệu mẫu để thấy giao diện ngay
          setExpenses(demoExpensesToday());
          setIsDemo(true);
        }
        setError(null);
      } else {
        // Chưa cấu hình Supabase: dùng local
        const local = loadLocal();
        if (local && local.length > 0) {
          setExpenses(local);
          setIsDemo(false);
        } else if (typeof window !== "undefined" && window.localStorage.getItem(LOCAL_SEEDED)) {
          setExpenses(local ?? []);
          setIsDemo(false);
        } else {
          const demo = demoExpensesToday();
          setExpenses(demo);
          setIsDemo(true);
          saveLocal(demo);
          try {
            window.localStorage.setItem(LOCAL_SEEDED, "1");
          } catch {
            /* bỏ qua */
          }
        }
        setError(null);
      }
    } catch (e) {
      // Lỗi mạng/quyền: BÁO RÕ, không im lặng hiện demo
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadedOnce.current = true;
    }
  }, []);

  // Tải lần đầu
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Tải lại khi: quay lại tab, có mạng trở lại (mobile rớt websocket là chuyện thường)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && loadedOnce.current) {
        loadData(false);
      }
    };
    const onOnline = () => {
      if (loadedOnce.current) loadData(false);
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [loadData]);

  const refetch = useCallback(() => {
    loadData(false);
  }, [loadData]);

  // Realtime Supabase: cập nhật ngay khi có insert/update/delete
  useEffect(() => {
    const sb = supabase();
    if (!sb || !isSupabaseConfigured) return;
    const channel = sb
      .channel("expenses-shared")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `device_id=eq.${SHARED_ID}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const created = toExpense(payload.new as Row);
            setExpenses((prev) =>
              prev.some((e) => e.id === created.id) ? prev : [created, ...prev],
            );
            setIsDemo(false);
          } else if (payload.eventType === "DELETE") {
            const id = String((payload.old as Row).id);
            setExpenses((prev) => prev.filter((e) => e.id !== id));
          } else if (payload.eventType === "UPDATE") {
            const updated = toExpense(payload.new as Row);
            setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
          }
        },
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  const addExpense = useCallback(
    async (input: NewExpense) => {
      const sb = supabase();
      if (sb && isSupabaseConfigured) {
        const { data, error: err } = await sb
          .from("expenses")
          .insert({
            amount: input.amount,
            category: input.category,
            note: input.note,
            payment_method: input.payment_method,
            spent_at: input.spent_at,
            device_id: SHARED_ID,
          })
          .select()
          .single();
        if (err) throw new Error(`Lưu thất bại: ${err.message}`);
        const created = toExpense(data as Row);
        setExpenses((prev) => (isDemo ? [created] : [created, ...prev]));
        setIsDemo(false);
        setError(null);
        return created;
      }
      const created: Expense = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `local-${Date.now()}`,
        ...input,
      };
      setExpenses((prev) => {
        const next = isDemo ? [created] : [created, ...prev];
        saveLocal(next);
        return next;
      });
      setIsDemo(false);
      return created;
    },
    [isDemo],
  );

  const deleteExpense = useCallback(async (id: string) => {
    if (id.startsWith("demo-")) {
      setExpenses((prev) => {
        const next = prev.filter((e) => e.id !== id);
        saveLocal(next);
        return next;
      });
      return;
    }
    const sb = supabase();
    if (sb && isSupabaseConfigured) {
      const { error: err } = await sb.from("expenses").delete().eq("id", id);
      if (err) throw new Error(`Xóa thất bại: ${err.message}`);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      return;
    }
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveLocal(next);
      return next;
    });
  }, []);

  const clearDemo = useCallback(() => {
    setExpenses([]);
    setIsDemo(false);
    saveLocal([]);
    try {
      window.localStorage.setItem(LOCAL_SEEDED, "1");
    } catch {
      /* bỏ qua */
    }
  }, []);

  return {
    expenses,
    loading,
    refreshing,
    error,
    isDemo,
    isSupabase: isSupabaseConfigured,
    refetch,
    addExpense,
    deleteExpense,
    clearDemo,
  };
}
