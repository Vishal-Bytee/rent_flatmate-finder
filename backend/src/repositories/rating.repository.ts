import { prisma } from "../config/db";

export const ratingRepository = {
  upsert(listingId: string, tenantId: string, stars: number, comment?: string) {
    return prisma.rating.upsert({
      where: { listingId_tenantId: { listingId, tenantId } },
      update: { stars, comment },
      create: { listingId, tenantId, stars, comment },
      include: { tenant: { include: { user: { select: { name: true } } } } },
    });
  },

  findByListingAndTenant(listingId: string, tenantId: string) {
    return prisma.rating.findUnique({
      where: { listingId_tenantId: { listingId, tenantId } },
    });
  },

  listForListing(listingId: string) {
    return prisma.rating.findMany({
      where: { listingId },
      include: { tenant: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Returns { [listingId]: { average, count } } for a batch of listings in
   * a single query, so search results don't trigger N+1 aggregate calls.
   */
  async getAverages(listingIds: string[]): Promise<Record<string, { average: number; count: number }>> {
    if (listingIds.length === 0) return {};

    const grouped = await prisma.rating.groupBy({
      by: ["listingId"],
      where: { listingId: { in: listingIds } },
      _avg: { stars: true },
      _count: { stars: true },
    });

    const result: Record<string, { average: number; count: number }> = {};
    for (const g of grouped) {
      result[g.listingId] = {
        average: Math.round((g._avg.stars ?? 0) * 10) / 10,
        count: g._count.stars,
      };
    }
    return result;
  },
};
