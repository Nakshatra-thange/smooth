import {
    Connection,
    PublicKey,
    Transaction,
  } from "@solana/web3.js";
  import type { SendOptions } from "@solana/web3.js";
  
  const RPC_URL = process.env.SOLANA_RPC_URL;
  if (!RPC_URL) {
    throw new Error("SOLANA_RPC_URL is not defined");
  }
  
  const commitment = "confirmed";
  
  let connection: Connection | null = null;
  
  /**
   * Singleton Solana connection
   */
  export const getConnection = (): Connection => {
    if (!connection) {
      connection = new Connection(RPC_URL, {
        commitment,
        confirmTransactionInitialTimeout: 30_000,
      });
    }
    return connection;
  };
  
  /**
   * Get SOL balance (lamports)
   */
  export const getBalance = async (publicKey: PublicKey): Promise<number> => {
    const conn = getConnection();
    return conn.getBalance(publicKey, commitment);
  };
  
  /**
   * Send signed transaction to Solana
   */
  export const sendTransaction = async (
    transaction: Transaction,
    options?: SendOptions
  ): Promise<string> => {
    const conn = getConnection();
    return conn.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: commitment,
      ...options,
    });
  };
  