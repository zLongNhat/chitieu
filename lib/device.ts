"use client";

// Mã đồng bộ: mọi thiết bị nhập cùng mã sẽ thấy chung dữ liệu.
// Mặc định mỗi máy 1 mã riêng; user copy mã qua máy khác để đồng bộ.
const NEW_KEY = "chitieu-sync-id";
const OLD_KEY = "chitieu-device-id"; // key cũ: tự migrate để giữ data
let mem = "";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // private mode / storage bị chặn
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* bỏ qua: dùng mem fallback */
  }
}

/** Mã ngắn dễ đọc, dễ gõ qua máy khác: 6 ký tự, không lẫn 0/O, 1/I. */
export function newSyncId(): string {
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const buf = new Uint32Array(6);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < 6; i++) buf[i] = Math.floor(Math.random() * 4294967296);
  }
  return Array.from(buf, (n) => abc[n % abc.length]).join("");
}

export function getSyncId(): string {
  if (typeof window === "undefined") return "ssr";
  if (mem) return mem;
  const cur = read(NEW_KEY);
  if (cur) {
    mem = cur;
    return mem;
  }
  const old = read(OLD_KEY);
  if (old) {
    // migrate key cũ để không mất dữ liệu đã nhập
    write(NEW_KEY, old);
    mem = old;
    return mem;
  }
  mem = newSyncId();
  write(NEW_KEY, mem);
  return mem;
}

/** Đổi sang mã khác (đồng bộ với thiết bị khác, hoặc tạo mã mới). */
export function setSyncId(raw: string): string {
  const v = raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "") || newSyncId();
  mem = v;
  write(NEW_KEY, v);
  return v;
}

/** Giữ tương thích ngược. */
export const getDeviceId = getSyncId;
