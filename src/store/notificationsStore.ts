import { create } from 'zustand'
import { io, type Socket } from 'socket.io-client'
import { api, getToken } from '../lib/api'
import type { NotificacionDto } from '../lib/types'
import { useBoardsStore } from './boardsStore'

type NotificationsStore = {
  notificaciones: NotificacionDto[]
  loading: boolean
  loadNotifications: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  markInviteProcessed: (id: string, estado: string) => void
  remove: (id: string) => Promise<void>
  connectSocket: () => void
  disconnectSocket: () => void
}

let socket: Socket | null = null

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  notificaciones: [],
  loading: false,

  async loadNotifications() {
    if (!getToken()) {
      set({ notificaciones: [], loading: false })
      return
    }
    set({ loading: true })
    try {
      const res = await api<{ notificaciones: NotificacionDto[] }>('/notificaciones')
      set({ notificaciones: res.notificaciones })
    } catch {
      set({ notificaciones: [] })
    } finally {
      set({ loading: false })
    }
  },

  async markAllRead() {
    try {
      await api<void>('/notificaciones/leidas', { method: 'PUT' })
      set({ notificaciones: get().notificaciones.map((n) => ({ ...n, leida: true })) })
    } catch {
      // no cambia el estado local
    }
  },

  async markRead(id) {
    try {
      await api<void>(`/notificaciones/${id}/leer`, { method: 'PUT' })
    } catch {
      // se actualiza igualmente en local
    }
    set({
      notificaciones: get().notificaciones.map((n) =>
        n.id === id ? { ...n, leida: true } : n,
      ),
    })
  },

  async remove(id) {
    try {
      await api<void>(`/notificaciones/${id}`, { method: 'DELETE' })
    } catch {
      // no hay backend: solo se quita de la vista local
    }
    set({ notificaciones: get().notificaciones.filter((n) => n.id !== id) })
  },

  markInviteProcessed(id, estado) {
    set({
      notificaciones: get().notificaciones.map((n) =>
        n.id === id
          ? {
              ...n,
              leida: true,
              invitacion: n.invitacion ? { ...n.invitacion, estado } : n.invitacion,
            }
          : n,
      ),
    })
  },

  connectSocket() {
    if (socket || !getToken()) return
    socket = io({
      auth: { token: getToken() },
      autoConnect: false,
    })

    socket.on('notificacion:nueva', (n: NotificacionDto) => {
      set({ notificaciones: [n, ...get().notificaciones] })
    })

    socket.on('tarea:cambio', () => {
      void useBoardsStore.getState().loadMine()
    })

    socket.on('columna:cambio', () => {
      useBoardsStore.getState().bumpTask()
    })

    socket.on('tablero:cambio', () => {
      void useBoardsStore.getState().loadBoards()
    })

    socket.connect()
  },

  disconnectSocket() {
    socket?.disconnect()
    socket = null
  },
}))

export function unreadCount(ns: { notificaciones: NotificacionDto[] }): number {
  return ns.notificaciones.filter((n) => !n.leida).length
}