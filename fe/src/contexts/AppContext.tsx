import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Conversation {
  id: string;
  title: string;
  time: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  transaction?: Transaction;
}

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: string;
  fee: string;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed' | 'cancelled';
  type: 'sent' | 'received';
  time: string;
  date: string;
}

interface AppContextType {
  isAuthenticated: boolean;
  user: { 
    id: string;
    walletAddress: string;
  } | null;
  balance: { sol: number; usd: number } | null;
  conversations: Conversation[];
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  messages: Message[];
  transactions: Transaction[];
  disconnect: () => void;
  sendMessage: (msg: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  // Initialize with empty/default values
  const [isAuthenticated] = useState<boolean>(false);
  const [user] = useState<{ id: string; walletAddress: string } | null>(null);
  const [balance] = useState<{ sol: number; usd: number } | null>(null);
  const [conversations] = useState<Conversation[]>([]);
  const [messages] = useState<Message[]>([]);
  const [transactions] = useState<Transaction[]>([]);

  const disconnect = () => {
    setCurrentConversationId(null);
    // TODO: Add actual disconnect logic
    // This should clear all state and redirect to login
  };

  const sendMessage = () => {
    // TODO: Add actual send message logic
    // This should call the API and update messages
  };

  const value: AppContextType = {
    isAuthenticated,
    user,
    balance,
    conversations,
    currentConversationId,
    setCurrentConversationId,
    messages,
    transactions,
    disconnect,
    sendMessage,
    sidebarOpen,
    setSidebarOpen,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};