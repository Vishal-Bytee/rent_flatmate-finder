import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "../lib/toast";
import { listingApi, interestApi, ratingApi } from "../api/endpoints";
import { apiErrorMessage } from "../api/client";
import { Listing, Rating, RatingSummary } from "../types";
import { useAuth } from "../hooks/useAuth";
import { StarRatingDisplay, StarRatingInput } from "../components/StarRating";

export default function ListingDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [ratings, setRatings] = useState<Rating[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({ average: 0, count: 0 });
  const [myStars, setMyStars] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (!id) return;
    listingApi.getOne(id)
      .then(setListing)
      .catch((err) => toast.error(apiErrorMessage(err, "Could not load listing")))
      .finally(() => setLoading(false));
    loadRatings();
    if (user?.role === "TENANT") {
      ratingApi.mine(id).then((r) => {
        if (r) { setMyStars(r.stars); setMyComment(r.comment || ""); }
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.role]);

  function loadRatings() {
    if (!id) return;
    ratingApi.list(id)
      .then((res) => { setRatings(res.ratings); setRatingSummary(res.summary); })
      .catch(() => {});
  }

  async function sendInterest() {
    if (!id) return;
    setSending(true);
    try {
      await interestApi.create(id);
      setSent(true);
      toast.success("Interest request sent");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not send interest"));
    } finally {
      setSending(false);
    }
  }

  async function submitRating(e: FormEvent) {
    e.preventDefault();
    if (!id || myStars === 0) return;
    setSubmittingRating(true);
    try {
      await ratingApi.rate(id, myStars, myComment.trim() || undefined);
      toast.success("Thanks for rating this room");
      loadRatings();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save your rating"));
    } finally {
      setSubmittingRating(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-10 text-ink/60 dark:text-sand/60">Loading…</div>;
  if (!listing) return <div className="mx-auto max-w-4xl px-4 py-10">Listing not found.</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="aspect-[4/3] overflow-hidden rounded-xl bg-ink/5 dark:bg-sand/5">
          {listing.images?.[0] ? (
            <img src={listing.images[0].url} alt={listing.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-ink/30">No photo</div>
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold">{listing.title}</h1>
          <p className="mt-1 text-ink/60 dark:text-sand/60">{listing.location}</p>

          {ratingSummary.count > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <StarRatingDisplay value={ratingSummary.average} size="md" />
              <span className="text-sm text-ink/60 dark:text-sand/60">
                {ratingSummary.average} out of 5 ({ratingSummary.count} rating{ratingSummary.count === 1 ? "" : "s"})
              </span>
            </div>
          )}

          <p className="mt-4 text-2xl font-semibold">₹{listing.rent.toLocaleString()}/mo</p>

          {listing.compatibility && (
            <div className="mt-4 rounded-lg bg-teal/10 p-4">
              <p className="font-semibold text-teal">{listing.compatibility.score}% compatibility</p>
              <p className="mt-1 text-sm">{listing.compatibility.explanation}</p>
            </div>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-ink/50 dark:text-sand/50">Room type</dt><dd className="font-medium">{listing.roomType.replace(/_/g, " ")}</dd></div>
            <div><dt className="text-ink/50 dark:text-sand/50">Furnishing</dt><dd className="font-medium">{listing.furnishingStatus.replace(/_/g, " ")}</dd></div>
            <div><dt className="text-ink/50 dark:text-sand/50">Available from</dt><dd className="font-medium">{new Date(listing.availableFrom).toLocaleDateString()}</dd></div>
            <div><dt className="text-ink/50 dark:text-sand/50">Status</dt><dd className="font-medium">{listing.isFilled ? "Filled" : "Available"}</dd></div>
          </dl>

          {user?.role === "TENANT" && !listing.isFilled && (
            <button
              onClick={sendInterest}
              disabled={sending || sent}
              className="focus-ring mt-6 rounded-lg bg-teal px-5 py-2.5 font-medium text-sand hover:opacity-90 disabled:opacity-50"
            >
              {sent ? "Interest sent" : sending ? "Sending…" : "I'm interested"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl font-semibold">About this room</h2>
        <p className="mt-2 whitespace-pre-line text-ink/80 dark:text-sand/80">{listing.description}</p>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold">Ratings & reviews</h2>

        {user?.role === "TENANT" && (
          <form onSubmit={submitRating} className="mt-4 rounded-xl border border-ink/10 p-4 dark:border-sand/10">
            <p className="mb-2 text-sm font-medium">{myStars > 0 ? "Update your rating" : "Rate this room"}</p>
            <StarRatingInput value={myStars} onChange={setMyStars} disabled={submittingRating} />
            <textarea
              value={myComment}
              onChange={(e) => setMyComment(e.target.value)}
              placeholder="Optional comment"
              rows={2}
              maxLength={500}
              className="focus-ring mt-3 w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 text-sm dark:border-sand/15"
            />
            <button
              disabled={myStars === 0 || submittingRating}
              className="focus-ring mt-3 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-sand hover:opacity-90 disabled:opacity-50"
            >
              {submittingRating ? "Saving…" : "Submit rating"}
            </button>
          </form>
        )}

        {ratings.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50 dark:text-sand/50">No ratings yet — be the first to rate this room.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {ratings.map((r) => (
              <div key={r.id} className="rounded-lg border border-ink/10 p-3 dark:border-sand/10">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{r.tenant.user.name}</p>
                  <StarRatingDisplay value={r.stars} />
                </div>
                {r.comment && <p className="mt-1 text-sm text-ink/70 dark:text-sand/70">{r.comment}</p>}
                <p className="mt-1 text-xs text-ink/40 dark:text-sand/40">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
