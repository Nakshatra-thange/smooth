import { Router , type Request , type Response } from "express";
import { prisma } from "../config/database";
import { authMiddleware } from "../middleware/auth";

const router = Router();

/**
 * ======================================
 * GET /api/conversations
 * ======================================
 */
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: user.id,  // Using user.id from the authMiddleware
        isActive: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return res.json(conversations);
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return res.status(500).json({
      error: "Failed to fetch conversations",
    });
  }
});

/**
 * ======================================
 * GET /api/conversations/:id
 * ======================================
 */
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const conversationId = String(req.params.id);

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
  } catch (error) {
    console.error("Failed to load conversation:", error);
    return res.status(500).json({
      error: "Failed to load conversation",
    });
  }
});

/**
 * ======================================
 * DELETE /api/conversations/:id
 * ======================================
 */
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const conversationId = String(req.params.id);

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
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    return res.status(500).json({
      error: "Failed to delete conversation",
    });
  }
});

export default router;