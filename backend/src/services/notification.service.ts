import { NotificationType } from "@prisma/client";
import { prisma } from "../config/db";
import { getIO } from "../socket/socket";

export const notificationService = {
  async notify(userId: string, type: NotificationType, title: string, body: string) {
    const notification = await prisma.notification.create({
      data: { userId, type, title, body },
    });

    // Push in real time if the user has an active socket connection
    try {
      getIO().to(`user:${userId}`).emit("notification", notification);
    } catch {
      // Socket.io not initialized yet (e.g. during tests) - ignore
    }

    return notification;
  },

  list(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },

  markRead(id: string) {
    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  },
};
