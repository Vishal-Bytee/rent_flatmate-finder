import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "../lib/toast";
import { EmptyState, Modal } from "../components/Common";
import { listingApi, interestApi } from "../api/endpoints";
import { apiErrorMessage } from "../api/client";
import { Listing, InterestRequest } from "../types";

export default function OwnerDashboard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<InterestRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"listings" | "requests">("listings");
  const [pendingId, setPendingId] = useState<string | null>(null); // action currently in flight
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.all([listingApi.mine(), interestApi.mine()])
      .then(([l, r]) => { setListings(l); setRequests(r); })
      .catch((err) => toast.error(apiErrorMessage(err, "Could not load your dashboard")))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggleFilled(l: Listing) {
    setPendingId(l.id);
    try {
      await listingApi.markFilled(l.id, !l.isFilled);
      toast.success(l.isFilled ? "Marked as available" : "Marked as filled");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update listing status"));
    } finally {
      setPendingId(null);
    }
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    setPendingId(confirmDeleteId);
    try {
      await listingApi.remove(confirmDeleteId);
      toast.success("Listing deleted");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete listing"));
    } finally {
      setPendingId(null);
      setConfirmDeleteId(null);
    }
  }

  async function respond(id: string, action: "accept" | "decline") {
    setPendingId(id);
    try {
      await (action === "accept" ? interestApi.accept(id) : interestApi.decline(id));
      toast.success(action === "accept" ? "Request accepted — chat is now open" : "Request declined");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, `Could not ${action} this request`));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Owner dashboard</h1>
        <Link to="/listings/new" className="focus-ring rounded-lg bg-teal px-4 py-2 font-medium text-sand hover:opacity-90">
          + New listing
        </Link>
      </div>

      <div className="mt-6 flex gap-2">
        {(["listings", "requests"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`focus-ring rounded-lg px-4 py-2 text-sm font-medium ${tab === t ? "bg-teal text-sand" : "border border-ink/15 dark:border-sand/15"}`}>
            {t === "listings" ? `Listings (${listings.length})` : `Interest requests (${requests.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-ink/60 dark:text-sand/60">Loading…</p>
      ) : tab === "listings" ? (
        listings.length === 0 ? (
          <div className="mt-8"><EmptyState title="No listings yet" subtitle="Create your first listing to start receiving interest." /></div>
        ) : (
          <div className="mt-6 space-y-3">
            {listings.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border border-ink/10 p-4 dark:border-sand/10">
                <div>
                  <Link to={`/listings/${l.id}`} className="font-medium hover:text-teal">{l.title}</Link>
                  <p className="text-sm text-ink/60 dark:text-sand/60">{l.location} · ₹{l.rent.toLocaleString()}/mo · {l.isFilled ? "Filled" : "Available"}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFilled(l)}
                    disabled={pendingId === l.id}
                    className="focus-ring rounded-lg border border-ink/15 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-sand/15"
                  >
                    {pendingId === l.id ? "Updating…" : l.isFilled ? "Mark available" : "Mark filled"}
                  </button>
                  <Link to={`/listings/${l.id}/edit`} className="focus-ring rounded-lg border border-ink/15 px-3 py-1.5 text-sm dark:border-sand/15">Edit</Link>
                  <button
                    onClick={() => setConfirmDeleteId(l.id)}
                    disabled={pendingId === l.id}
                    className="focus-ring rounded-lg border border-clay/40 px-3 py-1.5 text-sm text-clay disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : requests.length === 0 ? (
        <div className="mt-8"><EmptyState title="No interest requests yet" /></div>
      ) : (
        <div className="mt-6 space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-ink/10 p-4 dark:border-sand/10">
              <div>
                <p className="font-medium">{r.tenant?.user.name} → {r.listing?.title}</p>
                <p className="text-sm text-ink/60 dark:text-sand/60">Status: {r.status}</p>
              </div>
              {r.status === "PENDING" ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(r.id, "accept")}
                    disabled={pendingId === r.id}
                    className="focus-ring rounded-lg bg-teal px-3 py-1.5 text-sm text-sand disabled:opacity-50"
                  >
                    {pendingId === r.id ? "Working…" : "Accept"}
                  </button>
                  <button
                    onClick={() => respond(r.id, "decline")}
                    disabled={pendingId === r.id}
                    className="focus-ring rounded-lg border border-clay/40 px-3 py-1.5 text-sm text-clay disabled:opacity-50"
                  >
                    {pendingId === r.id ? "Working…" : "Decline"}
                  </button>
                </div>
              ) : r.status === "ACCEPTED" && r.chatRoom ? (
                <Link to={`/chat/${r.chatRoom.id}`} className="focus-ring rounded-lg border border-ink/15 px-3 py-1.5 text-sm dark:border-sand/15">Open chat</Link>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Delete this listing?">
        <p className="text-sm text-ink/70 dark:text-sand/70">
          This permanently removes the listing, its photos, and any compatibility scores tied to it. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setConfirmDeleteId(null)} className="focus-ring rounded-lg border border-ink/15 px-4 py-2 text-sm dark:border-sand/15">
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            disabled={pendingId === confirmDeleteId}
            className="focus-ring rounded-lg bg-clay px-4 py-2 text-sm font-medium text-sand disabled:opacity-50"
          >
            {pendingId === confirmDeleteId ? "Deleting…" : "Delete listing"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
