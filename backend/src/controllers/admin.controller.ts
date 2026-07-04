import { Request, Response } from "express";
import { adminService } from "../services/admin.service";
import { asyncHandler } from "../utils/asyncHandler";
import { success } from "../utils/apiResponse";

export const adminController = {
  dashboard: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats();
    success(res, stats, "Dashboard stats");
  }),

  listUsers: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) || "1", 10);
    const pageSize = parseInt((req.query.pageSize as string) || "20", 10);
    const users = await adminService.listUsers(page, pageSize);
    success(res, users, "Users");
  }),

  deactivateUser: asyncHandler(async (req: Request, res: Response) => {
    await adminService.deactivateUser(req.params.id);
    success(res, null, "User deactivated");
  }),

  listListings: asyncHandler(async (req: Request, res: Response) => {
    const { listings } = await (await import("../services/listing.service")).listingService.search({
      skip: 0,
      take: 100,
    });
    success(res, listings, "Listings");
  }),

  deleteListing: asyncHandler(async (req: Request, res: Response) => {
    await adminService.deleteListing(req.params.id);
    success(res, null, "Listing deleted");
  }),
};
