import { Request, Response } from "express";
import { ratingService } from "../services/rating.service";
import { asyncHandler } from "../utils/asyncHandler";
import { success } from "../utils/apiResponse";

export const ratingController = {
  rate: asyncHandler(async (req: Request, res: Response) => {
    const rating = await ratingService.rate(req.user!.id, req.params.id, req.body);
    success(res, rating, "Rating saved");
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await ratingService.listForListing(req.params.id);
    success(res, result, "Ratings");
  }),

  mine: asyncHandler(async (req: Request, res: Response) => {
    const rating = await ratingService.getMyRating(req.user!.id, req.params.id);
    success(res, rating, "Your rating");
  }),
};
