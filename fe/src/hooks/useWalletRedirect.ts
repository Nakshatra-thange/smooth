import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'

/**
 * Drop this inside any component that lives inside BrowserRouter.
 * It watches the wallet connection state and redirects to /app
 * as soon as the user successfully connects their wallet.
 */
export function useWalletRedirect() {
  const { connected } = useWallet()
  const navigate = useNavigate()

  useEffect(() => {
    if (connected) {
      navigate('/app', { replace: true })
    }
  }, [connected])
}