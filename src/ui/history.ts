import { create } from 'zustand'

export interface Sample {
  t: number
  income: number
  heat: number
  cash: number
}

interface HistoryStore {
  samples: Sample[]
  push: (s: Sample) => void
}

/** Historique de session (non sauvegardé) pour les graphiques. */
export const useHistory = create<HistoryStore>((set) => ({
  samples: [],
  push: (s) => set((st) => ({ samples: [...st.samples.slice(-179), s] })),
}))
