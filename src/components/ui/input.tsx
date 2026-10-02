import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  return (
    <label className="block space-y-1.5" htmlFor={id}>
      {label && <span className="block text-sm font-semibold text-slate-700">{label}</span>}
      <input
        id={id}
        className={`h-11 w-full rounded-[10px] border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-navy focus:ring-4 focus:ring-blue-100 ${error ? "border-red-400" : "border-slate-200"} ${className}`}
        {...props}
      />
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
}