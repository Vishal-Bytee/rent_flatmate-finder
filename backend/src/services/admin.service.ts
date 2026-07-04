import { Role } from "@prisma/client";
import { userRepository } from "../repositories/user.repository";
import { listingRepository } from "../repositories/listing.repository";
import { interestRepository } from "../repositories/interest.repository";
import { chatRepository } from "../repositories/chat.repository";

export const adminService = {
  async getDashboardStats() {
    const [totalUsers, totalOwners, totalTenants, totalListings, filledListings, activeChats, interestRequests, totalMessages] =
      await Promise.all([
        userRepository.count(),
        userRepository.countByRole(Role.OWNER),
        userRepository.countByRole(Role.TENANT),
        listingRepository.count(),
        listingRepository.countFilled(),
        chatRepository.countActiveRooms(),
        interestRepository.count(),
        chatRepository.countMessages(),
      ]);

    return {
      totalUsers,
      totalOwners,
      totalTenants,
      totalListings,
      filledListings,
      activeChats,
      interestRequests,
      totalMessages,
    };
  },

  listUsers(page: number, pageSize: number) {
    return userRepository.listAll((page - 1) * pageSize, pageSize);
  },

  deactivateUser(id: string) {
    return userRepository.setActive(id, false);
  },

  deleteListing(id: string) {
    return listingRepository.delete_admin(id);
  },
};
