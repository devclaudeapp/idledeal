import { compressToBase64, compressToUTF16, decompressFromBase64, decompressFromUTF16 } from 'lz-string'
import { Decimal } from './num'
import { newGameState, SAVE_VERSION } from './state'
import type { GameState } from './types'

export const SAVE_KEY = 'idledeal-save'

export function serialize(s: GameState): string {
  // `this[key]` donne la valeur brute avant toJSON() : on peut détecter les Decimal.
  return JSON.stringify(s, function (this: Record<string, unknown>, key, value) {
    const raw = this[key]
    return raw instanceof Decimal ? { $d: raw.toString() } : value
  })
}

export function deserialize(json: string): GameState {
  const parsed = JSON.parse(json, (_key, value) =>
    value && typeof value === 'object' && '$d' in value ? new Decimal(value.$d) : value,
  )
  return mergeDefaults(parsed)
}

type Obj = Record<string, unknown>
const isPlainObject = (v: unknown): v is Obj =>
  !!v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Decimal)

/** Complète une sauvegarde ancienne avec les champs ajoutés depuis. */
function merge(defaults: unknown, loaded: unknown): unknown {
  if (loaded === undefined || loaded === null) return defaults
  if (defaults instanceof Decimal) return loaded instanceof Decimal ? loaded : new Decimal(loaded as string)
  if (isPlainObject(defaults) && isPlainObject(loaded)) {
    const out: Obj = { ...loaded }
    for (const k of Object.keys(defaults)) out[k] = merge(defaults[k], loaded[k])
    return out
  }
  return loaded
}

export function mergeDefaults(loaded: unknown): GameState {
  const s = merge(newGameState(), loaded) as GameState
  s.version = SAVE_VERSION
  return s
}

export function saveLocal(s: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, compressToUTF16(serialize({ ...s, lastSaved: Date.now() })))
  } catch {
    /* stockage indisponible (navigation privée…) */
  }
}

export function loadLocal(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const json = decompressFromUTF16(raw)
    return json ? deserialize(json) : null
  } catch {
    return null
  }
}

export function clearLocal(): void {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    /* ignore */
  }
}

export const exportSave = (s: GameState): string => compressToBase64(serialize(s))

export function importSave(text: string): GameState | null {
  try {
    const json = decompressFromBase64(text.trim())
    return json ? deserialize(json) : null
  } catch {
    return null
  }
}
