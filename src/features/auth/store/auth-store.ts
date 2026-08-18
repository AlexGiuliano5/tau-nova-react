import { create } from 'zustand'

import { isTokenExpired, parseUserTokenInfo, type UserTokenInfo } from '@/features/auth/lib/jwt'

const AUTH_STORAGE_KEY = 'tau_nova_token'

interface AuthState {
  token: string | null
  user: UserTokenInfo | null
  setSession: (token: string) => void
  logout: () => void
  hydrateFromStorage: () => void
  isAuthenticated: () => boolean
}

function readStoredToken(): string | null {
  try {
    const token = sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (!token || isTokenExpired(token)) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
    return token
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,

  setSession: (token) => {
    try {
      sessionStorage.setItem(AUTH_STORAGE_KEY, token)
    } catch {
      // ignore quota / private mode
    }
    set({ token, user: parseUserTokenInfo(token) })
  },

  logout: () => {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
    } catch {
      // ignore
    }
    set({ token: null, user: null })
  },

  hydrateFromStorage: () => {
    const token = readStoredToken()
    if (!token) {
      set({ token: null, user: null })
      return
    }
    set({ token, user: parseUserTokenInfo(token) })
  },

  isAuthenticated: () => {
    const { token } = get()
    return Boolean(token && !isTokenExpired(token))
  },
}))
