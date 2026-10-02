"use client";

import { Button } from "./button";

export function ConfirmModal({ open, title = "Hapus data?", message = "Data yang dihapus tidak dapat dikembalikan.", onClose, onConfirm }: { open: boolean; title?: string; message?: string; onClose: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-lg font-bold text-red-600">!</div>
        <h2 className="text-lg font-bold text-slate-900" id="confirm-title">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="danger" onClick={onConfirm}>Hapus</Button>
        </div>
      </div>
    </div>
  );
}