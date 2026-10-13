import type { Role } from '../types'

export interface HeistDef {
  id: string
  name: string
  desc: string
  duration: number
  baseChance: number
  req: Partial<Record<Role, number>>
  /** Récompense = max(minReward, revenu/s × rewardSec). */
  rewardSec: number
  minReward: number
  respect: number
  heat: number
  cooldown: number
  /** Nombre d'interventions manuelles pendant le coup. */
  qtes: number
}

export const HEISTS: HeistDef[] = [
  { id: 'superette', name: 'Supérette de nuit', desc: 'Une cagoule, un sac, la caisse.', duration: 20, baseChance: 0.7, req: { muscle: 1 }, rewardSec: 30, minReward: 400, respect: 1, heat: 8, cooldown: 30, qtes: 1 },
  { id: 'station', name: 'Station-service', desc: 'Caisse + coffre du gérant, sortie par la rocade.', duration: 45, baseChance: 0.65, req: { muscle: 1, chauffeur: 1 }, rewardSec: 60, minReward: 5000, respect: 3, heat: 12, cooldown: 60, qtes: 2 },
  { id: 'bijouterie', name: 'Bijouterie Lambert', desc: 'Vitrines blindées, coffre à l’étage.', duration: 90, baseChance: 0.55, req: { muscle: 2, chauffeur: 1, perceur: 1 }, rewardSec: 180, minReward: 50000, respect: 8, heat: 18, cooldown: 180, qtes: 2 },
  { id: 'fourgon', name: 'Fourgon blindé', desc: 'Herses sur la départementale, 3 minutes chrono.', duration: 180, baseChance: 0.5, req: { muscle: 3, chauffeur: 2, cerveau: 1 }, rewardSec: 420, minReward: 5e5, respect: 20, heat: 25, cooldown: 300, qtes: 3 },
  { id: 'banque', name: 'Banque du centre', desc: 'Le grand classique. Otages interdits, on est des pros.', duration: 300, baseChance: 0.45, req: { muscle: 3, chauffeur: 3, perceur: 3, hacker: 2, cerveau: 2 }, rewardSec: 900, minReward: 5e6, respect: 50, heat: 30, cooldown: 600, qtes: 3 },
  { id: 'casino', name: 'Casino de la Corniche', desc: 'Onze complices, un plan parfait.', duration: 600, baseChance: 0.4, req: { muscle: 3, chauffeur: 4, perceur: 4, hacker: 5, cerveau: 4 }, rewardSec: 1800, minReward: 1e8, respect: 120, heat: 35, cooldown: 1200, qtes: 4 },
  { id: 'reserve', name: 'Réserve de la Banque centrale', desc: 'Le casse du siècle. Ou la prison à vie.', duration: 1200, baseChance: 0.35, req: { muscle: 8, chauffeur: 8, perceur: 8, hacker: 8, cerveau: 8 }, rewardSec: 3600, minReward: 1e10, respect: 300, heat: 45, cooldown: 2400, qtes: 5 },
]

export const HEIST_BY_ID = Object.fromEntries(HEISTS.map((h) => [h.id, h]))

/** Interventions manuelles (QTE) pendant un braquage. */
export interface QteDef {
  kind: string
  title: string
  action: string
  /** Temps pour réagir. */
  time: number
  /** Nombre de clics nécessaires. */
  clicks: number
  bonus: number
  malus: number
}

export const QTES: QteDef[] = [
  { kind: 'alarme', title: 'L’alarme silencieuse clignote !', action: 'Couper les fils', time: 4, clicks: 6, bonus: 0.06, malus: 0.1 },
  { kind: 'vigile', title: 'Un vigile sort des toilettes !', action: 'Le maîtriser', time: 3.5, clicks: 8, bonus: 0.05, malus: 0.12 },
  { kind: 'camera', title: 'Une caméra pivote vers l’équipe !', action: 'Bomber l’objectif', time: 3, clicks: 4, bonus: 0.04, malus: 0.08 },
  { kind: 'sirene', title: 'Sirènes au loin !', action: 'Faire diversion', time: 4, clicks: 7, bonus: 0.05, malus: 0.1 },
  { kind: 'coffre', title: 'Le coffre résiste !', action: 'Forcer la serrure', time: 5, clicks: 12, bonus: 0.08, malus: 0.06 },
  { kind: 'otage', title: 'Un client panique et crie !', action: 'Calmer le jeu', time: 3.5, clicks: 5, bonus: 0.04, malus: 0.1 },
]

export const QTE_BY_KIND = Object.fromEntries(QTES.map((q) => [q.kind, q]))
