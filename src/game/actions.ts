import { BUSINESS_BY_ID } from './data/businesses'
import { CORRUPTION_BY_ID } from './data/corruption'
import { ROLE_BY_ID } from './data/crew'
import { DISTRICT_BY_ID } from './data/districts'
import { EVENT_BY_ID } from './data/events'
import { FRONT_BY_ID } from './data/fronts'
import { HEIST_BY_ID } from './data/heists'
import { UPGRADE_BY_ID } from './data/upgrades'
import {
  bribeCost, businessCost, clickValue, comboMult, crewCost, frontCost, heistChance, heistRequirementsMet,
  isBusinessUnlocked, legendGain, manualLaunderAmount, referenceIncome, resolveBuyAmount, safeReward, upgradeMult,
} from './economy'
import { earn, RAID_SAVE_CAP } from './engine'
import { D, Decimal } from './num'
import { newRunState } from './state'
import type { BuyAmount, GameState, Role } from './types'

export function buyBusiness(s: GameState, id: string): number {
  const def = BUSINESS_BY_ID[id]
  if (!def || !isBusinessUnlocked(s, def)) return 0
  const owned = s.businesses[id].level
  const n = resolveBuyAmount(s, def.baseCost, def.costMult, owned, s.cash)
  const cost = businessCost(s, id, n)
  if (s.cash.lt(cost)) return 0
  s.cash = s.cash.sub(cost)
  s.businesses[id].level += n
  return n
}

export function buyManager(s: GameState, id: string): boolean {
  const def = BUSINESS_BY_ID[id]
  const b = s.businesses[id]
  if (!def || b.manager || b.level <= 0 || s.cash.lt(def.managerCost)) return false
  s.cash = s.cash.sub(def.managerCost)
  b.manager = true
  b.running = true
  return true
}

/** Lancer un cycle à la main (business sans lieutenant). */
export function runBusiness(s: GameState, id: string): boolean {
  const def = BUSINESS_BY_ID[id]
  const b = s.businesses[id]
  if (!def || !isBusinessUnlocked(s, def) || b.level <= 0 || b.running || s.raid) return false
  b.running = true
  return true
}

export function buyFront(s: GameState, id: string): number {
  const def = FRONT_BY_ID[id]
  if (!def) return 0
  const n = resolveBuyAmount(s, def.baseCost, def.costMult, s.fronts[id] ?? 0, s.cash)
  const cost = frontCost(s, id, n)
  if (s.cash.lt(cost)) return 0
  s.cash = s.cash.sub(cost)
  s.fronts[id] = (s.fronts[id] ?? 0) + n
  return n
}

export function buyUpgrade(s: GameState, id: string): boolean {
  const u = UPGRADE_BY_ID[id]
  if (!u || s.upgrades.includes(id) || s.clean.lt(u.cost)) return false
  s.clean = s.clean.sub(u.cost)
  s.upgrades.push(id)
  return true
}

export function buyCorruption(s: GameState, id: string): boolean {
  const c = CORRUPTION_BY_ID[id]
  if (!c || s.corruption.includes(id) || s.clean.lt(c.cost)) return false
  s.clean = s.clean.sub(c.cost)
  s.corruption.push(id)
  return true
}

export function conquerDistrict(s: GameState, id: string): boolean {
  const d = DISTRICT_BY_ID[id]
  if (!d || s.districts.includes(id) || s.respect < d.respect || s.cash.lt(d.cost)) return false
  s.respect -= d.respect
  s.cash = s.cash.sub(d.cost)
  s.districts.push(id)
  return true
}

export function hireCrew(s: GameState, role: Role): boolean {
  const def = ROLE_BY_ID[role]
  if (s.crew[role] >= def.maxLevel || s.heist) return false
  const cost = crewCost(s, role)
  if (s.cash.lt(cost)) return false
  s.cash = s.cash.sub(cost)
  s.crew[role]++
  return true
}

export function startHeist(s: GameState, id: string): boolean {
  const def = HEIST_BY_ID[id]
  if (!def || s.heist || s.heistCooldowns[id] || !heistRequirementsMet(s, def)) return false
  // Interventions réparties sur la durée du coup
  const qteAt = Array.from({ length: def.qtes }, (_, i) => def.duration * (1 - (i + 1) / (def.qtes + 1)))
  s.heist = { id, duration: def.duration, remaining: def.duration, chance: heistChance(s, def), qteAt }
  return true
}

/** Clic sur l'intervention manuelle en cours. Renvoie true si elle est réussie. */
export function qteClick(s: GameState, bonus: number): boolean {
  if (!s.qte || !s.heist) return false
  s.qte.clicks++
  if (s.qte.clicks < s.qte.needed) return false
  s.heist.chance = Math.min(0.99, s.heist.chance + bonus)
  s.qte = null
  return true
}

/** Charbonner : vente à la main, avec combo. */
export function streetClick(s: GameState): Decimal {
  if (s.raid) return D(0)
  s.combo = Math.min(s.combo + 1, 50)
  s.comboTimer = 1.2
  s.stats.bestCombo = Math.max(s.stats.bestCombo, s.combo)
  s.stats.clicks++
  const gain = clickValue(s).mul(comboMult(s.combo))
  earn(s, gain)
  s.heat = Math.min(99, s.heat + 0.05)
  return gain
}

export function acceptOrder(s: GameState, uid: number): boolean {
  const o = s.orders.find((x) => x.uid === uid)
  if (!o || o.delivering !== null || s.orders.some((x) => x.delivering !== null && x.delivering > 0)) return false
  o.delivering = o.deliverTime
  return true
}

export function claimOrder(s: GameState, uid: number): Decimal | null {
  const o = s.orders.find((x) => x.uid === uid)
  if (!o || o.delivering === null || o.delivering > 0) return null
  const reward = Decimal.max(50, referenceIncome(s).mul(o.rewardSec)).mul(upgradeMult(s, 'orders'))
  earn(s, reward)
  s.orders = s.orders.filter((x) => x.uid !== uid)
  s.stats.orders++
  s.heat = Math.min(99, s.heat + 2)
  if (o.rewardSec >= 45) s.respect += 1
  return reward
}

/** Résultat du mini-jeu de crochetage (locks = serrures ouvertes sur 3). */
export function crackSafe(s: GameState, locks: number): Decimal {
  if (s.safeCooldown > 0) return D(0)
  if (locks <= 0) {
    s.safeCooldown = 20
    s.heat = Math.min(99, s.heat + 5)
    return D(0)
  }
  s.safeCooldown = 45
  const reward = safeReward(s).mul(locks / 3).mul(locks === 3 ? 1.5 : 1)
  earn(s, reward)
  if (locks === 3) s.stats.safesCracked++
  return reward
}

/** Pendant une descente : planquer la marchandise. */
export function raidClick(s: GameState): void {
  if (!s.raid) return
  s.raid.saved = Math.min(RAID_SAVE_CAP, s.raid.saved + 0.04)
}

/** Compter les billets : blanchiment manuel, plus efficace que les façades. */
export function manualLaunder(s: GameState): Decimal {
  const amount = manualLaunderAmount(s)
  if (amount.lte(0)) return D(0)
  s.cash = s.cash.sub(amount)
  const clean = amount.mul(0.9)
  s.clean = s.clean.add(clean)
  s.stats.totalLaundered = s.stats.totalLaundered.add(amount)
  return clean
}

export function bribe(s: GameState): boolean {
  const cost = bribeCost(s)
  if (s.bribeCooldown > 0 || s.cash.lt(cost) || s.raid) return false
  s.cash = s.cash.sub(cost)
  s.heat = Math.max(0, s.heat - 30)
  s.bribeCooldown = 45
  return true
}

export function resolveEvent(s: GameState, choice: number): string | null {
  const ev = s.pendingEvent ? EVENT_BY_ID[s.pendingEvent] : null
  if (!ev || !ev.choices[choice]) return null
  s.pendingEvent = null
  return ev.choices[choice].apply(s)
}

export function prestige(s: GameState): Decimal | null {
  const gain = legendGain(s)
  if (gain.lt(1)) return null
  Object.assign(s, newRunState())
  s.legend = s.legend.add(gain)
  s.stats.runEarned = D(0)
  s.stats.prestiges++
  return gain
}

export function setBuyAmount(s: GameState, a: BuyAmount): void {
  s.buyAmount = a
}
