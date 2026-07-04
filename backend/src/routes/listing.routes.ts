import { Router } from "express";
import multer from "multer";
import { listingController } from "../controllers/listing.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { createListingSchema, updateListingSchema, tenantProfileSchema, ratingSchema } from "../validators/listing.validator";
import { asyncHandler } from "../utils/asyncHandler";
import { success, AppError } from "../utils/apiResponse";
import { uploadService } from "../services/upload.service";
import { listingService } from "../services/listing.service";
import { ratingController } from "../controllers/rating.controller";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new AppError("Only image files are allowed", 415));
    }
    cb(null, true);
  },
});

// Public / tenant search
router.get("/", listingController.search);
router.get("/mine", authenticate, authorize("OWNER"), listingController.myListings);
router.get("/:id", listingController.getOne);

// Owner CRUD
router.post("/", authenticate, authorize("OWNER"), validate(createListingSchema), listingController.create);
router.put("/:id", authenticate, authorize("OWNER"), validate(updateListingSchema), listingController.update);
router.delete("/:id", authenticate, authorize("OWNER"), listingController.remove);
router.patch("/:id/fill", authenticate, authorize("OWNER"), listingController.markFilled);

// Image upload (multipart) -> Cloudinary, persisted as ListingImage rows
router.post(
  "/:id/images",
  authenticate,
  authorize("OWNER"),
  upload.array("images", 8),
  asyncHandler(async (req, res) => {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) {
      return success(res, [], "No images provided", 200);
    }

    // Cloudinary failures are caught per-file inside uploadService and rethrown
    // as a meaningful AppError, which the global error handler converts into
    // a clean JSON response instead of a raw stack trace.
    const uploaded = await Promise.all(files.map((f) => uploadService.uploadImage(f.buffer, f.mimetype)));
    const listing = await listingService.addImages(req.user!.id, req.params.id, uploaded);
    success(res, listing, "Images uploaded", 201);
  })
);

// Tenant profile
router.post("/tenant/profile", authenticate, authorize("TENANT"), validate(tenantProfileSchema), listingController.upsertTenantProfile);
router.get("/tenant/profile", authenticate, authorize("TENANT"), listingController.getTenantProfile);

// Star ratings - any logged-in tenant can rate a room; ratings are public to read
router.get("/:id/ratings", ratingController.list);
router.post("/:id/ratings", authenticate, authorize("TENANT"), validate(ratingSchema), ratingController.rate);
router.get("/:id/ratings/mine", authenticate, authorize("TENANT"), ratingController.mine);

export default router;
