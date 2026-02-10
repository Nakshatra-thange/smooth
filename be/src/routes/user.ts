import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { authMiddleware } from "../middleware/auth";

const router = Router();

/**
 * GET /api/user/profile
 */
router.get(
  "/api/user/profile",
  authMiddleware,
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        id: dbUser.id,
        walletAddress: dbUser.walletAddress,
        createdAt: dbUser.createdAt,
        lastSeenAt: dbUser.lastSeenAt,
        preferences: dbUser.preferences ?? {},
      });
    } catch {
      return res
        .status(500)
        .json({ error: "Failed to fetch user profile" });
    }
  }
);

/**
 * PATCH /api/user/preferences
 */
const preferencesSchema = z.object({
  theme: z.string().optional(),
  language: z.string().optional(),
}).strict();

router.patch(
  "/api/user/preferences",
  authMiddleware,
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const parsed = preferencesSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid preferences payload",
          details: parsed.error.flatten(),
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const existingPrefs =
        (existingUser.preferences as Record<string, unknown>) ?? {};

      const updatedPreferences = {
        ...existingPrefs,
        ...parsed.data,
      };

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          preferences: updatedPreferences,
        },
      });

      return res.json({
        preferences: updatedUser.preferences,
      });
    } catch {
      return res
        .status(500)
        .json({ error: "Failed to update preferences" });
    }
  }
);

export default router;
