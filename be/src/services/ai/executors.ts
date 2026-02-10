import {
    Connection,
    PublicKey,
    SystemProgram,
    Transaction,
  } from "@solana/web3.js";
  import { getConnection } from "../../config/solana";
  import { prisma } from "../../config/database";
  import { logger } from "../../utils/logger";
  import bs58 from "bs58";


  /**
   * Helper constants
   */
  const LAMPORTS_PER_SOL = 1_000_000_000;
  const TX_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
  const dbTxs = await prisma.transaction.findMany();
  /**
   * =========================
   * Executor 1: Get Balance
   * =========================
   */
  export const executeGetBalance = async (
    userId: string,
    walletAddress: string
  ) => {
    try {
      const connection = getConnection();
      const publicKey = new PublicKey(walletAddress);
  
      // SOL balance
      const lamports = await connection.getBalance(publicKey);
      const sol = lamports / LAMPORTS_PER_SOL;
  
      // Token balances
      const tokenAccounts =
        await connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: new PublicKey(
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          ),
        });
  
      const tokens = tokenAccounts.value
        .map((account) => {
          const info = account.account.data.parsed.info;
          const amount = info.tokenAmount.uiAmount;
  
          if (!amount || amount === 0) return null;
  
          return {
            mint: info.mint,
            symbol: info.tokenAmount?.uiAmountString
              ? info.mint.slice(0, 4)
              : undefined, // placeholder symbol
            amount,
          };
        })
        .filter(Boolean);
  
      return {
        sol,
        tokens,
      };
    } catch (error) {
      logger.error("Failed to get balance", error, { userId });
      return {
        error: "Failed to fetch wallet balance. Please try again.",
      };
    }
  };
  
  /**
   * =========================
   * Executor 2: Create Transfer
   * =========================
   */
  export const executeCreateTransfer = async (
    userId: string,
    walletAddress: string,
    recipient: string,
    amount: number,
    memo?: string
  ) => {
    try {
      const connection = getConnection();
  
      // Validate recipient
      let recipientKey: PublicKey;
      try {
        recipientKey = new PublicKey(recipient);
        if (!PublicKey.isOnCurve(recipientKey.toBytes())) {
          return { error: "Invalid recipient address" };
        }
      } catch {
        return { error: "Invalid recipient address" };
      }
  
      if (amount <= 0) {
        return { error: "Transfer amount must be positive" };
      }
  
      const senderKey = new PublicKey(walletAddress);
  
      // Check balance
      const balanceLamports = await connection.getBalance(senderKey);
      const transferLamports = Math.floor(amount * LAMPORTS_PER_SOL);
  
      if (balanceLamports < transferLamports) {
        return {
          error: "Insufficient balance",
          balance: balanceLamports / LAMPORTS_PER_SOL,
        };
      }
  
      // Build transaction
      const { blockhash } = await connection.getLatestBlockhash();
  
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: senderKey,
      });
  
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: senderKey,
          toPubkey: recipientKey,
          lamports: transferLamports,
        })
      );
  
      // Optional memo
      if (memo) {
        transaction.add({
          keys: [],
          programId: new PublicKey(
            "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
          ),
          data: Buffer.from(memo, "utf-8"),
        });
      }
  
      // Estimate fee
      const feeLamports = await transaction.getEstimatedFee(connection);
  
      // Serialize unsigned transaction
      const unsignedTxBase64 = transaction
        .serialize({ requireAllSignatures: false })
        .toString("base64");
  
      // Save to DB
      const tx = await prisma.transaction.create({
        data: {
          userId,
          status: "PENDING",
          type: "TRANSFER_SOL",
          fromAddress: walletAddress,
          toAddress: recipient,
          amount: BigInt(transferLamports),
          fee: feeLamports ? BigInt(feeLamports) : null,
          unsignedTx: unsignedTxBase64,
          expiresAt: new Date(Date.now() + TX_EXPIRY_MS),
          memo,
        },
      });
  
      return {
        success: true,
        transactionId: tx.id,
        recipient,
        amount,
        fee: feeLamports ? feeLamports / LAMPORTS_PER_SOL : null,
        total:
          feeLamports !== null
            ? amount + feeLamports / LAMPORTS_PER_SOL
            : amount,
        expiresIn: TX_EXPIRY_MS / 1000,
      };
    } catch (error) {
      logger.error("Failed to create transfer", error, { userId });
      return {
        error: "Failed to create transfer. Please try again.",
      };
    }
  };
  
  /**
   * =========================
   * Executor 3: Transaction History
   * =========================
   */
  export const executeGetTransactionHistory = async (
    userId: string,
    walletAddress: string,
    limit = 10
  ) => {
    try {
      const cappedLimit = Math.min(limit, 50);
      const publicKey = new PublicKey(walletAddress);
      const connection = getConnection();
  
      // DB transactions
      const dbTxs = await prisma.transaction.findMany({
        where: {
          userId,
          status: "CONFIRMED",
        },
        orderBy: {
          confirmedAt: "desc",
        },
        take: cappedLimit,
      });
  
      // Blockchain transactions
      const chainSigs = await connection.getSignaturesForAddress(publicKey, {
        limit: cappedLimit,
      });
  
      const chainTxs = chainSigs.map((sig) => ({
        signature: sig.signature,
        timestamp: sig.blockTime
          ? new Date(sig.blockTime * 1000).toISOString()
          : null,
        status: "CONFIRMED",
      }));
  
      // Merge & dedupe
      const merged = new Map<string, any>();
      
      for (const tx of dbTxs) {
        if (tx.signature) {
          merged.set(tx.signature, {
            signature: tx.signature,
            type: tx.type,
            amount: Number(tx.amount) / LAMPORTS_PER_SOL,
            from: tx.fromAddress,
            to: tx.toAddress,
            fee: tx.fee ? Number(tx.fee) / LAMPORTS_PER_SOL : null,
            timestamp: tx.confirmedAt?.toISOString(),
            status: tx.status,
          });
        }
      }
      
      
  
      chainTxs.forEach((tx) => {
        if (!merged.has(tx.signature)) {
          merged.set(tx.signature, tx);
        }
      });
  
      return Array.from(merged.values()).sort(
        (a, b) =>
          new Date(b.timestamp ?? 0).getTime() -
          new Date(a.timestamp ?? 0).getTime()
      );
    } catch (error) {
      logger.error("Failed to get transaction history", error, { userId });
      return {
        error: "Failed to fetch transaction history",
      };
    }
  };
  
  /**
   * =========================
   * Executor 4: Estimate Fee
   * =========================
   */
  export const executeEstimateFee = async () => {
    try {
      const connection = getConnection();
  
      // Dummy keys
      const dummyFrom = new PublicKey(bs58.encode(Buffer.alloc(32, 1)));
      const dummyTo = new PublicKey(bs58.encode(Buffer.alloc(32, 2)));
  
      const { blockhash } = await connection.getLatestBlockhash();
  
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: dummyFrom,
      });
  
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: dummyFrom,
          toPubkey: dummyTo,
          lamports: 1,
        })
      );
  
      const feeLamports = await transaction.getEstimatedFee(connection);
  
      return {
        feeSOL: feeLamports ? feeLamports / LAMPORTS_PER_SOL : null,
        feeLamports,
      };
    } catch (error) {
      logger.error("Failed to estimate fee", error);
      return {
        error: "Failed to estimate network fee",
      };
    }
  };
  