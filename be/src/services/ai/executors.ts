import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { config } from "../../config";
import { Buffer } from "buffer";

const connection = new Connection(config.solana.rpcUrl);

export async function executeGetBalance(walletAddress: string) {
  console.log("🚀 executeGetBalance CALLED with:", walletAddress);
  try{
    const pubkey = new PublicKey(walletAddress);
    console.log("✅ Public key created:", pubkey.toBase58());
    const lamports = await connection.getBalance(pubkey);
    console.log("💰 Lamports from RPC:", lamports);
    
    const sol = lamports / 1e9;
    console.log("💰 SOL balance:", sol);
    return {
      sol,
      tokens: [],
    };
  } catch(error){
    console.error("❌ Error in executeGetBalance:", error);
    throw error;
  }
}

export async function executeCreateTransfer(
  userId: string,
  fromAddress: string,
  toAddress: string,
  amount: number,
  memo?: string
) {
  console.log("🚀 executeCreateTransfer CALLED:", { fromAddress, toAddress, amount, memo });
  
  try {
    const fromPubkey = new PublicKey(fromAddress);
    const toPubkey = new PublicKey(toAddress);
    
    const { blockhash , lastValidBlockHeight} = await connection.getLatestBlockhash();
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      })
    );
    
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = fromPubkey;
    
    const serializedTx = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    
    const base64Tx = serializedTx.toString('base64');
    console.log("✅ UNSIGNED TX BUILT");
    return {
      success: true,
      transactionId: pendingTx.id,
      unsignedTx: base64Tx,
      recipient: toAddress,
      amount,
      fee: 0.000005,
    };
    
  } catch (error) {
    console.error("❌ Error in executeCreateTransfer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Transfer failed",
    };
  }
}

export async function executeGetTransactionHistory() {
  return [];
}

export async function executeEstimateFee() {
  return {
    feeSOL: 0.000005,
    feeLamports: 5000,
  };
}