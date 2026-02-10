import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getConnection } from "../../config/solana";
import { logger } from "../../utils/logger";

/**
 * Types
 */
export type TokenBalance = {
  mint: string;
  symbol: string;
  name: string;
  amount: number;
  decimals: number;
};

export type WalletBalance = {
  sol: number;
  tokens: TokenBalance[];
};

/**
 * Constants
 */
const LAMPORTS_PER_SOL = 1_000_000_000;
const CACHE_TTL_MS = 30_000;

/**
 * Simple in-memory cache
 * key: walletAddress
 */
const balanceCache = new Map<
  string,
  { data: WalletBalance; timestamp: number }
>();

/**
 * Get wallet balance (SOL + SPL tokens)
 */
export const getWalletBalance = async (
  walletAddress: string
): Promise<WalletBalance> => {
  try {
    // -------------------------
    // Cache check
    // -------------------------
    const cached = balanceCache.get(walletAddress);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const connection = getConnection();

    // -------------------------
    // Validate address
    // -------------------------
    let publicKey: PublicKey;
    try {
      publicKey = new PublicKey(walletAddress);
    } catch {
      throw new Error("Invalid wallet address");
    }

    // -------------------------
    // SOL balance
    // -------------------------
    const lamports = await connection.getBalance(publicKey);
    const sol = lamports / LAMPORTS_PER_SOL;

    // -------------------------
    // Token balances
    // -------------------------
    const tokenAccounts =
      await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

    const tokens: TokenBalance[] = [];

    for (const account of tokenAccounts.value) {
      try {
        const parsedInfo = account.account.data.parsed.info;
        const tokenAmount = parsedInfo.tokenAmount;

        const amount = tokenAmount.uiAmount;
        if (!amount || amount === 0) continue;

        const mint = parsedInfo.mint;
        const decimals = tokenAmount.decimals;

        // Metadata is optional and unreliable on-chain
        // We fallback safely
        tokens.push({
          mint,
          symbol: mint.slice(0, 4), // fallback symbol
          name: mint,
          amount,
          decimals,
        });
      } catch (err) {
        logger.warn("Failed to parse token account", err);
      }
    }

    const result: WalletBalance = {
      sol,
      tokens,
    };

    // -------------------------
    // Cache result
    // -------------------------
    balanceCache.set(walletAddress, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  } catch (error) {
    logger.error("Failed to get wallet balance", error);
    throw error;
  }
};

/**
 * Invalidate cache (call after tx confirmation)
 */
export const invalidateBalanceCache = (walletAddress: string) => {
  balanceCache.delete(walletAddress);
};
