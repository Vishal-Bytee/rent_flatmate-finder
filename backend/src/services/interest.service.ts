import { prisma } from "../config/db";
import { interestRepository } from "../repositories/interest.repository";
import { chatRepository } from "../repositories/chat.repository";
import { compatibilityRepository } from "../repositories/compatibility.repository";
import { userRepository } from "../repositories/user.repository";
import { emailService } from "./email.service";
import { notificationService } from "./notification.service";
import { AppError } from "../utils/apiResponse";

const HIGH_COMPATIBILITY_THRESHOLD = 80;

export const interestService = {
  async create(tenantUserId: string, listingId: string) {
    const tenantProfile = await userRepository.getTenantProfileByUserId(tenantUserId);
    if (!tenantProfile) throw new AppError("Complete your tenant profile before sending interest", 400);

    const existing = await prisma.interestRequest.findUnique({
      where: { tenantId_listingId: { tenantId: tenantProfile.id, listingId } },
    });
    if (existing) throw new AppError("You have already expressed interest in this listing", 409);

    const request = await interestRepository.create(tenantProfile.id, listingId);

    // Notify owner + send email if compatibility score is high
    const score = await compatibilityRepository.find(tenantProfile.id, listingId);
    const ownerUser = request.listing.owner.user;

    await notificationService.notify(
      ownerUser.id,
      "INTEREST_RECEIVED",
      "New interest request",
      `${request.tenant.user.name} is interested in "${request.listing.title}".`
    );

    // Email is fire-and-forget: it must never block the HTTP response, and
    // emailService already catches its own failures internally, so there's
    // no unhandled rejection risk here.
    if (score && score.score > HIGH_COMPATIBILITY_THRESHOLD) {
      void emailService.notifyOwnerHighInterest(
        ownerUser.email,
        request.listing.title,
        ownerUser.name,
        request.tenant.user.name
      );
    }

    return request;
  },

  async accept(ownerUserId: string, interestId: string) {
    const request = await this.assertOwnerOwnsRequest(ownerUserId, interestId);

    if (request.status !== "PENDING") {
      throw new AppError(`This request has already been ${request.status.toLowerCase()}`, 409);
    }

    const updated = await interestRepository.updateStatus(interestId, "ACCEPTED");

    // Idempotent: if a chat room already exists for this request (e.g. a
    // retried request after a slow response), reuse it instead of trying
    // to create a second one and hitting the unique constraint.
    const chatRoom =
      (await chatRepository.findRoomByInterestId(interestId)) ??
      (await chatRepository.createRoomForInterest(interestId));

    const tenantUser = request.tenant.user;
    const ownerUser = request.listing.owner.user;

    await notificationService.notify(
      tenantUser.id,
      "INTEREST_ACCEPTED",
      "Interest accepted",
      `Your interest in "${request.listing.title}" was accepted. You can now chat with the owner.`
    );

    // Fire-and-forget - never block the response on an SMTP round trip.
    void emailService.notifyTenantInterestAccepted(
      tenantUser.email,
      request.listing.title,
      ownerUser.name,
      tenantUser.name
    );

    return { request: updated, chatRoom };
  },

  async decline(ownerUserId: string, interestId: string) {
    const request = await this.assertOwnerOwnsRequest(ownerUserId, interestId);

    if (request.status !== "PENDING") {
      throw new AppError(`This request has already been ${request.status.toLowerCase()}`, 409);
    }

    const updated = await interestRepository.updateStatus(interestId, "DECLINED");

    const tenantUser = request.tenant.user;
    const ownerUser = request.listing.owner.user;

    await notificationService.notify(
      tenantUser.id,
      "INTEREST_DECLINED",
      "Interest declined",
      `Your interest in "${request.listing.title}" was declined.`
    );

    // Fire-and-forget - never block the response on an SMTP round trip.
    void emailService.notifyTenantInterestDeclined(
      tenantUser.email,
      request.listing.title,
      ownerUser.name,
      tenantUser.name
    );

    return updated;
  },

  async assertOwnerOwnsRequest(ownerUserId: string, interestId: string) {
    const request = await interestRepository.findById(interestId);
    if (!request) throw new AppError("Interest request not found", 404);

    const ownerProfile = await userRepository.getOwnerProfileByUserId(ownerUserId);
    if (!ownerProfile || request.listing.ownerId !== ownerProfile.id) {
      throw new AppError("You do not own the listing tied to this request", 403);
    }
    return request;
  },

  listForTenant(tenantUserId: string) {
    return userRepository.getTenantProfileByUserId(tenantUserId).then((profile: { id: string } | null) => {
      if (!profile) throw new AppError("Tenant profile not found", 404);
      return interestRepository.listForTenant(profile.id);
    });
  },

  listForOwner(ownerUserId: string) {
    return userRepository.getOwnerProfileByUserId(ownerUserId).then((profile: { id: string } | null) => {
      if (!profile) throw new AppError("Owner profile not found", 404);
      return interestRepository.listForOwnerListings(profile.id);
    });
  },
};
