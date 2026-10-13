import { beforeEach, describe, expect, it } from 'vitest'
import * as A from './actions'
import { cycleTime, globalMult, heistChance, legendGain, passiveIncome } from './economy'
import { BUSINESS_BY_ID } from './data/businesses'
import { HEIST_BY_ID } from './data/heists'
import { simulateOffline, tick } from './engine'
import { D, fmt, fmtTime, geomCost, geomMax } from './num'
import { setRandom } from './random'
import { deserialize, exportSave, importSave, serialize } from './save'
import { newGameState } from './state'

beforeEach(() => setRandom(() => 0.5))

describe('num', () => {
  it('formate les grands nombres', () => {
    expect(fmt(12)).toBe('12')
    expect(fmt(1.5)).toBe('1.50')
    expect(fmt(1234)).toBe('1.23 k')
    expect(fmt(2.5e9)).toBe('2.50 Md')
    expect(fmt(D('1e60'))).toBe('1.00e60')
    expect(fmtTime(3725)).toBe('1h 02m')
  })
  it('calcule coût et max géométriques', () => {
    expect(geomCost(10, 2, 0, 3).toNumber()).toBeCloseTo(70)
    expect(geomMax(10, 2, 0, 70)).toBe(3)
    expect(geomMax(10, 2, 0, 69)).toBe(2)
  })
})

describe('business', () => {
  it('cycle manuel puis lieutenant automatique', () => {
    const s = newGameState()
    expect(A.runBusiness(s, 'deal')).toBe(true)
    tick(s, 1)
    expect(s.cash.toNumber()).toBe(1)
    expect(s.businesses.deal.running).toBe(false)
    tick(s, 1)
    expect(s.cash.toNumber()).toBe(1)

    s.cash = D(1e6)
    expect(A.buyManager(s, 'deal')).toBe(true)
    const before = s.cash
    tick(s, 6)
    // 0,6 s par cycle → 10 cycles
    expect(s.cash.sub(before).toNumber()).toBeCloseTo(10)
    expect(passiveIncome(s).toNumber()).toBeCloseTo(globalMult(s).toNumber() / 0.6)
  })
  it('achat x10 et paliers de vitesse', () => {
    const s = newGameState()
    s.cash = D(1e6)
    s.buyAmount = 10
    expect(A.buyBusiness(s, 'deal')).toBe(10)
    expect(s.businesses.deal.level).toBe(11)
    expect(cycleTime(BUSINESS_BY_ID.deal, 25)).toBeCloseTo(0.3)
  })
  it('business verrouillé par quartier', () => {
    const s = newGameState()
    s.cash = D(1e12)
    expect(A.buyBusiness(s, 'labo')).toBe(0)
    s.respect = 10
    expect(A.conquerDistrict(s, 'zi')).toBe(true)
    expect(A.buyBusiness(s, 'labo')).toBe(1)
    expect(globalMult(s).toNumber()).toBeCloseTo(1.1)
  })
})

describe('chaleur et descente', () => {
  it('déclenche une descente que les clics atténuent', () => {
    const s = newGameState()
    s.cash = D(1000)
    s.heat = 99.99
    for (const id of ['deal', 'scooter', 'racket', 'paris']) s.businesses[id].level = 1e6
    const ev = tick(s, 1)
    expect(ev.some((e) => e.type === 'raidStart')).toBe(true)
    for (let i = 0; i < 50; i++) A.raidClick(s)
    expect(s.raid!.saved).toBeCloseTo(0.8)
    tick(s, 6)
    expect(s.raid).toBeNull()
    expect(s.cash.toNumber()).toBeCloseTo(1000 - 1000 * 0.35 * 0.2)
    expect(s.heat).toBe(40)
  })
  it('pas de descente hors-ligne', () => {
    const s = newGameState()
    s.heat = 99
    for (const id of ['deal', 'scooter', 'racket', 'paris']) s.businesses[id].level = 1e6
    s.businesses.deal.manager = true
    const r = simulateOffline(s, 3600)
    expect(s.raid).toBeNull()
    expect(r.earned.gt(0)).toBe(true)
  })
})

describe('manuel', () => {
  it('charbonner avec combo', () => {
    const s = newGameState()
    const a = A.streetClick(s)
    const b = A.streetClick(s)
    expect(b.gt(a)).toBe(true)
    expect(s.stats.clicks).toBe(2)
    tick(s, 2)
    expect(s.combo).toBe(0)
  })
  it('commande : accepter, livrer, encaisser', () => {
    const s = newGameState()
    tick(s, 16)
    expect(s.orders.length).toBe(1)
    const o = s.orders[0]
    expect(A.claimOrder(s, o.uid)).toBeNull()
    expect(A.acceptOrder(s, o.uid)).toBe(true)
    tick(s, 20)
    expect(A.claimOrder(s, o.uid)?.gt(0)).toBe(true)
    expect(s.orders.length).toBe(0)
  })
  it('braquage avec interventions', () => {
    const s = newGameState()
    s.cash = D(1e6)
    A.hireCrew(s, 'muscle')
    expect(A.startHeist(s, 'superette')).toBe(true)
    const base = s.heist!.chance
    expect(base).toBeCloseTo(heistChance(s, HEIST_BY_ID.superette))
    tick(s, 10.5)
    expect(s.qte).not.toBeNull()
    while (s.qte) A.qteClick(s, 0.06)
    expect(s.heist!.chance).toBeCloseTo(base + 0.06)
    tick(s, 10)
    expect(s.heist).toBeNull()
    expect(s.stats.heists).toBe(1)
    expect(s.respect).toBe(1)
  })
  it('coffre et blanchiment manuel', () => {
    const s = newGameState()
    s.cash = D(100)
    expect(A.crackSafe(s, 3).toNumber()).toBe(300)
    expect(A.crackSafe(s, 3).toNumber()).toBe(0)
    const clean = A.manualLaunder(s)
    expect(clean.toNumber()).toBeCloseTo(18)
  })
})

describe('prestige et sauvegarde', () => {
  it('prestige donne de la légende et réinitialise', () => {
    const s = newGameState()
    s.stats.runEarned = D(1e13)
    s.cash = D(1e12)
    expect(legendGain(s).toNumber()).toBe(100)
    expect(A.prestige(s)?.toNumber()).toBe(100)
    expect(s.cash.toNumber()).toBe(0)
    expect(globalMult(s).toNumber()).toBeCloseTo(3)
  })
  it('sérialise les Decimal sans perte', () => {
    const s = newGameState()
    s.cash = D('1.2345e300')
    s.upgrades.push('all_1')
    const back = deserialize(serialize(s))
    expect(back.cash.eq(s.cash)).toBe(true)
    expect(back.upgrades).toEqual(['all_1'])
    expect(importSave(exportSave(s))!.cash.eq(s.cash)).toBe(true)
  })
  it('complète une vieille sauvegarde', () => {
    const back = deserialize(JSON.stringify({ cash: { $d: '42' }, businesses: { deal: { level: 3 } } }))
    expect(back.cash.toNumber()).toBe(42)
    expect(back.businesses.deal.level).toBe(3)
    expect(back.businesses.deal.manager).toBe(false)
    expect(back.businesses.casino.level).toBe(0)
  })
})
