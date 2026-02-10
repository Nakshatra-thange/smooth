import { getConnection } from "../../config/solana";
import { prisma } from "../../config/database";
import { logger } from "../../utils/logger";

/**
 * Sleep helper
 */
const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Poll transaction confirmation in background
 */
export const pollTransactionConfirmation = async (
  signature: string,
  transactionId: string
): Promise<void> => {
  const connection = getConnection();

  const MAX_ATTEMPTS = 30;
  let attempts = 0;

  try {
    while (attempts < MAX_ATTEMPTS) {
      try {
        const statusResponse =
          await connection.getSignatureStatus(signature);

        const status = statusResponse.value;

        // -------------------------
        // Confirmed / Finalized
        // -------------------------
        if (status?.confirmationStatus === "finalized") {
          const tx = await connection.getTransaction(signature);

          await prisma.transaction.update({
            where: { id: transactionId },
            data: {
              status: "CONFIRMED",
              confirmedAt: new Date(),
              blockTime: tx?.blockTime
                ? new Date(tx.blockTime * 1000)
                : null,
              slot: tx?.slot ?? null,
            },
          });

          logger.info("Transaction confirmed", { signature });
          return;
        }

        // -------------------------
        // Failed on-chain
        // -------------------------
        if (status?.err) {
          await prisma.transaction.update({
            where: { id: transactionId },
            data: {
              status: "FAILED",
              errorMessage: JSON.stringify(status.err),
            },
          });

          logger.warn("Transaction failed", {
            signature,
            error: status.err,
          });
          return;
        }
      } catch (rpcError) {
        // RPC errors should not kill polling
        logger.warn("Confirmation poll error, retrying", rpcError);
      }

      attempts += 1;
      await sleep(2000);
    }

    // -------------------------
    // Timeout
    // -------------------------
    logger.warn("Transaction confirmation timeout", {
      signature,
      transactionId,
    });
    // Leave status as SUBMITTED
  } catch (error) {
    logger.error("Confirmation polling crashed", error);
  }
};
