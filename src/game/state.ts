import { BUSINESSES } from './data/businesses'
import { FRONTS } from './data/fronts'
import { ROLE_IDS } from './data/crew'
import { D } from './num'
import type { GameState, Role } from './types'

export const SAVE_VERSION = 1

export function newRunState(): Pick<
  GameState,
  | 'cash' | 'clean' | 'respect' | 'heat' | 'lowProfile' | 'businesses' | 'fronts' | 'upgrades' | 'corruption'
  | 'districts' | 'crew' | 'heist' | 'qte' | 'heistCooldowns' | 'bribeCooldown' | 'safeCooldown' | 'combo'
  | 'comboTimer' | 'orders' | 'nextOrderIn' | 'raid' | 'buffs' | 'pendingEvent' | 'nextEventIn'
> {
  return {
    cash: D(0),
    clean: D(0),
    respect: 0,
    heat: 0,
    lowProfile: false,
    businesses: Object.fromEntries(
      BUSINESSES.map((b, i) => [b.id, { level: i === 0 ? 1 : 0, manager: false, progress: 0, running: false }]),
    ),
    fronts: Object.fromEntries(FRONTS.map((f) => [f.id, 0])),
    upgrades: [],
    corruption: [],
    districts: ['lilas'],
    crew: Object.fromEntries(ROLE_IDS.map((r) => [r, 0])) as Record<Role, number>,
    heist: null,
    qte: null,
    heistCooldowns: {},
    bribeCooldown: 0,
    safeCooldown: 0,
    combo: 0,
    comboTimer: 0,
    orders: [],
    nextOrderIn: 15,
    raid: null,
    buffs: [],
    pendingEvent: null,
    nextEventIn: 90,
  }
}

export function newGameState(): GameState {
  return {
    version: SAVE_VERSION,
    ...newRunState(),
    legend: D(0),
    launderOn: true,
    orderSeq: 0,
    achievements: [],
    stats: {
      totalEarned: D(0),
      runEarned: D(0),
      totalLaundered: D(0),
      heists: 0,
      heistsFailed: 0,
      raids: 0,
      prestiges: 0,
      playTime: 0,
      clicks: 0,
      orders: 0,
      safesCracked: 0,
      bestCombo: 0,
    },
    lastSaved: Date.now(),
    buyAmount: 1,
    muted: false,
  }
}
