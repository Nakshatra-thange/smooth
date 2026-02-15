import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/contexts/AuthContext";

export function useWalletAuth() {
  const { publicKey, connected, signMessage } = useWallet();
  const { login } = useAuth();

  const hasAuthenticated = useRef(false);

  useEffect(() => {
    // ✅ Check if we've already authenticated in this browser session
    const authCompleted = sessionStorage.getItem('walletAuthCompleted');
    
    console.log("Wallet auth check:", { 
      connected, 
      publicKey: publicKey?.toBase58(),
      authCompleted,
      hasAuthenticated: hasAuthenticated.current 
    });

    // Skip if already authenticated this session
    if (authCompleted === 'true') {
      console.log("✅ Auth already completed this session, skipping");
      return;
    }

    // Skip if wallet not ready
    if (!connected || !publicKey || !signMessage) {
      console.log("⏳ Wallet not ready:", { connected, hasPublicKey: !!publicKey, hasSignMessage: !!signMessage });
      return;
    }

    // Skip if already processing authentication
    if (hasAuthenticated.current) {
      console.log("⏳ Auth already in progress, skipping");
      return;
    }

    // Mark as authenticated to prevent multiple attempts
    hasAuthenticated.current = true;

    const authenticate = async () => {
      try {
        console.log("🔐 Starting wallet authentication for:", publicKey.toBase58());
        
        const message = "Sign in to Smooth AI";
        const encoded = new TextEncoder().encode(message);

        // Request signature from wallet
        console.log("📝 Requesting signature...");
        const signature = await signMessage(encoded);
        
        const sigBase64 = Buffer.from(signature).toString("base64");
        console.log("✅ Signature received");

        // Send to backend
        await login(publicKey.toBase58(), sigBase64, message);
        
        // ✅ Mark as completed for this session
        sessionStorage.setItem('walletAuthCompleted', 'true');
        console.log("🎉 Authentication successful and saved to session");
        
      } catch (err) {
        console.error("❌ Wallet auth failed", err);
        hasAuthenticated.current = false;
        sessionStorage.removeItem('walletAuthCompleted');
        
        // You might want to show an error message to the user here
      }
    };

    authenticate();
  }, [connected, publicKey, signMessage, login]); // No need for isAuthenticated dependency
}