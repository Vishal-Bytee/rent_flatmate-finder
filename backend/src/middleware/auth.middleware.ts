import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";
import { fail } from "../utils/apiResponse";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return fail(res, "Authentication token missing", 401);
  }

  const token = header.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return fail(res, "Invalid or expired token", 401);
  }
}
