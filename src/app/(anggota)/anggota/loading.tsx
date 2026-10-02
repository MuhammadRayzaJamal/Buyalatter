export default function AnggotaLoading() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="h-28 animate-pulse rounded-xl border bg-slate-100" key={index} />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border bg-slate-100" />
    </div>
  );
}
