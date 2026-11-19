'use client'

import { useQuery } from '@tanstack/react-query'

interface Notificacao {
  id: string
  lida: boolean
}

export function useNotificacoesNaoLidas() {
  const { data } = useQuery<number>({
    queryKey: ['notificacoes-nao-lidas'],
    queryFn: async () => {
      const res = await fetch('/api/notificacoes', { credentials: 'include' })
      const j = await res.json()
      const notifs = (j.notificacoes ?? []) as Notificacao[]
      return notifs.filter((n) => !n.lida).length
    },
    refetchInterval: 30000,
  })
  return data ?? 0
}
