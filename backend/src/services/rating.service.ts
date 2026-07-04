import { ratingRepository } from "../repositories/rating.repository";
import { listingRepository } from "../repositories/listing.repository";
import { userRepository } from "../repositories/user.repository";
import { AppError } from "../utils/apiResponse";
import { RatingInput } from "../validators/listing.validator";

export const ratingService = {
  async rate(tenantUserId: string, listingId: string, input: RatingInput) {
    const listing = await listingRepository.findById(listingId);
    if (!listing) throw new AppError("Listing not found", 404);

    const tenantProfile = await userRepository.getTenantProfileByUserId(tenantUserId);
    if (!tenantProfile) throw new AppError("Complete your tenant profile before rating a room", 400);

    return ratingRepository.upsert(listingId, tenantProfile.id, input.stars, input.comment);
  },

  async listForListing(listingId: string) {
    const listing = await listingRepository.findById(listingId);
    if (!listing) throw new AppError("Listing not found", 404);

    const ratings = await ratingRepository.listForListing(listingId);
    const averages = await ratingRepository.getAverages([listingId]);

    return {
      ratings,
      summary: averages[listingId] ?? { average: 0, count: 0 },
    };
  },

  async getMyRating(tenantUserId: string, listingId: string) {
    const tenantProfile = await userRepository.getTenantProfileByUserId(tenantUserId);
    if (!tenantProfile) return null;
    return ratingRepository.findByListingAndTenant(listingId, tenantProfile.id);
  },
};
