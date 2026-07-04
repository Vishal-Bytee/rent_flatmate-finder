import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthUser } from "../types/express";

export function signToken(payload: AuthUser): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, env.jwtSecret) as AuthUser;
}
