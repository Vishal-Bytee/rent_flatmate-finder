import { Request, Response } from "express";
import { listingService } from "../services/listing.service";
import { userRepository } from "../repositories/user.repository";
import { compatibilityRepository } from "../repositories/compatibility.repository";
import { asyncHandler } from "../utils/asyncHandler";
import { success } from "../utils/apiResponse";

export const listingController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const listing = await listingService.create(req.user!.id, req.body);
    success(res, listing, "Listing created", 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const listing = await listingService.update(req.user!.id, req.params.id, req.body);
    success(res, listing, "Listing updated");
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await listingService.delete(req.user!.id, req.params.id);
    success(res, null, "Listing deleted");
  }),

  markFilled: asyncHandler(async (req: Request, res: Response) => {
    const { isFilled = true } = req.body;
    const listing = await listingService.markFilled(req.user!.id, req.params.id, isFilled);
    success(res, listing, isFilled ? "Listing marked as filled" : "Listing marked as available");
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const listing = await listingService.getById(req.params.id);
    success(res, listing, "Listing details");
  }),

  myListings: asyncHandler(async (req: Request, res: Response) => {
    const listings = await listingService.listByOwner(req.user!.id);
    success(res, listings, "Your listings");
  }),

  search: asyncHandler(async (req: Request, res: Response) => {
    const { location, minRent, maxRent, page = "1", pageSize = "20" } = req.query;
    const take = parseInt(pageSize as string, 10);
    const skip = (parseInt(page as string, 10) - 1) * take;

    const result = await listingService.search(
      {
        location: location as string | undefined,
        minRent: minRent ? parseInt(minRent as string, 10) : undefined,
        maxRent: maxRent ? parseInt(maxRent as string, 10) : undefined,
        skip,
        take,
      },
      req.user?.role === "TENANT" ? req.user.id : undefined
    );

    success(res, result, "Listings");
  }),

  upsertTenantProfile: asyncHandler(async (req: Request, res: Response) => {
    const profile = await userRepository.upsertTenantProfile(req.user!.id, req.body);
    // Tenant profile changed -> invalidate cached compatibility scores so they recompute
    await compatibilityRepository.deleteAllForTenant(profile.id);
    success(res, profile, "Tenant profile saved");
  }),

  getTenantProfile: asyncHandler(async (req: Request, res: Response) => {
    const profile = await userRepository.getTenantProfileByUserId(req.user!.id);
    success(res, profile, "Tenant profile");
  }),
};
