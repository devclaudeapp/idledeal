// Source d'aléatoire remplaçable (tests déterministes).
let rng: () => number = Math.random

export const random = (): number => rng()
export const setRandom = (fn: () => number): void => {
  rng = fn
}
export const pick = <T>(arr: readonly T[]): T => arr[Math.floor(random() * arr.length)]
export const between = (min: number, max: number): number => min + random() * (max - min)
