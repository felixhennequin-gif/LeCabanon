import { Server as SocketServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { verifyAccessToken } from "./utils/jwt.js";
import { prisma } from "./utils/prisma.js";

const onlineUsers = new Set<string>();

export function getOnlineUsers(): Set<string> {
  return onlineUsers;
}

export function setupSocket(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error("Authentication required"));
    try {
      const payload = verifyAccessToken(token);
      (socket as any).userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = (socket as any).userId as string;
    socket.join(`user:${userId}`);
    onlineUsers.add(userId);

    // Notify contacts this user is online
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ participant1Id: userId }, { participant2Id: userId }] },
      select: { participant1Id: true, participant2Id: true },
    });
    const contactIds = new Set(
      conversations.map((c) => (c.participant1Id === userId ? c.participant2Id : c.participant1Id)),
    );
    for (const contactId of contactIds) {
      io.to(`user:${contactId}`).emit("user_online", { userId });
    }

    // Send message
    socket.on("send_message", async (data: { conversationId: string; content: string }) => {
      try {
        const conversation = await prisma.conversation.findUnique({ where: { id: data.conversationId } });
        if (!conversation || (conversation.participant1Id !== userId && conversation.participant2Id !== userId)) return;

        const [message] = await prisma.$transaction([
          prisma.message.create({
            data: { content: data.content, senderId: userId, conversationId: data.conversationId },
            include: { sender: { select: { id: true, firstName: true, lastName: true, photo: true } } },
          }),
          prisma.conversation.update({ where: { id: data.conversationId }, data: { updatedAt: new Date() } }),
        ]);

        const otherId = conversation.participant1Id === userId ? conversation.participant2Id : conversation.participant1Id;
        socket.emit("message_sent", { messageId: message.id, conversationId: data.conversationId });
        io.to(`user:${otherId}`).emit("new_message", { message, conversationId: data.conversationId });
      } catch (err) {
        console.error("send_message error:", err);
      }
    });

    // Mark read
    socket.on("mark_read", async (data: { conversationId: string }) => {
      try {
        const conversation = await prisma.conversation.findUnique({ where: { id: data.conversationId } });
        if (!conversation || (conversation.participant1Id !== userId && conversation.participant2Id !== userId)) return;

        await prisma.message.updateMany({
          where: { conversationId: data.conversationId, senderId: { not: userId }, status: { not: "READ" } },
          data: { status: "READ" },
        });

        const otherId = conversation.participant1Id === userId ? conversation.participant2Id : conversation.participant1Id;
        io.to(`user:${otherId}`).emit("messages_read", { conversationId: data.conversationId, readBy: userId });
      } catch (err) {
        console.error("mark_read error:", err);
      }
    });

    // Typing
    socket.on("typing", async (data: { conversationId: string }) => {
      try {
        const conversation = await prisma.conversation.findUnique({ where: { id: data.conversationId } });
        if (!conversation || (conversation.participant1Id !== userId && conversation.participant2Id !== userId)) return;

        const otherId = conversation.participant1Id === userId ? conversation.participant2Id : conversation.participant1Id;
        io.to(`user:${otherId}`).emit("user_typing", { conversationId: data.conversationId, userId });
      } catch (err) {
        console.error("typing error:", err);
      }
    });

    // Disconnect
    socket.on("disconnect", async () => {
      // Check if user still has other sockets
      const rooms = io.sockets.adapter.rooms.get(`user:${userId}`);
      if (!rooms || rooms.size === 0) {
        onlineUsers.delete(userId);
        for (const contactId of contactIds) {
          io.to(`user:${contactId}`).emit("user_offline", { userId });
        }
      }
    });
  });

  return io;
}
