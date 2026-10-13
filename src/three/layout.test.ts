import { describe, expect, it } from 'vitest'
import { BUSINESSES } from '../game/data/businesses'
import { DISTRICT_BY_ID } from '../game/data/districts'
import { FRONTS } from '../game/data/fronts'
import { HEISTS } from '../game/data/heists'
import { BLOCK, districtCenter, genericBuildings, SLOTS, slotPos, ALL_DISTRICTS } from './layout'
import { route, TRAFFIC_LOOPS } from './paths'

describe('plan de la ville 3D', () => {
  it('chaque business, façade et cible a un emplacement dans un quartier existant', () => {
    for (const b of BUSINESSES) expect(SLOTS[`biz:${b.id}`], b.id).toBeDefined()
    for (const f of FRONTS) expect(SLOTS[`front:${f.id}`], f.id).toBeDefined()
    for (const h of HEISTS) expect(SLOTS[`heist:${h.id}`], h.id).toBeDefined()
    for (const s of Object.values(SLOTS)) expect(DISTRICT_BY_ID[s.district]).toBeDefined()
  })
  it('les business débloqués par un quartier sont construits dans ce quartier', () => {
    for (const b of BUSINESSES) if (b.district) expect(SLOTS[`biz:${b.id}`].district).toBe(b.district)
  })
  it('les immeubles génériques restent dans leur bloc et évitent les emplacements réservés', () => {
    for (const id of ALL_DISTRICTS) {
      const [cx, cz] = districtCenter(id)
      for (const b of genericBuildings(id)) {
        expect(Math.abs(b.x - cx)).toBeLessThan(BLOCK / 2)
        expect(Math.abs(b.z - cz)).toBeLessThan(BLOCK / 2)
        for (const [key, s] of Object.entries(SLOTS)) {
          if (s.district !== id || s.r === 0) continue
          const [sx, sz] = slotPos(key)
          expect(Math.hypot(b.x - sx, b.z - sz), `${id}/${key}`).toBeGreaterThan(s.r)
        }
      }
    }
  })
  it('les itinéraires relient bien départ et arrivée', () => {
    const p = route(slotPos('hq'), slotPos('heist:reserve'))
    const out = { x: 0, z: 0, angle: 0 }
    p.sample(0, out)
    expect([out.x, out.z]).toEqual(slotPos('hq'))
    p.sample(p.length, out)
    expect(out.x).toBeCloseTo(slotPos('heist:reserve')[0])
    expect(out.z).toBeCloseTo(slotPos('heist:reserve')[1])
    for (const loop of TRAFFIC_LOOPS) expect(loop.length).toBeGreaterThan(100)
  })
})
