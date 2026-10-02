import { Button } from "./button";

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  basePath = "",
  params = {},
}: {
  currentPage?: number;
  totalPages?: number;
  basePath?: string;
  params?: Record<string, string | undefined>;
}) {
  const hrefFor = (page: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    search.set("page", String(page));
    return `${basePath}?${search.toString()}`;
  };

  return (
    <div className="flex items-center justify-between border-t px-5 py-4">
      <p className="text-xs text-slate-500">Halaman {currentPage} dari {totalPages}</p>
      <div className="flex gap-2">
        {currentPage <= 1 ? (
          <Button variant="outline" size="sm" disabled>Sebelumnya</Button>
        ) : (
          <Button variant="outline" size="sm" href={hrefFor(currentPage - 1)}>Sebelumnya</Button>
        )}
        {currentPage >= totalPages ? (
          <Button variant="outline" size="sm" disabled>Berikutnya</Button>
        ) : (
          <Button variant="outline" size="sm" href={hrefFor(currentPage + 1)}>Berikutnya</Button>
        )}
      </div>
    </div>
  );
}