import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyToken } from "../utils/jwt";
import { env } from "../config/env";
import { chatService } from "../services/chat.service";

let io: Server | null = null;

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

interface AuthedSocket extends Socket {
  userId?: string;
}

export function initSocket(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  // Authenticate every socket connection via JWT passed in the handshake
  io.use((socket: AuthedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error("Authentication required"));
      const decoded = verifyToken(token);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
    if (socket.userId) {
      // Personal room used to push notifications to a specific user
      socket.join(`user:${socket.userId}`);
    }

    socket.on("join-room", async (roomId: string) => {
      try {
        if (!socket.userId) return;
        await chatService.getRoomForUser(roomId, socket.userId); // access control
        socket.join(roomId);
      } catch (err) {
        socket.emit("error", { message: err instanceof Error ? err.message : "Unable to join room" });
      }
    });

    socket.on("send-message", async ({ roomId, content }: { roomId: string; content: string }) => {
      try {
        if (!socket.userId) return;
        const message = await chatService.postMessage(roomId, socket.userId, content);
        io!.to(roomId).emit("receive-message", message);
      } catch (err) {
        socket.emit("error", { message: err instanceof Error ? err.message : "Unable to send message" });
      }
    });

    socket.on("typing", ({ roomId }: { roomId: string }) => {
      socket.to(roomId).emit("typing", { userId: socket.userId });
    });

    socket.on("stop-typing", ({ roomId }: { roomId: string }) => {
      socket.to(roomId).emit("stop-typing", { userId: socket.userId });
    });

    socket.on("disconnect", () => {
      // Rooms are cleaned up automatically by socket.io on disconnect
    });
  });

  return io;
}
