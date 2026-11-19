'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/components/auth-provider'
import { Toaster } from 'sonner'
import { ButterflyBackground } from '@/components/butterfly-background'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {/* Fundo animado global — aparece em TODAS as views */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <ButterflyBackground density="medium" withPetals />
        </div>
        {/* Conteúdo acima do fundo animado */}
        <div className="relative z-10">
          <AuthProvider>{children}</AuthProvider>
        </div>
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
