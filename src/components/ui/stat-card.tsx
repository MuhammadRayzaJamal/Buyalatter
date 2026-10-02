import type { ComponentType, SVGProps } from "react";
import { Card } from "./card";
import { IconTrendingUp } from "./icons";

export function StatCard({
  label,
  value,
  detail,
  accent = "navy",
  icon: Icon = IconTrendingUp,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: "navy" | "green" | "amber";
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}) {
  const accentClass = { navy: "bg-blue-50 text-navy", green: "bg-sky-50 text-secondary", amber: "bg-amber-50 text-amber-700" }[accent];
  return (
    <Card className="relative overflow-hidden p-5">
      <div className={`mb-7 flex h-10 w-10 items-center justify-center rounded-lg ${accentClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </Card>
  );
}