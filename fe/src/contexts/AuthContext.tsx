import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { verifyWallet, getUserProfile, getStoredToken, setStoredToken, clearStoredToken, isTokenExpired } from '@/services/authService'

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string
  walletAddress: string
  createdAt?: string
  lastSeenAt?: string
  preferences?: Record<string, unknown>
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (walletAddress: string, signature: string, message: string) => Promise<User>
  logout: () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // On mount: check if a valid token already exists in localStorage
  useEffect(() => {
    async function checkStoredAuth() {
      const token = getStoredToken()

      if (!token) {
        setState(s => ({ ...s, isLoading: false }))
        return
      }

      if (isTokenExpired(token)) {
        clearStoredToken()
        setState(s => ({ ...s, isLoading: false }))
        return
      }

      // Token looks valid — verify by fetching user profile
      try {
        const user = await getUserProfile()
        setState({ user, isAuthenticated: true, isLoading: false })
      } catch {
        // Token was valid format but backend rejected it (revoked, etc.)
        clearStoredToken()
        setState({ user: null, isAuthenticated: false, isLoading: false })
      }
    }

    checkStoredAuth()
  }, [])

  // ─── login ────────────────────────────────────────────────────────────────

  async function login(walletAddress: string, signature: string, message: string): Promise<User> {
    const { token, user } = await verifyWallet(walletAddress, signature, message)
    setStoredToken(token)
    setState({ user, isAuthenticated: true, isLoading: false })
    return user
  }

  // ─── logout ───────────────────────────────────────────────────────────────

  function logout() {
    clearStoredToken()
    setState({ user: null, isAuthenticated: false, isLoading: false })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}