import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { getWalletBalance } from "../services/solana/balance";
import { getTransactionHistory } from "../services/solana/history";

const router = Router();

/**
 * GET /api/wallet/balance
 */
router.get(
  "/api/wallet/balance",
  authMiddleware,
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const balance = await getWalletBalance(user.walletAddress);
      return res.json(balance);
    } catch {
      return res
        .status(500)
        .json({ error: "Failed to fetch wallet balance" });
    }
  }
);

/**
 * GET /api/wallet/history
 */
const historyQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
});

router.get(
  "/api/wallet/history",
  authMiddleware,
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const parsed = historyQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid query params" });
      }

      const { limit } = parsed.data;

      const history = await getTransactionHistory(
        user.walletAddress,
        limit
      );

      return res.json(history);
    } catch {
      return res
        .status(500)
        .json({ error: "Failed to fetch wallet history" });
    }
  }
);

export default router;
