import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { fail } from "../utils/apiResponse";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return fail(res, message, 422);
    }
    req.body = result.data;
    next();
  };
}
