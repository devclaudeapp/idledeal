import { create } from 'zustand'

export type Quality = 'low' | 'medium' | 'high'

interface UiState {
  tab: string
  panelOpen: boolean
  /** Élément de la ville ciblé par la caméra (district ou slot). */
  focus: string | null
  /** Incrémenté pour forcer le retour à la vue d'ensemble. */
  homeTick: number
  selectedDistrict: string | null
  quality: Quality
  enable3d: boolean
  setTab: (tab: string) => void
  setPanelOpen: (open: boolean) => void
  setFocus: (focus: string | null) => void
  goHome: () => void
  selectDistrict: (id: string | null) => void
  setQuality: (q: Quality) => void
  setEnable3d: (on: boolean) => void
}

const PREFS_KEY = 'idledeal-ui'

function loadPrefs(): Partial<Pick<UiState, 'quality' | 'enable3d'>> {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function savePrefs(s: Pick<UiState, 'quality' | 'enable3d'>) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ quality: s.quality, enable3d: s.enable3d }))
  } catch {
    /* ignore */
  }
}

const prefs = loadPrefs()

/** État d'interface (non sauvegardé dans la partie). */
export const useUi = create<UiState>((set, get) => ({
  tab: 'terrain',
  panelOpen: true,
  focus: null,
  homeTick: 0,
  selectedDistrict: null,
  quality: prefs.quality ?? 'medium',
  enable3d: prefs.enable3d ?? true,
  setTab: (tab) => set({ tab, panelOpen: true }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setFocus: (focus) => set({ focus }),
  goHome: () => set((s) => ({ focus: null, homeTick: s.homeTick + 1 })),
  selectDistrict: (selectedDistrict) => set({ selectedDistrict }),
  setQuality: (quality) => {
    set({ quality })
    savePrefs(get())
  },
  setEnable3d: (enable3d) => {
    set({ enable3d })
    savePrefs(get())
  },
}))
