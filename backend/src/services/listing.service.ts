import { listingRepository, ListingSearchFilters } from "../repositories/listing.repository";
import { compatibilityRepository } from "../repositories/compatibility.repository";
import { compatibilityService } from "./compatibility.service";
import { ratingRepository } from "../repositories/rating.repository";
import { userRepository } from "../repositories/user.repository";
import { AppError } from "../utils/apiResponse";
import { CreateListingInput } from "../validators/listing.validator";

export const listingService = {
  async create(ownerUserId: string, input: CreateListingInput) {
    const ownerProfile = await userRepository.getOwnerProfileByUserId(ownerUserId);
    if (!ownerProfile) throw new AppError("Owner profile not found", 404);

    const listing = await listingRepository.create(ownerProfile.id, input);

    // New listing created -> compatibility scores are invalidated/generated lazily
    // (they'll be computed on first search per tenant that views it)
    return listing;
  },

  async update(ownerUserId: string, listingId: string, input: Partial<CreateListingInput>) {
    const ownerProfile = await userRepository.getOwnerProfileByUserId(ownerUserId);
    if (!ownerProfile) throw new AppError("Owner profile not found", 404);

    const owns = await listingRepository.belongsToOwnerProfile(listingId, ownerProfile.id);
    if (!owns) throw new AppError("Listing not found or not owned by you", 404);

    const { images, ...rest } = input;
    const updated = await listingRepository.update(listingId, rest as never);

    // Listing changed materially -> invalidate cached compatibility scores
    await compatibilityRepository.deleteAllForListing(listingId);

    return updated;
  },

  async delete(ownerUserId: string, listingId: string) {
    const ownerProfile = await userRepository.getOwnerProfileByUserId(ownerUserId);
    if (!ownerProfile) throw new AppError("Owner profile not found", 404);

    const owns = await listingRepository.belongsToOwnerProfile(listingId, ownerProfile.id);
    if (!owns) throw new AppError("Listing not found or not owned by you", 404);

    return listingRepository.delete(listingId);
  },

  async markFilled(ownerUserId: string, listingId: string, isFilled: boolean) {
    const ownerProfile = await userRepository.getOwnerProfileByUserId(ownerUserId);
    if (!ownerProfile) throw new AppError("Owner profile not found", 404);

    const owns = await listingRepository.belongsToOwnerProfile(listingId, ownerProfile.id);
    if (!owns) throw new AppError("Listing not found or not owned by you", 404);

    return listingRepository.markFilled(listingId, isFilled);
  },

  async addImages(ownerUserId: string, listingId: string, images: { url: string; publicId: string }[]) {
    const ownerProfile = await userRepository.getOwnerProfileByUserId(ownerUserId);
    if (!ownerProfile) throw new AppError("Owner profile not found", 404);

    const owns = await listingRepository.belongsToOwnerProfile(listingId, ownerProfile.id);
    if (!owns) throw new AppError("Listing not found or not owned by you", 404);

    await listingRepository.addImages(listingId, images);
    return listingRepository.findById(listingId);
  },

  async getById(id: string) {
    const listing = await listingRepository.findById(id);
    if (!listing) throw new AppError("Listing not found", 404);

    const averages = await ratingRepository.getAverages([id]);
    return { ...listing, rating: averages[id] ?? { average: 0, count: 0 } };
  },

  listByOwner(ownerUserId: string) {
    return userRepository.getOwnerProfileByUserId(ownerUserId).then((profile: { id: string } | null) => {
      if (!profile) throw new AppError("Owner profile not found", 404);
      return listingRepository.listByOwner(profile.id);
    });
  },

  /**
   * Search listings for a tenant. Ensures compatibility scores exist for
   * every result (computing lazily and caching), then sorts by score DESC,
   * then newest first.
   */
  async search(filters: ListingSearchFilters, tenantUserId?: string) {
    let tenantProfile = null;
    if (tenantUserId) {
      tenantProfile = await userRepository.getTenantProfileByUserId(tenantUserId);
    }

    const { listings, total } = await listingRepository.search({
      ...filters,
      tenantId: tenantProfile?.id,
    });

    const averages = await ratingRepository.getAverages(listings.map((l) => l.id));
    const withRatings = listings.map((l) => ({ ...l, rating: averages[l.id] ?? { average: 0, count: 0 } }));

    if (!tenantProfile) {
      return { listings: withRatings.map((l) => ({ ...l, compatibility: null })), total };
    }

    const enriched = await Promise.all(
      withRatings.map(async (listing) => {
        const existing = listing.compatibilityScores?.[0];
        if (existing) {
          return { ...listing, compatibility: { score: existing.score, explanation: existing.explanation } };
        }
        const generated = await compatibilityService.generate(listing, tenantProfile!);
        return { ...listing, compatibility: { score: generated.score, explanation: generated.explanation } };
      })
    );

    enriched.sort((a, b) => {
      const scoreDiff = (b.compatibility?.score ?? 0) - (a.compatibility?.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return { listings: enriched, total };
  },
};
