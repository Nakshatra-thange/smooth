import {
    PublicKey,
    SystemProgram,
    Transaction,
  } from "@solana/web3.js";
  import { getConnection } from "../../config/solana";
  import { logger } from "../../utils/logger";
  
  /**
   * Constants
   */
  const LAMPORTS_PER_SOL = 1_000_000_000;
  const MEMO_PROGRAM_ID = new PublicKey(
    "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
  );
  
  /**
   * Custom error for validation issues
   */
  export class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ValidationError";
    }
  }
  
  /**
   * Build an unsigned SOL transfer transaction
   */
  export const buildTransferTransaction = async (
    from: string,
    to: string,
    amountSOL: number,
    memo?: string
  ): Promise<{
    unsignedTransaction: string;
    estimatedFee: number;
    blockhash: string;
    lastValidBlockHeight: number;
  }> => {
    try {
      const connection = getConnection();
  
      // -------------------------
      // Validate inputs
      // -------------------------
      let fromPubkey: PublicKey;
      let toPubkey: PublicKey;
  
      try {
        fromPubkey = new PublicKey(from);
        toPubkey = new PublicKey(to);
      } catch {
        throw new ValidationError("Invalid wallet address format");
      }
  
      if (!PublicKey.isOnCurve(fromPubkey.toBytes())) {
        throw new ValidationError("Sender address is not a valid curve address");
      }
  
      if (!PublicKey.isOnCurve(toPubkey.toBytes())) {
        throw new ValidationError("Recipient address is not a valid curve address");
      }
  
      if (typeof amountSOL !== "number" || amountSOL <= 0) {
        throw new ValidationError("Transfer amount must be a positive number");
      }
  
      // -------------------------
      // Convert amount to lamports
      // -------------------------
      const lamports = Math.floor(amountSOL * LAMPORTS_PER_SOL);
  
      if (lamports <= 0) {
        throw new ValidationError("Transfer amount too small");
      }
  
      // -------------------------
      // Get recent blockhash
      // -------------------------
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
  
      // -------------------------
      // Create transaction
      // -------------------------
      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;
  
      // -------------------------
      // Add transfer instruction
      // -------------------------
      transaction.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        })
      );
  
      // -------------------------
      // Add memo instruction (optional)
      // -------------------------
      if (memo && memo.trim().length > 0) {
        transaction.add({
          keys: [],
          programId: MEMO_PROGRAM_ID,
          data: Buffer.from(memo, "utf-8"),
        });
      }
  
      // -------------------------
      // Estimate fee
      // -------------------------
      const feeLamports = await transaction.getEstimatedFee(connection);
      const estimatedFee =
        feeLamports !== null ? feeLamports / LAMPORTS_PER_SOL : 0;
  
      // -------------------------
      // Serialize unsigned transaction
      // -------------------------
      const unsignedTransaction = transaction
        .serialize({ requireAllSignatures: false })
        .toString("base64");
  
      return {
        unsignedTransaction,
        estimatedFee,
        blockhash,
        lastValidBlockHeight,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
  
      logger.error("Failed to build transfer transaction", error);
      throw new Error("Failed to build transfer transaction");
    }
  };
  