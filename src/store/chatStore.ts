import { create } from 'zustand'
import { io, type Socket } from 'socket.io-client'
import { api, getToken } from '../lib/api'
import type {
  ChatContactDto,
  ConversationDto,
  MessageDto,
} from '../lib/types'
import { useAuthStore } from './authStore'

type TypingState = { conversationId: string; from: string } | null

type ChatStore = {
  contacts: ChatContactDto[]
  conversations: ConversationDto[]
  activeConversationId: string | null
  messages: MessageDto[]
  typing: TypingState
  connected: boolean
  loading: boolean
  loadContacts: () => Promise<void>
  loadConversations: () => Promise<void>
  getOrCreateConversation: (usuarioId: string) => Promise<ConversationDto | null>
  openConversation: (id: string) => Promise<void>
  closeConversation: () => void
  sendMessage: (texto: string) => Promise<void>
  markRead: (id: string) => Promise<void>
  sendTyping: (to: string) => void
  connectSocket: () => void
  disconnectSocket: () => void
}

let socket: Socket | null = null
let typingTimeout: ReturnType<typeof setTimeout> | null = null

function clearTypingAfter() {
  if (typingTimeout) clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => {
    useChatStore.setState({ typing: null })
  }, 2500)
}

export const useChatStore = create<ChatStore>((set, get) => ({
  contacts: [],
  conversations: [],
  activeConversationId: null,
  messages: [],
  typing: null,
  connected: false,
  loading: false,

  async loadContacts() {
    try {
      const res = await api<{ contacts: ChatContactDto[] }>('/chat/contacts')
      set({ contacts: res.contacts })
    } catch {
      set({ contacts: [] })
    }
  },

  async loadConversations() {
    try {
      const res = await api<{ conversations: ConversationDto[] }>(
        '/chat/conversations',
      )
      set({ conversations: res.conversations })
    } catch {
      set({ conversations: [] })
    }
  },

  async getOrCreateConversation(usuarioId) {
    try {
      const res = await api<{ conversation: ConversationDto }>(
        '/chat/conversations',
        {
          method: 'POST',
          body: JSON.stringify({ usuarioId }),
        },
      )
      const { conversation } = res
      set({
        conversations: [
          conversation,
          ...get().conversations.filter((c) => c.id !== conversation.id),
        ],
      })
      return conversation
    } catch {
      return null
    }
  },

  async openConversation(id) {
    set({ activeConversationId: id, loading: true })
    try {
      const res = await api<{ messages: MessageDto[] }>(
        `/chat/conversations/${id}/messages`,
      )
      set({ messages: res.messages })
      void get().markRead(id)
    } catch {
      set({ messages: [] })
    } finally {
      set({ loading: false })
    }
  },

  closeConversation() {
    set({ activeConversationId: null, messages: [], typing: null })
  },

  async sendMessage(texto) {
    const id = get().activeConversationId
    if (!id) return
    try {
      const res = await api<{ message: MessageDto }>(
        `/chat/conversations/${id}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ texto }),
        },
      )
      const msg = res.message
      set({ messages: [...get().messages, msg], typing: null })
      const conv = get().conversations.find((c) => c.id === id)
      if (conv) {
        const updated: ConversationDto = {
          ...conv,
          lastMessage: msg,
          updatedAt: msg.createdAt,
        }
        set({
          conversations: [
            updated,
            ...get().conversations.filter((c) => c.id !== id),
          ],
        })
      }
    } catch {
      // el envío falló: se muestra al reescribir
    }
  },

  async markRead(id) {
    void api(`/chat/conversations/${id}/read`, {
      method: 'PUT',
    }).catch(() => undefined)
    set({
      conversations: get().conversations.map((c) =>
        c.id === id ? { ...c, unread: 0 } : c,
      ),
    })
  },

  sendTyping(to) {
    const conversationId = get().activeConversationId
    if (!conversationId) return
    socket?.emit('chat:typing', { to, conversationId })
  },

  connectSocket() {
    if (socket || !getToken()) return
    const token = getToken()
    socket = io({
      auth: { token },
      autoConnect: false,
    })

    socket.on('connect', () => set({ connected: true }))
    socket.on('disconnect', () => set({ connected: false }))
    socket.on('connect_error', () => set({ connected: false }))

    socket.on('chat:message', (msg: MessageDto) => {
      const me = useAuthStore.getState().user?.id
      if (msg.autorId === me) {
        void get().loadConversations()
        return
      }
      if (get().activeConversationId === msg.conversacionId) {
        set({ messages: [...get().messages, msg] })
        void get().markRead(msg.conversacionId)
      } else {
        void get().loadConversations()
      }
    })

    socket.on(
      'chat:read',
      ({
        conversationId,
        userId,
        leidoAt,
      }: {
        conversationId: string
        userId: string
        leidoAt: string
      }) => {
        if (get().activeConversationId !== conversationId) return
        set({
          messages: get().messages.map((m) =>
            m.autorId === userId && !m.leidoAt ? { ...m, leidoAt } : m,
          ),
        })
      },
    )

    socket.on(
      'user:presence',
      ({ userId, online }: { userId: string; online: boolean }) => {
        set({
          contacts: get().contacts.map((c) =>
            c.id === userId ? { ...c, online } : c,
          ),
          conversations: get().conversations.map((c) =>
            c.participante?.id === userId
              ? {
                  ...c,
                  participante: { ...c.participante, online },
                }
              : c,
          ),
        })
      },
    )

    socket.on(
      'chat:typing',
      ({ conversationId, from }: { conversationId: string; from: string }) => {
        if (get().activeConversationId !== conversationId) return
        set({ typing: { conversationId, from } })
        clearTypingAfter()
      },
    )

    socket.connect()
  },

  disconnectSocket() {
    socket?.disconnect()
    socket = null
    set({ connected: false, typing: null })
  },
}))