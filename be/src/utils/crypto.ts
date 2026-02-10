import nacl from "tweetnacl";
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";

/**
 * Verify Solana wallet signature
 */
export const verifySignature = (
  message: string,
  signature: string,
  publicKey: string
): boolean => {
  try {
    const messageBytes = new TextEncoder().encode(message);

    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = new PublicKey(publicKey).toBytes();

    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );
  } catch {
    return false;
  }
};

/**
 * Generate standardized authentication message
 */
export const generateAuthMessage = (
  walletAddress: string,
  nonce: string
): string => {
  const timestamp = new Date().toISOString();

  return `
Welcome to Nexis!

Sign this message to authenticate.

Wallet: ${walletAddress}
Nonce: ${nonce}
Time: ${timestamp}

This won't cost gas or make transactions.
`.trim();
};
