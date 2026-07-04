import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { userRepository } from "../repositories/user.repository";
import { asyncHandler } from "../utils/asyncHandler";
import { success } from "../utils/apiResponse";

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    success(res, result, "Registered successfully", 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    success(res, result, "Logged in successfully");
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await userRepository.findById(req.user!.id);
    success(res, user, "Current user");
  }),
};
