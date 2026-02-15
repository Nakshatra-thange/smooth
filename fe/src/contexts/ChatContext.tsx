import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { toast } from 'sonner'
import { sendMessage as apiSendMessage, getConversations, getConversation, deleteConversation as apiDeleteConversation } from '@/services/chatService'
import { useAuth } from './AuthContext'
import { MSG_ROLE } from '@/constants'
import { useNavigate } from "react-router-dom"
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, Transaction } from "@solana/web3.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MessageMetadata {
  transactionId?: string
  requiresApproval?: boolean
  toolCalls?: unknown[]
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  metadata?: MessageMetadata
  createdAt: string
  
}

export interface Conversation {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
  isActive: boolean
  messageCount?: number
}

interface ChatState {
  conversations: Conversation[]
  currentConversationId: string | null
  messages: Message[]
  isSending: boolean
  isLoadingMessages: boolean
  error: string | null
}

interface ChatContextValue extends ChatState {
  sendMessage: (text: string) => Promise<void>
  loadConversation: (id: string) => Promise<void>
  createNewConversation: () => void
  deleteConversation: (id: string) => Promise<void>
  loadConversations: () => Promise<void>
  setCurrentConversationId: (id: string | null) => void; 
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const  ChatContext = createContext<ChatContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ChatProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const { publicKey, sendTransaction } = useWallet();

const connection = new Connection(
  import.meta.env.VITE_SOLANA_RPC_URL
);

  const navigate = useNavigate()

  const [state, setState] = useState<ChatState>({
    conversations: [],
    currentConversationId: null,
    
    messages: [],
    isSending: false,
    isLoadingMessages: false,
    error: null,
  })

  // Load conversations list when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations()
    } else {
      // Reset everything on logout
      setState({
        conversations: [],
        currentConversationId: null,
        messages: [],
        isSending: false,
        isLoadingMessages: false,
        error: null,
      })
    }
  }, [isAuthenticated])

  // ─── loadConversations ─────────────────────────────────────────────────────

  async function loadConversations() {
    try {
      const conversations = await getConversations()
      setState(s => ({ ...s, conversations }))
    } catch (err) {
      console.error('[ChatContext] Failed to load conversations:', err)
    }
  }

  // ─── loadConversation ──────────────────────────────────────────────────────

  async function loadConversation(id: string) {
    // Already loaded — nothing to do
    if (state.currentConversationId === id && state.messages.length > 0) return

    setState(s => ({ ...s, isLoadingMessages: true, messages: [], currentConversationId: id }))

    try {
      const conversation = await getConversation(id)
      setState(s => ({
        ...s,
        messages: conversation.messages ?? [],
        isLoadingMessages: false,
      }))
    } catch (err) {
      console.error('[ChatContext] Failed to load conversation:', err)
      setState(s => ({ ...s, isLoadingMessages: false }))
    }
  }

  // ─── createNewConversation ─────────────────────────────────────────────────

  function createNewConversation() {
    setState(s => ({ ...s, currentConversationId: null, messages: [], error: null }))
  }
  // Add this function inside your ChatProvider component
function setCurrentConversationId(id: string | null) {
  setState(s => ({ ...s, currentConversationId: id }));
}

  // ─── sendMessage ───────────────────────────────────────────────────────────

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    // Build an optimistic user message shown immediately
    const tempId = `temp-${Date.now()}`
    const tempMessage: Message = {
      id: tempId,
      conversationId: state.currentConversationId ?? '',
      role: MSG_ROLE.USER as 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    }

    setState(s => ({
      ...s,
      messages: [...s.messages, tempMessage],
      isSending: true,
      error: null,
    }))

    try {
      const response = await apiSendMessage(trimmed, state.currentConversationId ?? undefined)
      // 🚀 AUTO SIGN TRANSACTION IF AI CREATED ONE
if (response.requiresApproval && response.unsignedTx && publicKey) {
  try {
    console.log("🔥 Signing transaction from AI...");

    const txBuffer = Buffer.from(response.unsignedTx, "base64");
    const transaction = Transaction.from(txBuffer);

    const signature = await sendTransaction(transaction, connection);

    console.log("✅ Transaction sent:", signature);

    // notify history view to refresh
    window.dispatchEvent(new Event("tx-created"));
  } catch (err) {
    console.error("❌ Wallet signing failed:", err);
  }
}

      if (response.requiresApproval) {
        window.dispatchEvent(new Event("tx-created"));
      }
      
      console.log("AI RESPONSE:", response);


      // Build the real user message (replaces the temp one)
      const realUserMessage: Message = {
        ...tempMessage,
        id: `user-${Date.now()}`,
        conversationId: response.conversationId,
      }

      // Build the AI message from the response
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        conversationId: response.conversationId,
        role: MSG_ROLE.ASSISTANT as 'assistant',
        content: response.message,
        createdAt: new Date().toISOString(),
        ...(response.transactionId && {
          metadata: {
            transactionId: response.transactionId,
            requiresApproval: response.requiresApproval ?? false,
          },
        }),
      }

      setState(s => {
        // Replace temp message with real user message, then append AI message
        const withoutTemp = s.messages.filter(m => m.id !== tempId)

        // Update or add conversation in the sidebar list
        const existingIndex = s.conversations.findIndex(c => c.id === response.conversationId)
        let updatedConversations: Conversation[]

        if (existingIndex >= 0) {
          // Update updatedAt on the existing conversation
          updatedConversations = s.conversations.map(c =>
            c.id === response.conversationId
              ? { ...c, updatedAt: new Date().toISOString() }
              : c
          )
        } else {
          // Brand new conversation — add to top of list
          const newConversation: Conversation = {
            id: response.conversationId,
            title: trimmed.slice(0, 50),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
            messageCount: 1,
          }
          updatedConversations = [newConversation, ...s.conversations]
        }

        return {
          ...s,
          messages: [...withoutTemp, realUserMessage, aiMessage],
          currentConversationId: response.conversationId,
          conversations: updatedConversations,
          isSending: false,
        }
      })

      // ✅ ADD NAVIGATE HERE - Right after state update
      navigate(`/app/c/${response.conversationId}`)

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(errorMsg)
      // Remove the optimistic message on failure
      setState(s => ({
        ...s,
        messages: s.messages.filter(m => m.id !== tempId),
        isSending: false,
        error: errorMsg,
      }))
    }
  }

  // ─── deleteConversation ────────────────────────────────────────────────────

  async function deleteConversation(id: string) {
    try {
      await apiDeleteConversation(id)
      setState(s => {
        const updatedConversations = s.conversations.filter(c => c.id !== id)
        const isCurrentDeleted = s.currentConversationId === id

        return {
          ...s,
          conversations: updatedConversations,
          // If user deleted the active conversation, reset to new chat
          ...(isCurrentDeleted && {
            currentConversationId: null,
            messages: [],
          }),
        }
      })
    } catch (err) {
      console.error('[ChatContext] Failed to delete conversation:', err)
      toast.error('Failed to delete conversation')
    }
  }

  return (
    <ChatContext.Provider
      value={{
        ...state,
        sendMessage,
        loadConversation,
        createNewConversation,
        deleteConversation,
        loadConversations,
        setCurrentConversationId,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used inside <ChatProvider>')
  return ctx
}