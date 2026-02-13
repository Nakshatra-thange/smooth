import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { getBalance } from '@/services/walletService'
import { useAuth } from './AuthContext'
import { BALANCE_REFRESH_INTERVAL_MS } from '@/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenBalance {
  mint: string
  symbol: string
  name: string
  amount: number
  decimals: number
  logoURI?: string
}

export interface WalletBalance {
  sol: number
  tokens: TokenBalance[]
}

interface BalanceState {
  balance: WalletBalance | null
  isLoading: boolean
  lastUpdated: Date | null
}

interface BalanceContextValue extends BalanceState {
  refreshBalance: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const BalanceContext = createContext<BalanceContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BalanceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [state, setState] = useState<BalanceState>({
    balance: null,
    isLoading: false,
    lastUpdated: null,
  })

  // ─── fetchBalance ──────────────────────────────────────────────────────────

  async function fetchBalance() {
    setState(s => ({ ...s, isLoading: true }))
    try {
      const balance = await getBalance()
      setState({ balance, isLoading: false, lastUpdated: new Date() })
    } catch (err) {
      console.error('[BalanceContext] Failed to fetch balance:', err)
      setState(s => ({ ...s, isLoading: false }))
    }
  }

  // ─── Auto-fetch + interval ─────────────────────────────────────────────────

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch immediately when user authenticates
      fetchBalance()

      // Then refresh every 30 seconds
      intervalRef.current = setInterval(fetchBalance, BALANCE_REFRESH_INTERVAL_MS)
    } else {
      // Clear balance when user logs out
      setState({ balance: null, isLoading: false, lastUpdated: null })

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    // Cleanup interval on unmount or when isAuthenticated changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isAuthenticated])

  return (
    <BalanceContext.Provider value={{ ...state, refreshBalance: fetchBalance }}>
      {children}
    </BalanceContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBalance(): BalanceContextValue {
  const ctx = useContext(BalanceContext)
  if (!ctx) throw new Error('useBalance must be used inside <BalanceProvider>')
  return ctx
}