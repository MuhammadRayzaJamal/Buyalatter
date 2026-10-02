"use client";

import { useState, useTransition } from "react";
import { Button } from "./button";
import { ConfirmModal } from "./confirm-modal";

export function DeleteForm({
  action,
  label = "Hapus",
  title = "Hapus data?",
  message = "Data yang dihapus tidak dapat dikembalikan.",
  compact = false,
}: {
  action: () => Promise<{ ok: boolean; pesan: string } | void> | void;
  label?: string;
  title?: string;
  message?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [hasil, setHasil] = useState<{ ok: boolean; pesan: string } | null>(null);

  return (
    <>
      {compact ? (
        <button
          className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
          disabled={pending}
          onClick={() => setOpen(true)}
          type="button"
        >
          {pending ? "Menghapus..." : label}
        </button>
      ) : (
        <Button disabled={pending} onClick={() => setOpen(true)} size="sm" type="button" variant="danger">
          {pending ? "Menghapus..." : label}
        </Button>
      )}
      {hasil && <span className={`text-xs font-semibold ${hasil.ok ? "text-emerald-600" : "text-red-600"}`} role={hasil.ok ? "status" : "alert"}>{hasil.pesan}</span>}
      <ConfirmModal
        message={message}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          setHasil(null);
          startTransition(async () => {
            const respons = await action();
            if (respons) setHasil(respons);
          });
        }}
        open={open}
        title={title}
      />
    </>
  );
}
