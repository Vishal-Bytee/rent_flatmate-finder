import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "../lib/toast";
import { EmptyState } from "../components/Common";
import { listingApi, interestApi } from "../api/endpoints";
import { apiErrorMessage } from "../api/client";
import { InterestRequest, TenantProfile } from "../types";

export default function TenantDashboard() {
  const [profile, setProfile] = useState<Partial<TenantProfile>>({});
  const [requests, setRequests] = useState<InterestRequest[]>([]);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"profile" | "requests">("profile");

  function load() {
    listingApi.getTenantProfile().then((p) => p && setProfile({ ...p, moveInDate: p.moveInDate?.slice(0, 10) })).catch(() => {});
    interestApi.mine().then(setRequests).catch((err) => toast.error(apiErrorMessage(err)));
  }

  useEffect(load, []);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await listingApi.upsertTenantProfile({
        preferredLocation: profile.preferredLocation,
        minimumBudget: Number(profile.minimumBudget),
        maximumBudget: Number(profile.maximumBudget),
        moveInDate: profile.moveInDate as unknown as string,
        gender: profile.gender,
        occupation: profile.occupation,
      });
      toast.success("Profile saved — listings will re-score automatically");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Your dashboard</h1>

      <div className="mt-6 flex gap-2">
        {(["profile", "requests"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`focus-ring rounded-lg px-4 py-2 text-sm font-medium ${tab === t ? "bg-teal text-sand" : "border border-ink/15 dark:border-sand/15"}`}>
            {t === "profile" ? "Profile" : `Requests (${requests.length})`}
          </button>
        ))}
      </div>

      {tab === "profile" ? (
        <form onSubmit={saveProfile} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Preferred location</label>
            <input required value={profile.preferredLocation || ""} onChange={(e) => setProfile({ ...profile, preferredLocation: e.target.value })}
              className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Minimum budget</label>
              <input required type="number" min={0} value={profile.minimumBudget ?? ""} onChange={(e) => setProfile({ ...profile, minimumBudget: Number(e.target.value) })}
                className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Maximum budget</label>
              <input required type="number" min={0} value={profile.maximumBudget ?? ""} onChange={(e) => setProfile({ ...profile, maximumBudget: Number(e.target.value) })}
                className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Move-in date</label>
            <input required type="date" value={(profile.moveInDate as string) || ""} onChange={(e) => setProfile({ ...profile, moveInDate: e.target.value as never })}
              className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Gender (optional)</label>
              <input value={profile.gender || ""} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Occupation (optional)</label>
              <input value={profile.occupation || ""} onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15" />
            </div>
          </div>
          <button disabled={saving} className="focus-ring rounded-lg bg-teal px-5 py-2.5 font-medium text-sand hover:opacity-90 disabled:opacity-50">
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      ) : requests.length === 0 ? (
        <div className="mt-8"><EmptyState title="No requests yet" subtitle="Browse listings and express interest to get started." /></div>
      ) : (
        <div className="mt-6 space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-ink/10 p-4 dark:border-sand/10">
              <div>
                <Link to={`/listings/${r.listing?.id}`} className="font-medium hover:text-teal">{r.listing?.title}</Link>
                <p className="text-sm text-ink/60 dark:text-sand/60">Status: {r.status}</p>
              </div>
              {r.status === "ACCEPTED" && r.chatRoom && (
                <Link to={`/chat/${r.chatRoom.id}`} className="focus-ring rounded-lg border border-ink/15 px-3 py-1.5 text-sm dark:border-sand/15">Open chat</Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
