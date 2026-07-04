import { InterestStatus } from "@prisma/client";
import { prisma } from "../config/db";

export const interestRepository = {
  create(tenantId: string, listingId: string) {
    return prisma.interestRequest.create({
      data: { tenantId, listingId },
      include: { listing: { include: { owner: { include: { user: true } } } }, tenant: { include: { user: true } } },
    });
  },

  findById(id: string) {
    return prisma.interestRequest.findUnique({
      where: { id },
      include: {
        listing: { include: { owner: { include: { user: true } } } },
        tenant: { include: { user: true } },
        chatRoom: true,
      },
    });
  },

  updateStatus(id: string, status: InterestStatus) {
    return prisma.interestRequest.update({ where: { id }, data: { status } });
  },

  listForTenant(tenantId: string) {
    return prisma.interestRequest.findMany({
      where: { tenantId },
      include: { listing: { include: { images: true } }, chatRoom: true },
      orderBy: { createdAt: "desc" },
    });
  },

  listForOwnerListings(ownerProfileId: string) {
    return prisma.interestRequest.findMany({
      where: { listing: { ownerId: ownerProfileId } },
      include: { listing: true, tenant: { include: { user: true } }, chatRoom: true },
      orderBy: { createdAt: "desc" },
    });
  },

  count() {
    return prisma.interestRequest.count();
  },
};
