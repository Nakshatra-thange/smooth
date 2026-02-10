import { Router } from "express";
import { prisma } from "../config/database";
import { authMiddleware } from "../middleware/auth";

const router = Router();

/**
 * GET /api/conversations
 */
router.get(
  "/api/conversations",
  authMiddleware,
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const conversations: Awaited<
  ReturnType<typeof prisma.conversation.findMany>
>  = await prisma.conversation.findMany({
        where: {
          userId: user.id,
          isActive: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          _count: {
            select: { messages: true },
          },
        },
      });

      return res.json(
        conversations.map((c) => ({
          id: c.id,
          title: c.title,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          messageCount: c._count.messages,
        }))
      );
    } catch {
      return res
        .status(500)
        .json({ error: "Failed to fetch conversations" });
    }
  }
);

/**
 * GET /api/conversations/:id
 */
router.get(
  "/api/conversations/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const user = req.user;
      const conversationId = req.params.id;

      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId: user.id,
          isActive: true,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!conversation) {
        return res.status(404).json({
          error: "Conversation not found",
        });
      }

      return res.json(conversation);
    } catch {
      return res
        .status(500)
        .json({ error: "Failed to load conversation" });
    }
  }
);

/**
 * DELETE /api/conversations/:id
 * Soft delete
 */
router.delete(
  "/api/conversations/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const user = req.user;
      const conversationId = req.params.id;

      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId: user.id,
        },
      });

      if (!conversation) {
        return res.status(404).json({
          error: "Conversation not found",
        });
      }

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { isActive: false },
      });

      return res.json({ success: true });
    } catch {
      return res
        .status(500)
        .json({ error: "Failed to delete conversation" });
    }
  }
);

export default router;
