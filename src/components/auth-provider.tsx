'use client'

import { create } from 'zustand'
import { useEffect } from 'react'

export interface AuthUser {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  tipo: 'cliente' | 'manicure'
  fotoUrl: string | null
  eClienteConfianca: boolean
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    set({ user: null })
  },
}))

// Timeout por tentativa: se o proxy engolir o pedido (cold-start),
// aborta e tenta de novo em vez de deixar o splash girando para sempre.
const AUTH_TIMEOUT_MS = 6000
const AUTH_MAX_TENTATIVAS = 3

async function checkAuthOnce(signal: AbortSignal) {
  const r = await fetch('/api/auth/me', { signal, cache: 'no-store' })
  const data = await r.json()
  return data.user || null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser)
  const setLoading = useAuthStore((s) => s.setLoading)

  useEffect(() => {
    let mounted = true

    async function checkAuth() {
      for (let tentativa = 1; tentativa <= AUTH_MAX_TENTATIVAS; tentativa++) {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS)
        try {
          const user = await checkAuthOnce(controller.signal)
          clearTimeout(timer)
          if (mounted) setUser(user)
          return
        } catch {
          clearTimeout(timer)
          if (!mounted) return
          // Última tentativa falhou: segue como visitante (tela de login)
          if (tentativa === AUTH_MAX_TENTATIVAS) {
            setUser(null)
            return
          }
          // Pequena pausa antes de tentar de novo (dá tempo do proxy aquecer)
          await new Promise((r) => setTimeout(r, 500))
        }
      }
    }

    checkAuth().finally(() => {
      if (mounted) setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [setUser, setLoading])

  return <>{children}</>
}
