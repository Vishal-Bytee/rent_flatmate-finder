import cloudinary from "../config/cloudinary";
import { AppError } from "../utils/apiResponse";

export const uploadService = {
  /**
   * Uploads a base64 or file-buffer-derived data URI to Cloudinary.
   * Frontend uploads directly via multipart -> multer memory storage -> here.
   */
  async uploadImage(fileBuffer: Buffer, mimeType: string): Promise<{ url: string; publicId: string }> {
    try {
      const base64 = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(base64, {
        folder: "rent-flatmate-finder/listings",
        resource_type: "image",
      });
      return { url: result.secure_url, publicId: result.public_id };
    } catch (err) {
      throw new AppError("Image upload failed. Please try again.", 502);
    }
  },

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch {
      // non-fatal: log and continue
      // eslint-disable-next-line no-console
      console.error(`Failed to delete Cloudinary image ${publicId}`);
    }
  },
};
