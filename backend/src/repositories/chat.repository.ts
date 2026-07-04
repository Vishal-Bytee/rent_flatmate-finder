import { prisma } from "../config/db";

export const chatRepository = {
  createRoomForInterest(interestRequestId: string) {
    return prisma.chatRoom.create({ data: { interestRequestId } });
  },

  findRoomById(id: string) {
    return prisma.chatRoom.findUnique({
      where: { id },
      include: {
        interestRequest: {
          include: {
            tenant: { include: { user: true } },
            listing: { include: { owner: { include: { user: true } } } },
          },
        },
      },
    });
  },

  findRoomByInterestId(interestRequestId: string) {
    return prisma.chatRoom.findUnique({ where: { interestRequestId } });
  },

  createMessage(chatRoomId: string, senderId: string, content: string) {
    return prisma.message.create({
      data: { chatRoomId, senderId, content },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });
  },

  getMessages(chatRoomId: string) {
    return prisma.message.findMany({
      where: { chatRoomId },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });
  },

  countActiveRooms() {
    return prisma.chatRoom.count();
  },

  countMessages() {
    return prisma.message.count();
  },
};
