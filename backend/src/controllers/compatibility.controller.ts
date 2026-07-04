import { Request, Response } from "express";
import { compatibilityService } from "../services/compatibility.service";
import { listingRepository } from "../repositories/listing.repository";
import { userRepository } from "../repositories/user.repository";
import { asyncHandler } from "../utils/asyncHandler";
import { success, AppError } from "../utils/apiResponse";

export const compatibilityController = {
  generate: asyncHandler(async (req: Request, res: Response) => {
    const { listingId } = req.body;

    const listing = await listingRepository.findById(listingId);
    if (!listing) throw new AppError("Listing not found", 404);

    const tenant = await userRepository.getTenantProfileByUserId(req.user!.id);
    if (!tenant) throw new AppError("Complete your tenant profile first", 400);

    const result = await compatibilityService.generate(listing, tenant);
    success(res, result, "Compatibility score generated");
  }),
};
