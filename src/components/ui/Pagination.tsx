import { Button } from "./Button";

export function Pagination({ page, total, pageSize }: { page: number; total: number; pageSize: number }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-text-muted">
      <span>
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1}>Previous</Button>
        <Button variant="outline" size="sm" disabled={page >= pages}>Next</Button>
      </div>
    </div>
  );
}
