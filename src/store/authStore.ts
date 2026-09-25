import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, clearToken, setToken } from '../lib/api'
import type { ApiUser, AuthResponse } from '../lib/types'

type AuthStore = {
  token: string | null
  user: ApiUser | null
  loading: boolean
  register: (data: {
    nombre: string
    apellidos: string
    email: string
    password: string
  }) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  fetchMe: () => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      loading: false,

      async register(data) {
        set({ loading: true })
        try {
          const res = await api<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
          })
          setToken(res.token)
          set({ token: res.token, user: res.user, loading: false })
        } catch (err) {
          set({ loading: false })
          throw err
        }
      },

      async login(email, password) {
        set({ loading: true })
        try {
          const res = await api<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          })
          setToken(res.token)
          set({ token: res.token, user: res.user, loading: false })
        } catch (err) {
          set({ loading: false })
          throw err
        }
      },

      async fetchMe() {
        if (!get().token) return
        try {
          const res = await api<{ user: ApiUser }>('/auth/me')
          set({ user: res.user })
        } catch {
          get().logout()
        }
      },

      logout() {
        clearToken()
        set({ token: null, user: null })
      },
    }),
    {
      name: 'taskflow_auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)