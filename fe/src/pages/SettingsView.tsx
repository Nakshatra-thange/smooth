import { useState, useEffect } from 'react';
import { Copy, Check, Power } from 'lucide-react';

import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SettingsView = () => {
  const { user } = useAuth();

  const { disconnect } = useWallet();
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [copied, setCopied] = useState(false);
  const [memberSince, setMemberSince] = useState<string>('');

  useEffect(() => {
    // You can fetch this from your backend or use localStorage
    const joinedDate = localStorage.getItem('memberSince') || 'Feb 2024';
    setMemberSince(joinedDate);
  }, []);

  const copyAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = async () => {
    try {
      // Clear session auth flag
      sessionStorage.removeItem('walletAuthCompleted');
      
      // Disconnect wallet
      await disconnect();
      
      // Logout from backend
      await logout();
      
      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-app-text-muted">Loading...</p>
      </div>
    );
  }

  // Format wallet address for display
  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="h-full overflow-y-auto flex justify-center py-8 px-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-app-text text-bubbly">Settings</h1>

        {/* Wallet Section */}
        <div className="bg-app-surface border border-app-border rounded-2xl p-5 space-y-4">
          <h3 className="text-xs uppercase tracking-wider text-app-text-muted font-medium">Wallet</h3>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-app-text-muted">Connected Wallet</span>
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Connected
            </span>
          </div>
          
          <div className="bg-app-bg/50 rounded-xl p-3 space-y-2">
            <p className="text-xs text-app-text-muted font-mono break-all">{user.walletAddress}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-app-text-muted">
                {shortenAddress(user.walletAddress)}
              </span>
              <button
                onClick={copyAddress}
                className="flex items-center gap-1.5 px-2 py-1 border border-app-border rounded-lg text-xs text-app-text-muted hover:text-cherry-soda hover:border-cherry-soda/40 transition-all duration-200"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-app-surface border border-app-border rounded-2xl p-5 space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-app-text-muted font-medium">Account</h3>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-app-text-muted">Member since</span>
            <span className="text-sm text-app-text">{memberSince}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-app-text-muted">Network</span>
            <span className="text-xs bg-cherry-soda/10 text-cherry-soda px-2 py-0.5 rounded-full font-medium">
              {import.meta.env.VITE_SOLANA_NETWORK || 'Devnet'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-app-text-muted">User ID</span>
            <span className="text-xs text-app-text-muted font-mono">
              {user.id?.slice(0, 8)}...
            </span>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-app-surface border border-red-500/20 rounded-2xl p-5">
          <h3 className="text-xs uppercase tracking-wider text-app-text-muted font-medium mb-4">Danger Zone</h3>
          
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center justify-center gap-2 border border-red-500/30 text-red-400 py-2.5 rounded-xl text-sm font-medium hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200"
          >
            <Power className="w-4 h-4" />
            Disconnect Wallet
          </button>
          
          <p className="text-[10px] text-app-text-muted text-center mt-3">
            This will disconnect your wallet and sign you out
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;