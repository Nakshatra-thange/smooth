import { ReactNode, useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl, Cluster } from '@solana/web3.js'

// Import wallet adapter default styles
import '@solana/wallet-adapter-react-ui/styles.css'

import { AuthProvider } from './AuthContext'
import { BalanceProvider } from './BalanceContext'
import { ChatProvider } from './ChatContext'
import { TransactionProvider } from './TransactionContext'

// ─── Solana Network Config ────────────────────────────────────────────────────

const NETWORK = (import.meta.env.VITE_SOLANA_NETWORK ?? 'devnet') as Cluster

// Use custom RPC if provided, otherwise fall back to the public cluster URL
const RPC_ENDPOINT =
  import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(NETWORK)

// ─── AppProviders ─────────────────────────────────────────────────────────────

export default function AppProviders({ children }: { children: ReactNode }) {
  // useMemo so wallet instances aren't recreated on every render
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  )

  return (
    // 1. Solana RPC connection
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      {/* 2. Solana wallet adapter (Phantom, Solflare, etc.) */}
      <WalletProvider wallets={wallets} autoConnect>
        {/* 3. Wallet modal (the "Select Wallet" popup) */}
        <WalletModalProvider>
          {/* 4. JWT auth + user state */}
          <AuthProvider>
            {/* 5. SOL/token balance (depends on auth) */}
            <BalanceProvider>
              {/* 6. Chat conversations + messages */}
              <ChatProvider>
                {/* 7. Transaction approval + polling */}
                <TransactionProvider>
                  {children}
                </TransactionProvider>
              </ChatProvider>
            </BalanceProvider>
          </AuthProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}