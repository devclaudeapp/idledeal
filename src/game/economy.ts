import { BUSINESSES, BUSINESS_BY_ID, REVENUE_MILESTONES, SPEED_MILESTONES, type BusinessDef } from './data/businesses'
import { CORRUPTION_BY_ID } from './data/corruption'
import { ROLE_BY_ID } from './data/crew'
import { DISTRICT_BY_ID } from './data/districts'
import { FRONTS, FRONT_BY_ID } from './data/fronts'
import { HEIST_BY_ID, type HeistDef } from './data/heists'
import { UPGRADE_BY_ID, type UpgradeTarget } from './data/upgrades'
import { D, Decimal, geomCost, geomMax } from './num'
import type { GameState, Role } from './types'

export const LEGEND_BONUS = 0.02
export const ACHIEVEMENT_BONUS = 0.01
export const MAX_HEAT = 100

export function upgradeMult(s: GameState, target: UpgradeTarget): number {
  let m = 1
  for (const id of s.upgrades) {
    const u = UPGRADE_BY_ID[id]
    if (u && u.target === target) m *= u.mult
  }
  return m
}

export function isBusinessUnlocked(s: GameState, def: BusinessDef): boolean {
  return !def.district || s.districts.includes(def.district)
}

export function districtMult(s: GameState, key: 'globalMult' | 'launderMult' | 'heatMult'): number {
  let m = 1
  for (const id of s.districts) m *= DISTRICT_BY_ID[id]?.[key] ?? 1
  return m
}

export function buffMult(s: GameState): number {
  return s.buffs.reduce((m, b) => m * b.mult, 1)
}

export function globalMult(s: GameState): Decimal {
  return s.legend
    .mul(LEGEND_BONUS)
    .add(1)
    .mul(1 + s.achievements.length * ACHIEVEMENT_BONUS)
    .mul(districtMult(s, 'globalMult'))
    .mul(upgradeMult(s, 'all'))
    .mul(buffMult(s))
    .mul(s.lowProfile ? 0.25 : 1)
}

export function cycleTime(def: BusinessDef, level: number): number {
  const reached = SPEED_MILESTONES.filter((m) => level >= m).length
  return def.cycle / 2 ** reached
}

export function milestoneRevenueMult(level: number): number {
  return 3 ** REVENUE_MILESTONES.filter((m) => level >= m).length
}

export function revenuePerCycle(s: GameState, id: string, gm: Decimal = globalMult(s)): Decimal {
  const def = BUSINESS_BY_ID[id]
  const level = s.businesses[id]?.level ?? 0
  if (!def || level <= 0) return D(0)
  return D(def.baseRevenue)
    .mul(level)
    .mul(milestoneRevenueMult(level))
    .mul(upgradeMult(s, id))
    .mul(gm)
}

/** Revenu par seconde d'un business (s'il tournait en continu). */
export function revenuePerSec(s: GameState, id: string, gm: Decimal = globalMult(s)): Decimal {
  const def = BUSINESS_BY_ID[id]
  const level = s.businesses[id]?.level ?? 0
  if (!def || level <= 0) return D(0)
  return revenuePerCycle(s, id, gm).div(cycleTime(def, level))
}

/** Revenu passif réel (business avec lieutenant uniquement). */
export function passiveIncome(s: GameState): Decimal {
  const gm = globalMult(s)
  let total = D(0)
  for (const def of BUSINESSES) {
    const b = s.businesses[def.id]
    if (b && b.manager && b.level > 0 && isBusinessUnlocked(s, def)) total = total.add(revenuePerSec(s, def.id, gm))
  }
  return total
}

/** Revenu de référence pour indexer les gains manuels (tous les business possédés). */
export function referenceIncome(s: GameState): Decimal {
  const gm = globalMult(s)
  let total = D(0)
  for (const def of BUSINESSES) {
    if (isBusinessUnlocked(s, def)) total = total.add(revenuePerSec(s, def.id, gm))
  }
  return total
}

export function businessCost(s: GameState, id: string, n: number): Decimal {
  const def = BUSINESS_BY_ID[id]
  return geomCost(def.baseCost, def.costMult, s.businesses[id]?.level ?? 0, n)
}

export function resolveBuyAmount(s: GameState, base: number, mult: number, owned: number, budget: Decimal): number {
  if (s.buyAmount === 'max') return Math.max(1, geomMax(base, mult, owned, budget))
  return s.buyAmount
}

export function frontCost(s: GameState, id: string, n: number): Decimal {
  const def = FRONT_BY_ID[id]
  return geomCost(def.baseCost, def.costMult, s.fronts[id] ?? 0, n)
}

export function launderMult(s: GameState): number {
  return upgradeMult(s, 'launder') * districtMult(s, 'launderMult')
}

export function launderCapacity(s: GameState): Decimal {
  const m = launderMult(s)
  let cap = D(0)
  for (const f of FRONTS) cap = cap.add(D(f.capacity).mul(s.fronts[f.id] ?? 0).mul(m))
  return cap
}

export function heatMult(s: GameState): number {
  let m = upgradeMult(s, 'heat') * districtMult(s, 'heatMult')
  for (const id of s.corruption) m *= CORRUPTION_BY_ID[id]?.heatMult ?? 1
  return m
}

export function heatGainPerSec(s: GameState): number {
  if (s.lowProfile) return 0
  let g = 0
  for (const def of BUSINESSES) {
    const level = s.businesses[def.id]?.level ?? 0
    if (level > 0 && isBusinessUnlocked(s, def)) g += def.heat * Math.log2(1 + level)
  }
  return g * heatMult(s)
}

/** Refroidissement par seconde : une base fixe + une part proportionnelle à la chaleur. */
export function heatDecayPerSec(s: GameState): number {
  let d = 0.15 + s.heat * 0.005
  for (const id of s.corruption) d += CORRUPTION_BY_ID[id]?.decayAdd ?? 0
  return s.lowProfile ? d * 3 + 0.5 : d
}

export function heatNetPerSec(s: GameState): number {
  return heatGainPerSec(s) - heatDecayPerSec(s)
}

export function raidLossFraction(s: GameState): number {
  let m = 0.35
  for (const id of s.corruption) m *= CORRUPTION_BY_ID[id]?.raidLossMult ?? 1
  return m
}

export function crewCost(s: GameState, role: Role): Decimal {
  const def = ROLE_BY_ID[role]
  return D(def.baseCost).mul(Decimal.pow(def.costMult, s.crew[role]))
}

export function heistRequirementsMet(s: GameState, def: HeistDef): boolean {
  return Object.entries(def.req).every(([r, lvl]) => s.crew[r as Role] >= (lvl ?? 0))
}

export function heistChance(s: GameState, def: HeistDef): number {
  let c = def.baseChance
  for (const [r, lvl] of Object.entries(def.req)) c += Math.max(0, s.crew[r as Role] - (lvl ?? 0)) * 0.03
  c += s.crew.cerveau * 0.015
  c -= s.heat * 0.003
  return Math.min(0.95, Math.max(0.05, c))
}

export function heistReward(s: GameState, id: string): Decimal {
  const def = HEIST_BY_ID[id]
  return Decimal.max(def.minReward, referenceIncome(s).mul(def.rewardSec)).mul(upgradeMult(s, 'heist'))
}

/** Gain d'un clic « charbonner » (avant combo). */
export function clickValue(s: GameState): Decimal {
  return Decimal.max(1, referenceIncome(s).mul(0.04)).add(1).mul(upgradeMult(s, 'click'))
}

export function comboMult(combo: number): number {
  return 1 + Math.min(combo, 50) * 0.04
}

export function safeReward(s: GameState): Decimal {
  return Decimal.max(200, referenceIncome(s).mul(45)).mul(upgradeMult(s, 'safe'))
}

export function bribeCost(s: GameState): Decimal {
  return Decimal.max(500, s.cash.mul(0.08))
}

/** Quantité blanchie à la main par clic (« compter les billets »). */
export function manualLaunderAmount(s: GameState): Decimal {
  return Decimal.min(s.cash, Decimal.max(20, launderCapacity(s).mul(1.5)))
}

export function legendGain(s: GameState): Decimal {
  return s.stats.runEarned.div(1e11).sqrt().mul(10).floor()
}
