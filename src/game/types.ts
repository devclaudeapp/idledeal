import type { Decimal } from './num'

export type Role = 'chauffeur' | 'muscle' | 'perceur' | 'hacker' | 'cerveau'
export type BuyAmount = 1 | 10 | 100 | 'max'

export interface BizState {
  level: number
  manager: boolean
  progress: number
  running: boolean
}

export interface HeistRun {
  id: string
  duration: number
  remaining: number
  chance: number
  /** Interventions manuelles restantes (secondes de déclenchement, décroissantes). */
  qteAt: number[]
}

/** Intervention manuelle en cours pendant un braquage. */
export interface Qte {
  kind: string
  remaining: number
  total: number
  clicks: number
  needed: number
}

/** Commande client à livrer à la main. */
export interface Order {
  uid: number
  client: string
  place: string
  goods: string
  /** Multiplicateur en secondes de revenu. */
  rewardSec: number
  /** Temps avant expiration. */
  expiresIn: number
  /** Temps de livraison une fois acceptée. */
  deliverTime: number
  /** null = pas encore acceptée. */
  delivering: number | null
}

export interface Raid {
  remaining: number
  total: number
  /** Fraction de la saisie évitée grâce aux clics (0..cap). */
  saved: number
}

export interface Buff {
  id: string
  label: string
  mult: number
  remaining: number
}

export interface Stats {
  totalEarned: Decimal
  runEarned: Decimal
  totalLaundered: Decimal
  heists: number
  heistsFailed: number
  raids: number
  prestiges: number
  playTime: number
  clicks: number
  orders: number
  safesCracked: number
  bestCombo: number
}

export interface GameState {
  version: number
  cash: Decimal
  clean: Decimal
  legend: Decimal
  respect: number
  heat: number
  lowProfile: boolean
  launderOn: boolean
  businesses: Record<string, BizState>
  fronts: Record<string, number>
  upgrades: string[]
  corruption: string[]
  districts: string[]
  crew: Record<Role, number>
  heist: HeistRun | null
  qte: Qte | null
  heistCooldowns: Record<string, number>
  bribeCooldown: number
  safeCooldown: number
  combo: number
  comboTimer: number
  orders: Order[]
  nextOrderIn: number
  orderSeq: number
  raid: Raid | null
  buffs: Buff[]
  pendingEvent: string | null
  nextEventIn: number
  achievements: string[]
  stats: Stats
  lastSaved: number
  buyAmount: BuyAmount
  muted: boolean
}

/** Événements émis par le moteur pour l'UI (toasts, sons, confettis). */
export type GameEvent =
  | { type: 'raidStart' }
  | { type: 'raid'; lost: Decimal; saved: number }
  | { type: 'heistDone'; id: string; success: boolean; reward: Decimal; respect: number; arrested?: Role }
  | { type: 'qte'; kind: string }
  | { type: 'achievement'; id: string }
  | { type: 'event'; id: string }
  | { type: 'order'; client: string }
  | { type: 'orderExpired'; client: string }
