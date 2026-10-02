"use client";

import { useState } from "react";

export function CopyButton({ value, className = "" }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      className={`rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-navy hover:text-navy ${className}`}
      onClick={copy}
      type="button"
    >
      {copied ? "Tersalin!" : "Salin nomor"}
    </button>
  );
}
