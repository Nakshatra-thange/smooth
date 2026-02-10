import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { authMiddleware } from "../middleware/auth";
import { submitSignedTransaction } from "../services/solana/submit";
import { pollTransactionConfirmation } from "../services/solana/confirm";

const router = Router();

/**
 * GET /api/transactions
 */
const listQuerySchema = z.object({
  status: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
  offset: z.coerce.number().min(0).default(0),
});

router.get(
  "/api/transactions",
  authMiddleware,
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const parsed = listQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid query params" });
      }

      const { status, limit, offset } = parsed.data;

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          ...(status ? { status } : {}),
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      });

      return res.json(transactions);
    } catch {
      return res
        .status(500)
        .json({ error: "Failed to fetch transactions" });
    }
  }
);

/**
 * GET /api/transactions/:id
 */
router.get(
  "/api/transactions/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const user = req.user;
      const txId = req.params.id;

      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const tx = await prisma.transaction.findFirst({
        where: {
          id: txId,
          userId: user.id,
        },
      });

      if (!tx) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      return res.json(tx);
    } catch {
      return res
        .status(500)
        .json({ error: "Failed to fetch transaction" });
    }
  }
);

/**
 * POST /api/transactions/:id/submit
 */
const submitSchema = z.object({
  signedTransaction: z.string().min(1),
});

router.post(
  "/api/transactions/:id/submit",
  authMiddleware,
  async (req, res) => {
    try {
      const user = req.user;
      const txId = req.params.id;

      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const parsed = submitSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const tx = await prisma.transaction.findFirst({
        where: {
          id: txId,
          userId: user.id,
        },
      });

      if (!tx) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (tx.status !== "PENDING") {
        return res
          .status(400)
          .json({ error: "Transaction not pending" });
      }

      if (tx.expiresAt && tx.expiresAt < new Date()) {
        return res
          .status(400)
          .json({ error: "Transaction expired" });
      }

      const signature = await submitSignedTransaction(
        parsed.data.signedTransaction
      );

      await prisma.transaction.update({
        where: { id: txId },
        data: {
          status: "SUBMITTED",
          signature,
        },
      });

      pollTransactionConfirmation(signature, txId).catch(() => {});

      return res.json({
        success: true,
        signature,
        status: "SUBMITTED",
      });
    } catch {
      return res
        .status(500)
        .json({ error: "Failed to submit transaction" });
    }
  }
);

/**
 * POST /api/transactions/:id/cancel
 */
router.post(
  "/api/transactions/:id/cancel",
  authMiddleware,
  async (req, res) => {
    try {
      const user = req.user;
      const txId = req.params.id;

      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const tx = await prisma.transaction.findFirst({
        where: {
          id: txId,
          userId: user.id,
        },
      });

      if (!tx) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (tx.status !== "PENDING") {
        return res
          .status(400)
          .json({ error: "Cannot cancel transaction" });
      }

      await prisma.transaction.update({
        where: { id: txId },
        data: { status: "CANCELLED" },
      });

      return res.json({ success: true });
    } catch {
      return res
        .status(500)
        .json({ error: "Failed to cancel transaction" });
    }
  }
);

export default router;
