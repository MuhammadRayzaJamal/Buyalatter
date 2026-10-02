import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const field = "w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-secondary focus:ring-4 focus:ring-blue-100";

export function Select({ label, id, className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return <label className="block space-y-1.5" htmlFor={id}><span className="block text-sm font-semibold text-slate-700">{label}</span><select className={`h-11 ${field} ${className}`} id={id} {...props}>{children}</select></label>;
}

export function Textarea({ label, id, className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <label className={`block space-y-1.5 ${className}`} htmlFor={id}><span className="block text-sm font-semibold text-slate-700">{label}</span><textarea className={`min-h-24 py-2.5 ${field}`} id={id} {...props} /></label>;
}

export function Checkbox({ label, id, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className={`flex h-11 items-center gap-2.5 text-sm font-semibold text-slate-700 ${className}`} htmlFor={id}><input className="h-4 w-4 rounded border-slate-300 accent-secondary" id={id} type="checkbox" {...props} />{label}</label>;
}
