import { PublicKey } from "@solana/web3.js";
import { getConnection } from "../../config/solana";
import { prisma } from "../../config/database";
import { logger } from "../../utils/logger";

const MAX_DETAIL_FETCH = 5;
const LAMPORTS_PER_SOL = 1_000_000_000;

export type TransactionHistoryItem = {
  signature: string;
  blockTime: number | null;
  slot: number;
  status: "success" | "failed";
  type: string;
  amount?: number;
  from?: string;
  to?: string;
};

/**
 * Get merged transaction history (Blockchain + DB)
 * Compatible with legacy + v0 transactions
 */
export const getTransactionHistory = async (
  walletAddress: string,
  limit = 10
): Promise<TransactionHistoryItem[]> => {
  try {
    const connection = getConnection();
    const publicKey = new PublicKey(walletAddress);

    // -------------------------
    // 1. Blockchain signatures
    // -------------------------
    const signatures = await connection.getSignaturesForAddress(
      publicKey,
      { limit }
    );

    const historyMap = new Map<string, TransactionHistoryItem>();

    // -------------------------
    // Inspect recent transactions
    // -------------------------
    for (const [index, sigInfo] of signatures.entries()) {
      const signature = sigInfo.signature;

      const item: TransactionHistoryItem = {
        signature,
        blockTime: sigInfo.blockTime
          ? sigInfo.blockTime * 1000
          : null,
        slot: sigInfo.slot,
        status: sigInfo.err ? "failed" : "success",
        type: "UNKNOWN",
      };

      // Fetch full tx only for recent few (expensive)
      if (index < MAX_DETAIL_FETCH) {
        try {
          const tx = await connection.getTransaction(signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (tx && tx.meta) {
            const keys = tx.transaction.message.getAccountKeys();
            const pre = tx.meta.preBalances;
            const post = tx.meta.postBalances;

            // Detect SOL transfer by balance delta

            for (let i = 0; i < pre.length; i++) {
                const preBalance = pre[i];
const postBalance = post[i];

if (preBalance === undefined || postBalance === undefined) {
  continue;
}

const delta = postBalance - preBalance;
              

              if (delta !== 0) {
                const address = keys.get(i)?.toBase58();
                if (!address) continue;

                if (delta < 0) {
                  item.from = address;
                  item.amount = Math.abs(delta) / LAMPORTS_PER_SOL;
                } else {
                  item.to = address;
                }
              }
            }

            if (item.amount && item.from && item.to) {
              item.type = "TRANSFER_SOL";
            }
          }
        } catch {
          logger.warn("Failed to fetch tx details", { signature });
        }
      }

      historyMap.set(signature, item);
    }

    // -------------------------
    // 2. Database transactions
    // -------------------------
    const dbTxs = await prisma.transaction.findMany({
      where: {
        OR: [
          { fromAddress: walletAddress },
          { toAddress: walletAddress },
        ],
        signature: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    for (const tx of dbTxs) {
      if (!tx.signature) continue;

      historyMap.set(tx.signature, {
        signature: tx.signature,
        blockTime: tx.blockTime
          ? tx.blockTime.getTime()
          : null,
        slot: Number(tx.slot ?? 0),
        status:
          tx.status === "CONFIRMED" ? "success" : "failed",
        type: tx.type,
        amount: Number(tx.amount) / LAMPORTS_PER_SOL,
        from: tx.fromAddress,
        to: tx.toAddress,
      });
    }

    // -------------------------
    // Final sorted list
    // -------------------------
    return Array.from(historyMap.values())
      .sort((a, b) => (b.blockTime ?? 0) - (a.blockTime ?? 0))
      .slice(0, limit);
  } catch (error) {
    logger.error("Failed to get transaction history", error);
    throw new Error("Failed to fetch transaction history");
  }
};
