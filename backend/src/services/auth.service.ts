import { Role } from "@prisma/client";
import { userRepository } from "../repositories/user.repository";
import { hashPassword, comparePassword } from "../utils/hash";
import { signToken } from "../utils/jwt";
import { AppError } from "../utils/apiResponse";
import { RegisterInput, LoginInput } from "../validators/auth.validator";

export const authService = {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError("An account with this email already exists", 409);
    }

    const passwordHash = await hashPassword(input.password);
    const role = input.role as Role;

    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role,
    });

    if (role === "OWNER") {
      await userRepository.createOwnerProfile(user.id, input.phone);
    }
    // Tenant profile is created separately via the profile endpoint,
    // since it requires additional fields (budget, move-in date, etc).

    const token = signToken({ id: user.id, role: user.role, email: user.email });
    return { user: sanitize(user), token };
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }
    if (!user.isActive) {
      throw new AppError("This account has been deactivated. Contact support.", 403);
    }

    const valid = await comparePassword(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = signToken({ id: user.id, role: user.role, email: user.email });
    return { user: sanitize(user), token };
  },
};

function sanitize<T extends { passwordHash: string }>(user: T) {
  const { passwordHash, ...rest } = user;
  return rest;
}
