export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="h-28 animate-pulse rounded-xl border bg-slate-100" key={index} />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border bg-slate-100" />
    </div>
  );
}
