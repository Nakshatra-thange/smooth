import { Transaction } from "@solana/web3.js";
import { getConnection } from "../../config/solana";
import { logger } from "../../utils/logger";

/**
 * Submit a signed transaction to Solana
 */
export const submitSignedTransaction = async (
  signedTransactionBase64: string
): Promise<string> => {
  try {
    const connection = getConnection();

    // -------------------------
    // Deserialize transaction
    // -------------------------
    const txBuffer = Buffer.from(signedTransactionBase64, "base64");
    const transaction = Transaction.from(txBuffer);

    // -------------------------
    // Verify signatures
    // -------------------------
    const isValid = transaction.verifySignatures();
    if (!isValid) {
      throw new Error("Invalid transaction signature");
    }

    // -------------------------
    // Submit transaction
    // -------------------------
    const signature = await connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      }
    );

    return signature;
  } catch (error: any) {
    logger.error("Transaction submission failed", error);

    // Surface useful error messages
    if (error?.message?.includes("insufficient funds")) {
      throw new Error("Insufficient funds to complete transaction");
    }

    if (error?.message?.includes("Blockhash not found")) {
      throw new Error("Transaction expired. Please retry.");
    }

    throw new Error("Failed to submit transaction");
  }
};
