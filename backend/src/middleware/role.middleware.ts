import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { fail } from "../utils/apiResponse";

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return fail(res, "Not authenticated", 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return fail(res, "You do not have permission to perform this action", 403);
    }
    next();
  };
}
