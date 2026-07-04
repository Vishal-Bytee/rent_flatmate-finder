import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "../lib/toast";
import ListingForm, { ListingFormValues } from "../components/ListingForm";
import { listingApi } from "../api/endpoints";
import { apiErrorMessage } from "../api/client";

export default function CreateListing() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: ListingFormValues, images: File[]) {
    setSubmitting(true);
    try {
      const listing = await listingApi.create(values);
      if (images.length > 0) {
        try {
          await listingApi.uploadImages(listing.id, images);
        } catch (imgErr) {
          toast.error(apiErrorMessage(imgErr, "Listing saved, but photo upload failed. You can add photos from Edit listing."));
          navigate(`/listings/${listing.id}`);
          return;
        }
      }
      toast.success("Listing created");
      navigate(`/listings/${listing.id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not create listing"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Create a listing</h1>
      <p className="mt-1 text-ink/60 dark:text-sand/60">Add photos after saving from your dashboard.</p>
      <div className="mt-6">
        <ListingForm onSubmit={handleSubmit} submitLabel="Create listing" submitting={submitting} />
      </div>
    </div>
  );
}
