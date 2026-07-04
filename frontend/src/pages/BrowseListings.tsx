import { useEffect, useState } from "react";
import { toast } from "../lib/toast";
import ListingCard from "../components/ListingCard";
import SearchFilters, { Filters } from "../components/SearchFilters";
import { LoadingSkeletonGrid, EmptyState, Pagination } from "../components/Common";
import { listingApi } from "../api/endpoints";
import { apiErrorMessage } from "../api/client";
import { Listing } from "../types";

const PAGE_SIZE = 9;

export default function BrowseListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({ location: "", minRent: "", maxRent: "" });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listingApi
      .search({
        location: filters.location || undefined,
        minRent: filters.minRent ? Number(filters.minRent) : undefined,
        maxRent: filters.maxRent ? Number(filters.maxRent) : undefined,
        page,
      })
      .then((res) => {
        if (cancelled) return;
        setListings(res.listings);
        setTotal(res.total);
      })
      .catch((err) => toast.error(apiErrorMessage(err, "Could not load listings")))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [filters, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Browse rooms</h1>
      <p className="mt-1 text-ink/60 dark:text-sand/60">Sorted by compatibility, then newest.</p>

      <div className="mt-6">
        <SearchFilters initial={filters} onSearch={(f) => { setFilters(f); setPage(1); }} />
      </div>

      <div className="mt-8">
        {loading ? (
          <LoadingSkeletonGrid />
        ) : listings.length === 0 ? (
          <EmptyState title="No listings match your filters" subtitle="Try widening your budget or location." />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
