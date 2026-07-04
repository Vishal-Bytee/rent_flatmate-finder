import { chatRepository } from "../repositories/chat.repository";
import { AppError } from "../utils/apiResponse";

export const chatService = {
  async getRoomForUser(roomId: string, userId: string) {
    const room = await chatRepository.findRoomById(roomId);
    if (!room) throw new AppError("Chat room not found", 404);

    const tenantUserId = room.interestRequest.tenant.user.id;
    const ownerUserId = room.interestRequest.listing.owner.user.id;

    if (userId !== tenantUserId && userId !== ownerUserId) {
      throw new AppError("You do not have access to this chat", 403);
    }
    if (room.interestRequest.status !== "ACCEPTED") {
      throw new AppError("Chat is only available once the interest request is accepted", 403);
    }

    return room;
  },

  async getMessages(roomId: string, userId: string) {
    await this.getRoomForUser(roomId, userId);
    return chatRepository.getMessages(roomId);
  },

  async postMessage(roomId: string, userId: string, content: string) {
    await this.getRoomForUser(roomId, userId);
    return chatRepository.createMessage(roomId, userId, content);
  },
};
