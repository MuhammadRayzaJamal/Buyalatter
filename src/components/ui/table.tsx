import type { ReactNode } from "react";

export type TableColumn<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
};

export function Table<T extends { id: string }>({
  columns,
  rows,
  emptyMessage = "Belum ada data.",
}: {
  columns: TableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((column) => <th className="px-5 py-3 font-semibold" key={column.key}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr><td className="px-5 py-10 text-center text-slate-500" colSpan={columns.length}>{emptyMessage}</td></tr>
          ) : rows.map((row) => (
            <tr className="transition-colors hover:bg-slate-50/80" key={row.id}>
              {columns.map((column) => <td className="px-5 py-4 text-slate-700" key={column.key}>{column.render ? column.render(row) : String(row[column.key as keyof T] ?? "-")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}