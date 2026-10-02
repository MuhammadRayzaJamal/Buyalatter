"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function MonthlyChart({ data }: { data: { bulan: string; simpanan: number; pinjaman: number }[] }) {
  return <div className="h-80 w-full"><ResponsiveContainer><BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}><CartesianGrid stroke="#e3e8f1" strokeDasharray="3 3" vertical={false} /><XAxis axisLine={false} dataKey="bulan" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} /><YAxis axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000000)}jt`} /><Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString("id-ID")}`} /><Legend /><Bar dataKey="simpanan" fill="#1e3a8a" name="Simpanan" radius={[4, 4, 0, 0]} /><Bar dataKey="pinjaman" fill="#16a34a" name="Pinjaman" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>;
}