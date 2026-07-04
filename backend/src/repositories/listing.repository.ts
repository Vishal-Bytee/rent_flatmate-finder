import { FurnishingStatus, Prisma, RoomType } from "@prisma/client";
import { prisma } from "../config/db";

export interface ListingSearchFilters {
  location?: string;
  minRent?: number;
  maxRent?: number;
  tenantId?: string; // used to sort by compatibility score
  skip?: number;
  take?: number;
}

export const listingRepository = {
  create(ownerId: string, data: {
    title: string;
    description: string;
    location: string;
    rent: number;
    availableFrom: Date;
    roomType: RoomType;
    furnishingStatus: FurnishingStatus;
    images?: string[];
  }) {
    const { images, ...rest } = data;
    return prisma.listing.create({
      data: {
        ownerId,
        ...rest,
        images: images?.length
          ? { create: images.map((url) => ({ url })) }
          : undefined,
      },
      include: { images: true },
    });
  },

  findById(id: string) {
    return prisma.listing.findUnique({
      where: { id },
      include: { images: true, owner: { include: { user: true } } },
    });
  },

  update(id: string, data: Prisma.ListingUpdateInput) {
    return prisma.listing.update({ where: { id }, data, include: { images: true } });
  },

  delete(id: string) {
    return prisma.listing.delete({ where: { id } });
  },

  markFilled(id: string, isFilled: boolean) {
    return prisma.listing.update({ where: { id }, data: { isFilled } });
  },

  belongsToOwnerProfile(listingId: string, ownerProfileId: string) {
    return prisma.listing.findFirst({ where: { id: listingId, ownerId: ownerProfileId } });
  },

  addImages(listingId: string, images: { url: string; publicId: string }[]) {
    return prisma.listingImage.createMany({
      data: images.map((img) => ({ listingId, url: img.url, publicId: img.publicId })),
    });
  },

  async search(filters: ListingSearchFilters) {
    const { location, minRent, maxRent, skip = 0, take = 20 } = filters;

    const where: Prisma.ListingWhereInput = {
      isFilled: false,
      ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
      ...(minRent !== undefined || maxRent !== undefined
        ? { rent: { gte: minRent ?? undefined, lte: maxRent ?? undefined } }
        : {}),
    };

    const listings = await prisma.listing.findMany({
      where,
      include: {
        images: true,
        compatibilityScores: filters.tenantId
          ? { where: { tenantId: filters.tenantId } }
          : false,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    const total = await prisma.listing.count({ where });

    return { listings, total };
  },

  listByOwner(ownerProfileId: string) {
    return prisma.listing.findMany({
      where: { ownerId: ownerProfileId },
      include: { images: true },
      orderBy: { createdAt: "desc" },
    });
  },

  count() {
    return prisma.listing.count();
  },

  countFilled() {
    return prisma.listing.count({ where: { isFilled: true } });
  },

  delete_admin(id: string) {
    return prisma.listing.delete({ where: { id } });
  },
};
