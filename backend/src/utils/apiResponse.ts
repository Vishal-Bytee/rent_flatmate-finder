import { Response } from "express";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function success(res: Response, data: unknown, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

export function fail(res: Response, message = "Something went wrong", statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}
