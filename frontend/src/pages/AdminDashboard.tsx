import { useEffect, useState } from "react";
import { toast } from "../lib/toast";
import { Modal } from "../components/Common";
import { adminApi } from "../api/endpoints";
import { apiErrorMessage } from "../api/client";
import { AdminStats, Listing, User } from "../types";

const STAT_LABELS: Record<keyof AdminStats, string> = {
  totalUsers: "Total users",
  totalOwners: "Owners",
  totalTenants: "Tenants",
  totalListings: "Listings",
  filledListings: "Filled listings",
  activeChats: "Active chats",
  interestRequests: "Interest requests",
  totalMessages: "Messages sent",
};

type ConfirmTarget = { type: "user" | "listing"; id: string; label: string } | null;

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [tab, setTab] = useState<"stats" | "users" | "listings">("stats");
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null);

  function load() {
    setLoading(true);
    Promise.all([adminApi.dashboard(), adminApi.listUsers(), adminApi.listListings()])
      .then(([s, u, l]) => { setStats(s); setUsers(u); setListings(l); })
      .catch((err) => toast.error(apiErrorMessage(err, "Could not load admin data")))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function confirmAction() {
    if (!confirmTarget) return;
    setPendingId(confirmTarget.id);
    try {
      if (confirmTarget.type === "user") {
        await adminApi.deactivateUser(confirmTarget.id);
        toast.success("User deactivated");
      } else {
        await adminApi.deleteListing(confirmTarget.id);
        toast.success("Listing deleted");
      }
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Action failed"));
    } finally {
      setPendingId(null);
      setConfirmTarget(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Admin dashboard</h1>

      <div className="mt-6 flex gap-2">
        {(["stats", "users", "listings"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`focus-ring rounded-lg px-4 py-2 text-sm font-medium capitalize ${tab === t ? "bg-teal text-sand" : "border border-ink/15 dark:border-sand/15"}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-ink/60 dark:text-sand/60">Loading…</p>
      ) : (
        <>
          {tab === "stats" && stats && (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {(Object.keys(STAT_LABELS) as (keyof AdminStats)[]).map((k) => (
                <div key={k} className="rounded-xl border border-ink/10 p-4 dark:border-sand/10">
                  <p className="text-2xl font-semibold">{stats[k]}</p>
                  <p className="text-sm text-ink/60 dark:text-sand/60">{STAT_LABELS[k]}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "users" && (
            <div className="mt-6 space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border border-ink/10 p-3 dark:border-sand/10">
                  <div>
                    <p className="font-medium">{u.name} <span className="text-xs text-ink/50">({u.role})</span></p>
                    <p className="text-sm text-ink/60 dark:text-sand/60">{u.email} · {u.isActive ? "Active" : "Deactivated"}</p>
                  </div>
                  {u.isActive && u.role !== "ADMIN" && (
                    <button
                      onClick={() => setConfirmTarget({ type: "user", id: u.id, label: u.name })}
                      disabled={pendingId === u.id}
                      className="focus-ring rounded-lg border border-clay/40 px-3 py-1.5 text-sm text-clay disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "listings" && (
            <div className="mt-6 space-y-2">
              {listings.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg border border-ink/10 p-3 dark:border-sand/10">
                  <div>
                    <p className="font-medium">{l.title}</p>
                    <p className="text-sm text-ink/60 dark:text-sand/60">{l.location} · ₹{l.rent.toLocaleString()}/mo</p>
                  </div>
                  <button
                    onClick={() => setConfirmTarget({ type: "listing", id: l.id, label: l.title })}
                    disabled={pendingId === l.id}
                    className="focus-ring rounded-lg border border-clay/40 px-3 py-1.5 text-sm text-clay disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        title={confirmTarget?.type === "user" ? "Deactivate this user?" : "Delete this listing?"}
      >
        <p className="text-sm text-ink/70 dark:text-sand/70">
          {confirmTarget?.type === "user"
            ? `${confirmTarget.label} will lose access immediately. This can be reversed later from the database if needed.`
            : `"${confirmTarget?.label}" and its photos will be permanently removed.`}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setConfirmTarget(null)} className="focus-ring rounded-lg border border-ink/15 px-4 py-2 text-sm dark:border-sand/15">
            Cancel
          </button>
          <button
            onClick={confirmAction}
            disabled={pendingId === confirmTarget?.id}
            className="focus-ring rounded-lg bg-clay px-4 py-2 text-sm font-medium text-sand disabled:opacity-50"
          >
            {pendingId === confirmTarget?.id ? "Working…" : "Confirm"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
