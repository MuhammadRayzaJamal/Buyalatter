"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

const EVENT = "buyalater:sidebar";

/** Status sidebar diciutkan (desktop), disimpan di localStorage dan disinkronkan ke --sidebar-w untuk padding konten. */
export function useSidebarCollapse(key: string) {
  const collapsed = useSyncExternalStore(
    (notify) => { window.addEventListener(EVENT, notify); window.addEventListener("storage", notify); return () => { window.removeEventListener(EVENT, notify); window.removeEventListener("storage", notify); }; },
    () => { try { return localStorage.getItem(key) === "1"; } catch { return false; } },
    () => false,
  );
  useEffect(() => { document.documentElement.style.setProperty("--sidebar-w", collapsed ? "5rem" : "16rem"); }, [collapsed]);
  const toggle = useCallback(() => {
    try { localStorage.setItem(key, collapsed ? "0" : "1"); } catch { /* penyimpanan diblokir */ }
    window.dispatchEvent(new Event(EVENT));
  }, [key, collapsed]);
  return { collapsed, toggle };
}
