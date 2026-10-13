import type { Role } from '../types'

export interface RoleDef {
  id: Role
  name: string
  desc: string
  baseCost: number
  costMult: number
  maxLevel: number
}

export const ROLES: RoleDef[] = [
  { id: 'muscle', name: 'Gros bras', desc: 'Intimide, tient la porte, encaisse les coups.', baseCost: 150, costMult: 3, maxLevel: 15 },
  { id: 'chauffeur', name: 'Chauffeur', desc: 'Moteur qui tourne, plaques changées, fuite propre.', baseCost: 300, costMult: 3, maxLevel: 15 },
  { id: 'perceur', name: 'Perceur de coffres', desc: 'Stéthoscope, chalumeau et doigts de fée.', baseCost: 2000, costMult: 3, maxLevel: 15 },
  { id: 'hacker', name: 'Hacker', desc: 'Caméras, alarmes, serrures électroniques.', baseCost: 5000, costMult: 3, maxLevel: 15 },
  { id: 'cerveau', name: 'Cerveau', desc: 'Planifie tout. Chaque niveau améliore toutes les chances.', baseCost: 20000, costMult: 3, maxLevel: 15 },
]

export const ROLE_BY_ID = Object.fromEntries(ROLES.map((r) => [r.id, r])) as Record<Role, RoleDef>

export const ROLE_IDS: Role[] = ROLES.map((r) => r.id)
