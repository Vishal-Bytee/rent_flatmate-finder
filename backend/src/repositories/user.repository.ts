import { Role } from "@prisma/client";
import { prisma } from "../config/db";

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { tenantProfile: true, ownerProfile: true },
    });
  },

  create(data: { name: string; email: string; passwordHash: string; role: Role }) {
    return prisma.user.create({ data });
  },

  createOwnerProfile(userId: string, phone?: string) {
    return prisma.ownerProfile.create({ data: { userId, phone } });
  },

  createTenantProfile(userId: string, data: {
    preferredLocation: string;
    minimumBudget: number;
    maximumBudget: number;
    moveInDate: Date;
    gender?: string;
    occupation?: string;
  }) {
    return prisma.tenantProfile.create({ data: { userId, ...data } });
  },

  upsertTenantProfile(userId: string, data: {
    preferredLocation: string;
    minimumBudget: number;
    maximumBudget: number;
    moveInDate: Date;
    gender?: string;
    occupation?: string;
  }) {
    return prisma.tenantProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  },

  getTenantProfileByUserId(userId: string) {
    return prisma.tenantProfile.findUnique({ where: { userId } });
  },

  getOwnerProfileByUserId(userId: string) {
    return prisma.ownerProfile.findUnique({ where: { userId } });
  },

  listAll(skip: number, take: number) {
    return prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
      },
    });
  },

  count() {
    return prisma.user.count();
  },

  countByRole(role: Role) {
    return prisma.user.count({ where: { role } });
  },

  setActive(id: string, isActive: boolean) {
    return prisma.user.update({ where: { id }, data: { isActive } });
  },

  delete(id: string) {
    return prisma.user.delete({ where: { id } });
  },
};
