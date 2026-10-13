import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { bus } from './bus'
import { simulateOffline, tick } from './engine'
import { Decimal } from './num'
import { loadLocal, saveLocal } from './save'
import { newGameState } from './state'
import type { GameState } from './types'

export interface OfflineReport {
  seconds: number
  earned: Decimal
  laundered: Decimal
}

interface Store {
  game: GameState
  offline: OfflineReport | null
  tick: (dt: number) => void
  /** Exécute une action du jeu sur un brouillon Immer et renvoie son résultat. */
  act: <R>(fn: (s: GameState) => R) => R
  replace: (s: GameState) => void
  dismissOffline: () => void
}

function initialState(): { game: GameState; offline: OfflineReport | null } {
  const loaded = loadLocal()
  if (!loaded) return { game: newGameState(), offline: null }
  const away = (Date.now() - loaded.lastSaved) / 1000
  if (away < 30) return { game: loaded, offline: null }
  const report = simulateOffline(loaded, away)
  return { game: loaded, offline: report.earned.gt(0) || report.laundered.gt(0) ? report : null }
}

export const useGame = create<Store>()(
  immer((set) => ({
    ...initialState(),
    tick: (dt) => {
      let events: ReturnType<typeof tick> = []
      set((st) => {
        events = tick(st.game, dt)
      })
      for (const e of events) bus.emit('game', e)
    },
    act: (fn) => {
      let result!: ReturnType<typeof fn>
      set((st) => {
        result = fn(st.game)
      })
      return result
    },
    replace: (s) =>
      set((st) => {
        st.game = s
      }),
    dismissOffline: () =>
      set((st) => {
        st.offline = null
      }),
  })),
)

export const act = <R>(fn: (s: GameState) => R): R => useGame.getState().act(fn)
export const save = (): void => saveLocal(useGame.getState().game)
