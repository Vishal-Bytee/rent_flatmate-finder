import { FormEvent, useState } from "react";

export interface Filters {
  location: string;
  minRent: string;
  maxRent: string;
}

export default function SearchFilters({
  initial,
  onSearch,
}: {
  initial: Filters;
  onSearch: (filters: Filters) => void;
}) {
  const [filters, setFilters] = useState<Filters>(initial);

  function submit(e: FormEvent) {
    e.preventDefault();
    onSearch(filters);
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-3 rounded-xl border border-ink/10 bg-white/60 p-4 dark:border-sand/10 dark:bg-white/5">
      <input
        value={filters.location}
        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        placeholder="Location"
        className="focus-ring flex-1 min-w-[140px] rounded-lg border border-ink/15 bg-transparent px-3 py-2 text-sm dark:border-sand/15"
      />
      <input
        value={filters.minRent}
        onChange={(e) => setFilters({ ...filters, minRent: e.target.value })}
        placeholder="Min rent"
        type="number"
        className="focus-ring w-28 rounded-lg border border-ink/15 bg-transparent px-3 py-2 text-sm dark:border-sand/15"
      />
      <input
        value={filters.maxRent}
        onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
        placeholder="Max rent"
        type="number"
        className="focus-ring w-28 rounded-lg border border-ink/15 bg-transparent px-3 py-2 text-sm dark:border-sand/15"
      />
      <button
        type="submit"
        className="focus-ring rounded-lg bg-teal px-4 py-2 text-sm font-medium text-sand hover:opacity-90"
      >
        Search
      </button>
    </form>
  );
}
