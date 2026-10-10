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
    <Card className="relative flex items-center gap-4 overflow-hidden p-4 sm:block sm:p-5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:mb-7 ${accentClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-xl font-bold tracking-tight text-slate-900 sm:mt-1 sm:text-2xl">{value}</p>
        <p className="mt-1 text-xs text-slate-500 sm:mt-2">{detail}</p>
      </div>
    </Card>
  );
}