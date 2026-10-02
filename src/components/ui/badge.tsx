import type { HTMLAttributes } from "react";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

const styles: Record<BadgeVariant, string> = {
  success: "bg-green-50 text-green-700 ring-green-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
  info: "bg-blue-50 text-blue-700 ring-blue-600/20",
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export function Badge({
  variant = "neutral",
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}