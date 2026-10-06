"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Đăng ký service worker (chỉ khi browser hỗ trợ). */
export function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* bỏ qua: PWA vẫn chạy không offline */
      });
    }
  }, []);
  return null;
}

function usePwaInstall() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    const ua = window.navigator.userAgent;
    setIsIos(
      /iphone|ipad|ipod/i.test(ua) ||
        (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1),
    );

    const onBip = (e: Event) => {
      e.preventDefault(); // giữ lại để hiện khi user bấm nút
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setDeferred(null);
    } else {
      // Safari iOS không có beforeinstallprompt -> hướng dẫn thủ công
      setShowIosHelp(true);
    }
  }, [deferred]);

  return {
    // Chrome/Edge: hiện khi browser cho phép cài. Safari iOS: luôn hiện (trừ khi đã cài).
    canShow: !installed && (deferred !== null || isIos),
    isIos,
    showIosHelp,
    setShowIosHelp,
    install,
  };
}

/**
 * Nút cài PWA: Chrome/Edge dùng prompt hệ thống,
 * Safari iOS mở hướng dẫn "Chia sẻ -> Thêm vào MH chính".
 */
export function PwaInstallButton({ variant = "full" }: { variant?: "full" | "icon" }) {
  const { canShow, showIosHelp, setShowIosHelp, install } = usePwaInstall();
  if (!canShow) return null;

  return (
    <>
      {variant === "full" ? (
        <button
          onClick={install}
          className="m3-tonal flex w-full items-center justify-center gap-1.5 !rounded-2xl py-2.5 text-sm font-extrabold transition hover:scale-[1.02]"
        >
          <Download className="size-4" /> Cài app
        </button>
      ) : (
        <button
          onClick={install}
          aria-label="Cài app"
          title="Cài app"
          className="m3-tonal grid size-11 place-items-center !rounded-full transition hover:scale-105"
        >
          <Download className="size-5" />
        </button>
      )}

      {showIosHelp && (
        <div
          className="fixed inset-0 z-50 grid place-items-end bg-black/60 sm:place-items-center"
          onClick={() => setShowIosHelp(false)}
        >
          <div
            className="m3-card w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ marginBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">Cài app Chi tiêu</h3>
              <button
                onClick={() => setShowIosHelp(false)}
                aria-label="Đóng"
                className="grid size-9 place-items-center rounded-full opacity-60 hover:opacity-100"
              >
                <X className="size-5" />
              </button>
            </div>
            <ol className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="m3-primary-btn grid size-7 shrink-0 place-items-center text-xs font-black">1</span>
                <span>
                  Bấm nút <b>Chia sẻ</b> <Share className="inline size-4" /> trên thanh Safari
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="m3-primary-btn grid size-7 shrink-0 place-items-center text-xs font-black">2</span>
                <span>
                  Chọn <b>“Thêm vào MH chính”</b>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="m3-primary-btn grid size-7 shrink-0 place-items-center text-xs font-black">3</span>
                <span>
                  Bấm <b>Thêm</b> — icon app sẽ hiện ngoài màn hình chính
                </span>
              </li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
