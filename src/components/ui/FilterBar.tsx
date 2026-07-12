import { SearchBar } from "./SearchBar";

export function FilterBar() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 md:flex-row md:items-center md:justify-between">
      <SearchBar placeholder="Search records" />
      <div className="flex gap-2 text-sm text-text-muted">Status · Date · City</div>
    </div>
  );
}
