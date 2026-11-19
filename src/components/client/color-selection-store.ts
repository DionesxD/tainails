'use client'

import { create } from 'zustand'

interface CorSalva {
  corId: string
  nome: string
  hex: string
}

interface CorSelectionState {
  cor: CorSalva | null
  setCor: (cor: CorSalva | null) => void
}

export const useColorSelectionStore = create<CorSelectionState>((set) => ({
  cor: null,
  setCor: (cor) => set({ cor }),
}))
