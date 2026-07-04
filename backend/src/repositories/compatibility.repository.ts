import { ScoreSource } from "@prisma/client";
import { prisma } from "../config/db";

export const compatibilityRepository = {
  find(tenantId: string, listingId: string) {
    return prisma.compatibilityScore.findUnique({
      where: { tenantId_listingId: { tenantId, listingId } },
    });
  },

  upsert(tenantId: string, listingId: string, score: number, explanation: string, source: ScoreSource) {
    return prisma.compatibilityScore.upsert({
      where: { tenantId_listingId: { tenantId, listingId } },
      update: { score, explanation, source },
      create: { tenantId, listingId, score, explanation, source },
    });
  },

  // Invalidate (delete) all scores for a tenant so they get recomputed lazily
  deleteAllForTenant(tenantId: string) {
    return prisma.compatibilityScore.deleteMany({ where: { tenantId } });
  },

  deleteAllForListing(listingId: string) {
    return prisma.compatibilityScore.deleteMany({ where: { listingId } });
  },
};
