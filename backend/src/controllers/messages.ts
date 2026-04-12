import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import { getOnlineUsers } from "../socket.js";

function normalizeParticipants(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function listConversations(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ participant1Id: userId }, { participant2Id: userId }] },
      include: {
        participant1: { select: { id: true, firstName: true, lastName: true, photo: true } },
        participant2: { select: { id: true, firstName: true, lastName: true, photo: true } },
        community: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });

    const result = await Promise.all(
      conversations.map(async (c) => {
        const other = c.participant1Id === userId ? c.participant2 : c.participant1;
        const lastMessage = c.messages[0] || null;
        const unreadCount = await prisma.message.count({
          where: { conversationId: c.id, senderId: { not: userId }, status: { not: "READ" } },
        });
        return {
          id: c.id,
          other,
          community: c.community,
          lastMessage,
          unreadCount,
          updatedAt: c.updatedAt,
        };
      }),
    );

    // Attach online status
    const online = getOnlineUsers();
    const withOnline = result.map((c) => ({ ...c, online: online.has(c.other.id) }));
    res.json(withOnline);
  } catch (err) {
    next(err);
  }
}

const getMessagesSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const conversationId = req.params.id as string;

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || (conversation.participant1Id !== userId && conversation.participant2Id !== userId)) {
      throw new AppError(403, "Accès non autorisé à cette conversation");
    }

    const { cursor, limit } = getMessagesSchema.parse(req.query);

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, photo: true } },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    // Mark received messages as read
    await prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, status: { not: "READ" } },
      data: { status: "READ" },
    });

    res.json({
      messages,
      nextCursor: hasMore ? messages[messages.length - 1].id : null,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
}

const createConversationSchema = z.object({
  recipientId: z.string().min(1),
  communityId: z.string().min(1),
});

export async function createConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const data = createConversationSchema.parse(req.body);

    if (data.recipientId === userId) {
      throw new AppError(400, "Vous ne pouvez pas vous envoyer un message à vous-même");
    }

    // Verify both users are members of the community
    const memberships = await prisma.communityMember.findMany({
      where: { communityId: data.communityId, userId: { in: [userId, data.recipientId] } },
    });
    if (memberships.length !== 2) {
      throw new AppError(403, "Les deux utilisateurs doivent être membres de la communauté");
    }

    const [p1, p2] = normalizeParticipants(userId, data.recipientId);

    // Find or create conversation
    const conversation = await prisma.conversation.upsert({
      where: { participant1Id_participant2Id_communityId: { participant1Id: p1, participant2Id: p2, communityId: data.communityId } },
      create: { participant1Id: p1, participant2Id: p2, communityId: data.communityId },
      update: {},
      include: {
        participant1: { select: { id: true, firstName: true, lastName: true, photo: true } },
        participant2: { select: { id: true, firstName: true, lastName: true, photo: true } },
        community: { select: { id: true, name: true } },
      },
    });

    const other = conversation.participant1Id === userId ? conversation.participant2 : conversation.participant1;
    res.json({ id: conversation.id, other, community: conversation.community });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
}

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message requis").max(5000),
  replyToId: z.string().optional(),
});

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const conversationId = req.params.id as string;

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || (conversation.participant1Id !== userId && conversation.participant2Id !== userId)) {
      throw new AppError(403, "Accès non autorisé à cette conversation");
    }

    const data = sendMessageSchema.parse(req.body);

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          content: data.content,
          senderId: userId,
          conversationId,
          replyToId: data.replyToId ?? null,
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, photo: true } },
          replyTo: {
            select: {
              id: true,
              content: true,
              sender: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
    ]);

    res.status(201).json(message);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
}
