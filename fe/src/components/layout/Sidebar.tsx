import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Clock, Settings, Power } from 'lucide-react';
import { useWallet} from '@solana/wallet-adapter-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';

const Sidebar = ({ onClose }: { onClose: () => void }) => {
  const { conversations} = useChat(); 
  const { setCurrentConversationId } = useChat();// Add setCurrentConversationId
  const location = useLocation();
  const navigate = useNavigate();
  const { disconnect } = useWallet();
  const { logout } = useAuth();

  async function handleDisconnect() {
    await disconnect();
    logout();
    onClose();
  }

  // Handle new chat
  const handleNewChat = () => {
    // Clear the current conversation ID in your app context
    setCurrentConversationId(null); // This tells the app we're starting fresh
    
    // Close sidebar on mobile
    onClose();
    window.location.href = '/app';
    
    // Navigate to base chat route
    //navigate('/app', { replace: true }); // Use replace to avoid back button issues
  };

  return (
    <div className="w-[260px] h-full bg-app-bg border-r border-app-border flex flex-col">
      {/* Top */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <img
            src="/logo.png"
            alt="Smooth Logo"
            className="h-14 w-auto object-contain select-none"
          />
        </div>
        
        {/* New Chat button */}
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-2xl border border-app-border text-app-text hover:border-cherry-soda/40 hover:glow-pink transition-all duration-200 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-3">
        <p className="px-3 py-2 text-[10px] uppercase tracking-wider text-app-text-muted font-medium">
          Conversations
        </p>
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="w-8 h-8 text-app-text-muted mb-2" />
            <p className="text-sm text-app-text-muted">No conversations yet</p>
            <p className="text-xs text-app-text-muted mt-1">Start chatting!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((c) => (
              <Link
                
                to={`/app/c/${c.id}`}
                onClick={() => {
                  setCurrentConversationId(c.id); // Set the conversation ID when clicking existing chat
                  onClose();
                  
                }}
                className={`flex flex-col w-full px-3 py-2.5 rounded-2xl text-left transition-all duration-200 hover:bg-app-surface-hover ${
                  location.pathname.includes(c.id)
                    ? 'bg-app-surface-hover border border-cherry-soda/20'
                    : ''
                }`}
              >
                <span className="text-sm text-app-text truncate">{c.title}</span>
                <span className="text-[10px] text-app-text-muted mt-0.5">{c.updatedAt}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="border-t border-app-border p-3 space-y-1">
        <Link
          to="/app/history"
          onClick={onClose}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-2xl text-app-text-muted hover:text-cherry-soda hover:bg-app-surface-hover transition-all duration-200 text-sm"
        >
          <Clock className="w-4 h-4" />
          History
        </Link>
        <Link
          to="/app/settings"
          onClick={onClose}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-2xl text-app-text-muted hover:text-cherry-soda hover:bg-app-surface-hover transition-all duration-200 text-sm"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        
        {/* Disconnect button */}
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-2xl text-app-text-muted hover:text-red-400 hover:bg-app-surface-hover transition-all duration-200 text-sm"
        >
          <Power className="w-4 h-4" />
          Disconnect
        </button>
      </div>
    </div>
  );
};

export default Sidebar;