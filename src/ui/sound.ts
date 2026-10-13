import { zzfx, ZZFX } from 'zzfx'

// Sons procéduraux ZzFX (aucun fichier audio). Paramètres générés avec https://killedbyapixel.github.io/ZzFX/
const SOUNDS = {
  click: [0.4, 0.05, 900, 0, 0.01, 0.02, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5],
  coin: [0.6, 0, 1675, 0, 0.02, 0.18, 1, 0.6, 0, 0, 466, 0.04],
  buy: [0.5, 0, 520, 0.01, 0.04, 0.12, 1, 1.4, 0, 0, 220, 0.03],
  error: [0.4, 0, 150, 0, 0.05, 0.15, 3, 1.5, 0, 0, 0, 0, 0, 0.5],
  siren: [0.6, 0, 600, 0.05, 0.6, 0.4, 0, 1, 0, 0, 300, 0.15, 0.1, 0, 0, 0, 0.1],
  success: [0.7, 0, 400, 0.02, 0.25, 0.4, 1, 1.5, 0, 0, 300, 0.08, 0.06],
  fail: [0.7, 0, 220, 0.02, 0.3, 0.5, 2, 2, -2, 0, 0, 0, 0, 0.2],
  alert: [0.6, 0, 980, 0, 0.08, 0.08, 2, 1, 0, 0, 0, 0, 0.05],
  unlock: [0.6, 0, 300, 0.03, 0.3, 0.5, 1, 0.5, 0, 0, 600, 0.1, 0.1],
} satisfies Record<string, number[]>

export type SoundName = keyof typeof SOUNDS

let muted = false
let lastPlay = 0
ZZFX.volume = 0.25

export const setMuted = (m: boolean): void => {
  muted = m
}

export function play(name: SoundName): void {
  if (muted) return
  const now = performance.now()
  if (name === 'click' && now - lastPlay < 40) return
  lastPlay = now
  try {
    zzfx(...SOUNDS[name])
  } catch {
    /* audio bloqué tant que l'utilisateur n'a pas interagi */
  }
}
