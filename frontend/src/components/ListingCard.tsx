import { Link } from "react-router-dom";
import { Listing } from "../types";
import { StarRatingDisplay } from "./StarRating";

function scoreColor(score: number) {
  if (score >= 75) return "bg-teal text-sand";
  if (score >= 50) return "bg-clay text-sand";
  return "bg-ink/20 text-ink dark:bg-sand/20 dark:text-sand";
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const image = listing.images?.[0]?.url;

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-xl border border-ink/10 bg-white/60 shadow-sm transition hover:shadow-md dark:border-sand/10 dark:bg-white/5"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink/5 dark:bg-sand/5">
        {image ? (
          <img
            src={image}
            alt={listing.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink/30 dark:text-sand/30">No photo</div>
        )}
        {listing.compatibility && (
          <span className={`absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-semibold ${scoreColor(listing.compatibility.score)}`}>
            {listing.compatibility.score}% match
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold">{listing.title}</h3>
        <p className="text-sm text-ink/60 dark:text-sand/60">{listing.location}</p>
        {listing.rating && listing.rating.count > 0 && (
          <div className="mt-1 flex items-center gap-1.5">
            <StarRatingDisplay value={listing.rating.average} />
            <span className="text-xs text-ink/50 dark:text-sand/50">
              {listing.rating.average} ({listing.rating.count})
            </span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="font-semibold">₹{listing.rent.toLocaleString()}/mo</span>
          <span className="text-xs uppercase tracking-wide text-ink/50 dark:text-sand/50">
            {listing.roomType.replace(/_/g, " ")}
          </span>
        </div>
        {listing.compatibility && (
          <p className="mt-2 line-clamp-2 text-xs text-ink/60 dark:text-sand/60">
            {listing.compatibility.explanation}
          </p>
        )}
      </div>
    </Link>
  );
}
