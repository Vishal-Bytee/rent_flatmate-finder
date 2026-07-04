import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "../lib/toast";
import ListingForm, { ListingFormValues } from "../components/ListingForm";
import { listingApi } from "../api/endpoints";
import { apiErrorMessage } from "../api/client";
import { Listing } from "../types";

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    listingApi.getOne(id).then(setListing).catch((err) => toast.error(apiErrorMessage(err)));
  }, [id]);

  async function handleSubmit(values: ListingFormValues, images: File[]) {
    if (!id) return;
    setSubmitting(true);
    try {
      await listingApi.update(id, values);
      if (images.length > 0) {
        try {
          await listingApi.uploadImages(id, images);
        } catch (imgErr) {
          toast.error(apiErrorMessage(imgErr, "Listing saved, but photo upload failed. Please try adding photos again."));
          navigate(`/listings/${id}`);
          return;
        }
      }
      toast.success("Listing updated");
      navigate(`/listings/${id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update listing"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!listing) return <div className="mx-auto max-w-2xl px-4 py-10 text-ink/60 dark:text-sand/60">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Edit listing</h1>
      <div className="mt-6">
        <ListingForm initial={listing} onSubmit={handleSubmit} submitLabel="Save changes" submitting={submitting} />
      </div>
    </div>
  );
}
