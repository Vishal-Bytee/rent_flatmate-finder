import { useState } from "react";
import { Listing, RoomType, FurnishingStatus } from "../types";

export interface ListingFormValues {
  title: string;
  description: string;
  location: string;
  rent: number;
  availableFrom: string;
  roomType: RoomType;
  furnishingStatus: FurnishingStatus;
}

const ROOM_TYPES: RoomType[] = ["SINGLE", "SHARED", "STUDIO", "ONE_BHK", "TWO_BHK", "THREE_BHK_PLUS"];
const FURNISHING: FurnishingStatus[] = ["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"];
const MAX_IMAGES = 8;

export default function ListingForm({
  initial,
  onSubmit,
  submitLabel = "Save listing",
  submitting,
}: {
  initial?: Partial<Listing>;
  onSubmit: (values: ListingFormValues, images: File[]) => void;
  submitLabel?: string;
  submitting?: boolean;
}) {
  const [values, setValues] = useState<ListingFormValues>({
    title: initial?.title || "",
    description: initial?.description || "",
    location: initial?.location || "",
    rent: initial?.rent || 0,
    availableFrom: initial?.availableFrom ? initial.availableFrom.slice(0, 10) : "",
    roomType: initial?.roomType || "SINGLE",
    furnishingStatus: initial?.furnishingStatus || "UNFURNISHED",
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const existingImages = initial?.images || [];

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).slice(0, MAX_IMAGES - images.length);
    if (files.length === 0) return;
    setImages((prev) => [...prev, ...files].slice(0, MAX_IMAGES));
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))].slice(0, MAX_IMAGES));
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(values, images); }}
      className="space-y-4"
    >
      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input required value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea required rows={4} value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Location</label>
          <input required value={values.location} onChange={(e) => setValues({ ...values, location: e.target.value })}
            className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Rent (₹/mo)</label>
          <input required type="number" min={0} value={values.rent || ""} onChange={(e) => setValues({ ...values, rent: Number(e.target.value) })}
            className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Available from</label>
          <input required type="date" value={values.availableFrom} onChange={(e) => setValues({ ...values, availableFrom: e.target.value })}
            className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Room type</label>
          <select value={values.roomType} onChange={(e) => setValues({ ...values, roomType: e.target.value as RoomType })}
            className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15">
            {ROOM_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Furnishing</label>
          <select value={values.furnishingStatus} onChange={(e) => setValues({ ...values, furnishingStatus: e.target.value as FurnishingStatus })}
            className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15">
            {FURNISHING.map((f) => <option key={f} value={f}>{f.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Photos</label>
        <p className="mb-2 text-xs text-ink/50 dark:text-sand/50">
          Uploaded straight to Cloudinary — up to {MAX_IMAGES} photos, 5MB each.
        </p>

        {existingImages.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {existingImages.map((img) => (
              <img key={img.id} src={img.url} alt="Existing" className="h-20 w-20 rounded-lg object-cover" />
            ))}
          </div>
        )}

        {previews.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {previews.map((src, i) => (
              <div key={src} className="relative">
                <img src={src} alt="Selected" className="h-20 w-20 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="focus-ring absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs text-sand dark:bg-sand dark:text-ink"
                  aria-label="Remove photo"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length < MAX_IMAGES && (
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="focus-ring w-full rounded-lg border border-dashed border-ink/20 bg-transparent px-3 py-2 text-sm dark:border-sand/20"
          />
        )}
      </div>

      <button
        disabled={submitting}
        className="focus-ring rounded-lg bg-teal px-5 py-2.5 font-medium text-sand hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
