import { Request, Response } from "express";
import { interestService } from "../services/interest.service";
import { asyncHandler } from "../utils/asyncHandler";
import { success } from "../utils/apiResponse";

export const interestController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const request = await interestService.create(req.user!.id, req.body.listingId);
    success(res, request, "Interest request sent", 201);
  }),

  accept: asyncHandler(async (req: Request, res: Response) => {
    const result = await interestService.accept(req.user!.id, req.params.id);
    success(res, result, "Interest request accepted");
  }),

  decline: asyncHandler(async (req: Request, res: Response) => {
    const result = await interestService.decline(req.user!.id, req.params.id);
    success(res, result, "Interest request declined");
  }),

  myRequests: asyncHandler(async (req: Request, res: Response) => {
    const list =
      req.user!.role === "TENANT"
        ? await interestService.listForTenant(req.user!.id)
        : await interestService.listForOwner(req.user!.id);
    success(res, list, "Interest requests");
  }),
};
