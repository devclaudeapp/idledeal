import { ACHIEVEMENTS } from './data/achievements'
import { BUSINESSES } from './data/businesses'
import { EVENTS } from './data/events'
import { FRONTS } from './data/fronts'
import { HEIST_BY_ID, QTES } from './data/heists'
import { CLIENTS, GOODS, PLACES } from './data/orders'
import {
  cycleTime, globalMult, heatNetPerSec, heistReward, isBusinessUnlocked, launderMult, MAX_HEAT,
  raidLossFraction, revenuePerCycle,
} from './economy'
import { D, Decimal } from './num'
import { between, pick, random } from './random'
import type { GameEvent, GameState, Role } from './types'

export const RAID_WINDOW = 5
export const RAID_SAVE_CAP = 0.8
export const MAX_ORDERS = 3

export function earn(s: GameState, amount: Decimal): void {
  s.cash = s.cash.add(amount)
  s.stats.totalEarned = s.stats.totalEarned.add(amount)
  s.stats.runEarned = s.stats.runEarned.add(amount)
}

function tickBusinesses(s: GameState, dt: number): void {
  const gm = globalMult(s)
  let total = D(0)
  for (const def of BUSINESSES) {
    const b = s.businesses[def.id]
    if (!b || b.level <= 0 || !isBusinessUnlocked(s, def)) continue
    if (b.manager) b.running = true
    if (!b.running) continue
    b.progress += dt / cycleTime(def, b.level)
    if (b.progress < 1) continue
    let n = Math.floor(b.progress)
    if (b.manager) {
      b.progress -= n
    } else {
      n = 1
      b.progress = 0
      b.running = false
    }
    total = total.add(revenuePerCycle(s, def.id, gm).mul(n))
  }
  if (total.gt(0)) earn(s, total)
}

function tickLaundering(s: GameState, dt: number): void {
  if (!s.launderOn) return
  const m = launderMult(s)
  for (const f of FRONTS) {
    const lvl = s.fronts[f.id] ?? 0
    if (lvl <= 0 || s.cash.lte(0)) continue
    const amount = Decimal.min(s.cash, D(f.capacity).mul(lvl).mul(m).mul(dt))
    s.cash = s.cash.sub(amount)
    s.clean = s.clean.add(amount.mul(f.efficiency))
    s.stats.totalLaundered = s.stats.totalLaundered.add(amount)
  }
}

function resolveRaid(s: GameState, events: GameEvent[]): void {
  const saved = s.raid?.saved ?? 0
  const lost = s.cash.mul(raidLossFraction(s) * (1 - saved))
  s.cash = s.cash.sub(lost)
  s.heat = 40
  s.raid = null
  s.stats.raids++
  for (const b of Object.values(s.businesses)) if (!b.manager) {
    b.running = false
    b.progress = 0
  }
  events.push({ type: 'raid', lost, saved })
}

function tickHeat(s: GameState, dt: number, offline: boolean, events: GameEvent[]): void {
  if (s.raid) {
    s.raid.remaining -= dt
    if (s.raid.remaining <= 0) resolveRaid(s, events)
    return
  }
  s.heat = Math.max(0, Math.min(MAX_HEAT, s.heat + heatNetPerSec(s) * dt))
  if (s.heat >= MAX_HEAT) {
    if (offline) {
      s.heat = MAX_HEAT - 1
    } else {
      s.raid = { remaining: RAID_WINDOW, total: RAID_WINDOW, saved: 0 }
      events.push({ type: 'raidStart' })
    }
  }
}

function finishHeist(s: GameState, events: GameEvent[]): void {
  const run = s.heist!
  const def = HEIST_BY_ID[run.id]
  s.heist = null
  s.qte = null
  s.heistCooldowns[def.id] = def.cooldown
  const success = random() < run.chance
  if (success) {
    const reward = heistReward(s, def.id)
    earn(s, reward)
    s.respect += def.respect
    s.heat = Math.min(MAX_HEAT - 1, s.heat + def.heat * 0.5)
    s.stats.heists++
    events.push({ type: 'heistDone', id: def.id, success, reward, respect: def.respect })
  } else {
    s.heat = Math.min(MAX_HEAT - 1, s.heat + def.heat)
    s.stats.heistsFailed++
    let arrested: Role | undefined
    if (random() < 0.5) {
      const roles = (Object.keys(def.req) as Role[]).filter((r) => s.crew[r] > 0)
      if (roles.length) {
        arrested = pick(roles)
        s.crew[arrested]--
      }
    }
    events.push({ type: 'heistDone', id: def.id, success, reward: D(0), respect: 0, arrested })
  }
}

function tickHeist(s: GameState, dt: number, offline: boolean, events: GameEvent[]): void {
  for (const id of Object.keys(s.heistCooldowns)) {
    s.heistCooldowns[id] -= dt
    if (s.heistCooldowns[id] <= 0) delete s.heistCooldowns[id]
  }
  const run = s.heist
  if (!run) return
  run.remaining -= dt

  if (s.qte) {
    s.qte.remaining -= dt
    if (s.qte.remaining <= 0) {
      const q = QTES.find((x) => x.kind === s.qte!.kind)
      run.chance = Math.max(0.05, run.chance - (q?.malus ?? 0.1))
      s.qte = null
    }
  } else if (run.qteAt.length && run.remaining <= run.qteAt[0]) {
    run.qteAt.shift()
    if (!offline) {
      const q = pick(QTES)
      s.qte = { kind: q.kind, remaining: q.time, total: q.time, clicks: 0, needed: q.clicks }
      events.push({ type: 'qte', kind: q.kind })
    }
  }

  if (run.remaining <= 0) finishHeist(s, events)
}

function tickOrders(s: GameState, dt: number, events: GameEvent[]): void {
  for (const o of s.orders) {
    if (o.delivering === null) o.expiresIn -= dt
    else o.delivering = Math.max(0, o.delivering - dt)
  }
  const expired = s.orders.filter((o) => o.delivering === null && o.expiresIn <= 0)
  for (const o of expired) events.push({ type: 'orderExpired', client: o.client })
  if (expired.length) s.orders = s.orders.filter((o) => !expired.includes(o))

  s.nextOrderIn -= dt
  if (s.nextOrderIn <= 0) {
    s.nextOrderIn = between(20, 40)
    if (s.orders.length < MAX_ORDERS) {
      const o = {
        uid: ++s.orderSeq,
        client: pick(CLIENTS),
        place: pick(PLACES),
        goods: pick(GOODS),
        rewardSec: Math.round(between(15, 60)),
        expiresIn: 35,
        deliverTime: Math.round(between(4, 12)),
        delivering: null,
      }
      s.orders.push(o)
      events.push({ type: 'order', client: o.client })
    }
  }
}

function tickEvents(s: GameState, dt: number, events: GameEvent[]): void {
  if (s.pendingEvent) return
  s.nextEventIn -= dt
  if (s.nextEventIn <= 0 && s.stats.playTime > 60) {
    s.nextEventIn = between(120, 240)
    const ev = pick(EVENTS)
    s.pendingEvent = ev.id
    events.push({ type: 'event', id: ev.id })
  }
}

export function checkAchievements(s: GameState, events: GameEvent[]): void {
  for (const a of ACHIEVEMENTS) {
    if (!s.achievements.includes(a.id) && a.check(s)) {
      s.achievements.push(a.id)
      events.push({ type: 'achievement', id: a.id })
    }
  }
}

/**
 * Avance la simulation de `dt` secondes (mutation en place — appelé dans un draft Immer).
 * En mode `offline`, pas de descente, pas d'événement, pas de commande, pas d'intervention manuelle.
 */
export function tick(s: GameState, dt: number, offline = false): GameEvent[] {
  const events: GameEvent[] = []
  if (dt <= 0) return events
  s.stats.playTime += dt
  s.bribeCooldown = Math.max(0, s.bribeCooldown - dt)
  s.safeCooldown = Math.max(0, s.safeCooldown - dt)

  s.comboTimer -= dt
  if (s.comboTimer <= 0) {
    s.combo = 0
    s.comboTimer = 0
  }

  for (const b of s.buffs) b.remaining -= dt
  if (s.buffs.some((b) => b.remaining <= 0)) s.buffs = s.buffs.filter((b) => b.remaining > 0)

  tickBusinesses(s, dt)
  tickLaundering(s, dt)
  tickHeat(s, dt, offline, events)
  tickHeist(s, dt, offline, events)
  if (!offline) {
    tickOrders(s, dt, events)
    tickEvents(s, dt, events)
  }
  checkAchievements(s, events)
  return events
}

/** Simule une absence (progression hors-ligne), plafonnée à 8 h. */
export function simulateOffline(s: GameState, seconds: number): { earned: Decimal; laundered: Decimal; seconds: number } {
  const total = Math.min(seconds, 8 * 3600)
  const before = s.stats.totalEarned
  const launderedBefore = s.stats.totalLaundered
  const steps = Math.min(2000, Math.max(1, Math.ceil(total)))
  const dt = total / steps
  for (let i = 0; i < steps; i++) tick(s, dt, true)
  return { earned: s.stats.totalEarned.sub(before), laundered: s.stats.totalLaundered.sub(launderedBefore), seconds: total }
}
