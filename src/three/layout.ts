import { DISTRICTS, DISTRICT_BY_ID } from '../game/data/districts'

/** Taille d'un pâté de maisons, largeur de route et pas de la grille (unités monde ≈ mètres). */
export const BLOCK = 36
export const ROAD = 10
export const PITCH = BLOCK + ROAD

export const COLS = 4
export const ROWS = 2

export const ROAD_X = Array.from({ length: COLS + 1 }, (_, i) => (i - COLS / 2) * PITCH)
export const ROAD_Z = Array.from({ length: ROWS + 1 }, (_, i) => (i - ROWS / 2) * PITCH)
export const HALF_W = (COLS / 2) * PITCH
export const HALF_D = (ROWS / 2) * PITCH
/** Ligne du quai : la mer commence au-delà. */
export const SEA_Z = HALF_D + ROAD / 2 + 8

export type Vec2 = [number, number]

export function districtCenter(id: string): Vec2 {
  const d = DISTRICT_BY_ID[id]
  return [(d.x - (COLS - 1) / 2) * PITCH, (d.y - (ROWS - 1) / 2) * PITCH]
}

export interface Slot {
  district: string
  local: Vec2
  /** Rayon réservé (pas de bâtiment générique dedans). */
  r: number
}

/** Emplacements fixes des éléments de jeu dans la ville. */
export const SLOTS: Record<string, Slot> = {
  hq: { district: 'lilas', local: [0, -2], r: 7 },
  'biz:deal': { district: 'lilas', local: [-12, 12], r: 5 },
  'biz:scooter': { district: 'lilas', local: [11, 12], r: 5 },
  'biz:racket': { district: 'lilas', local: [12, -12], r: 5 },
  'biz:paris': { district: 'lilas', local: [-12, -12], r: 5 },
  'front:laverie': { district: 'lilas', local: [0, 14], r: 3.5 },
  'front:kebab': { district: 'lilas', local: [14, 1], r: 3.5 },
  'heist:superette': { district: 'lilas', local: [-14, 1], r: 3.5 },

  'biz:labo': { district: 'zi', local: [-7, 6], r: 9 },
  'front:carwash': { district: 'zi', local: [10, 12], r: 5 },
  'heist:station': { district: 'zi', local: [10, -10], r: 6 },

  'biz:contrebande': { district: 'docks', local: [0, 6], r: 10 },
  'front:offshore': { district: 'docks', local: [6, 36], r: 0 },

  'biz:fauxbillets': { district: 'centre', local: [-10, 10], r: 5 },
  'heist:bijouterie': { district: 'centre', local: [10, 11], r: 4 },
  'heist:banque': { district: 'centre', local: [9, -8], r: 7 },
  'front:onglerie': { district: 'centre', local: [-11, -10], r: 4 },
  'heist:fourgon': { district: 'centre', local: [0, 23], r: 0 },

  'biz:casino': { district: 'corniche', local: [-8, 6], r: 8 },
  'front:boite': { district: 'corniche', local: [10, 11], r: 5 },
  'heist:casino': { district: 'corniche', local: [9, -9], r: 7 },

  'biz:cartel': { district: 'aeroport', local: [0, 0], r: 30 },

  'biz:ransomware': { district: 'affaires', local: [-8, 8], r: 6 },
  'front:immo': { district: 'affaires', local: [10, 11], r: 4 },
  'front:mixer': { district: 'affaires', local: [10, -10], r: 4 },

  mairie: { district: 'mairie', local: [0, -5], r: 11 },
  'heist:reserve': { district: 'mairie', local: [0, 12], r: 6 },
}

export function slotPos(id: string): Vec2 {
  const s = SLOTS[id]
  const [cx, cz] = districtCenter(s.district)
  return [cx + s.local[0], cz + s.local[1]]
}

/** PRNG déterministe (mulberry32) pour générer toujours la même ville. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface GenericBuilding {
  x: number
  z: number
  w: number
  d: number
  h: number
  color: string
}

type Style = (r: () => number) => Omit<GenericBuilding, 'x' | 'z'> | null

const pickColor = (r: () => number, colors: string[]) => colors[Math.floor(r() * colors.length)]

/** Style architectural de chaque quartier. */
export const STYLES: Record<string, { ground: string; cell: number; style: Style }> = {
  lilas: {
    ground: '#2b2b30',
    cell: 9,
    style: (r) => ({ w: 6 + r() * 2, d: 6 + r() * 2, h: 14 + r() * 16, color: pickColor(r, ['#8d8579', '#9b9488', '#7b7f86', '#a39a8a']) }),
  },
  zi: {
    ground: '#2a2a26',
    cell: 11,
    style: (r) => ({ w: 8 + r() * 3, d: 7 + r() * 3, h: 4 + r() * 4, color: pickColor(r, ['#6b6f6a', '#7a6f5f', '#5f6670']) }),
  },
  docks: {
    ground: '#2a2c2e',
    cell: 9,
    style: (r) => (r() < 0.4 ? null : { w: 7 + r() * 3, d: 6 + r() * 2, h: 5 + r() * 4, color: pickColor(r, ['#6d5d50', '#5d6b73', '#73695c']) }),
  },
  centre: {
    ground: '#2e2c2a',
    cell: 7.5,
    style: (r) => ({ w: 6 + r(), d: 6 + r(), h: 12 + r() * 8, color: pickColor(r, ['#c9b99a', '#d4c4a5', '#bfae90', '#b8a88c']) }),
  },
  corniche: {
    ground: '#2a3128',
    cell: 10,
    style: (r) => (r() < 0.3 ? null : { w: 6 + r() * 3, d: 6 + r() * 3, h: 4 + r() * 4, color: pickColor(r, ['#efe6d6', '#f2d9c4', '#e3e7ea', '#e8d3b0']) }),
  },
  aeroport: {
    ground: '#262a26',
    cell: 12,
    style: () => null,
  },
  affaires: {
    ground: '#26282e',
    cell: 9,
    style: (r) => ({ w: 6 + r() * 2.5, d: 6 + r() * 2.5, h: 26 + r() * 40, color: pickColor(r, ['#4f6f8f', '#3d5a78', '#5a7d99', '#2f4b66']) }),
  },
  mairie: {
    ground: '#2e2d2b',
    cell: 8,
    style: (r) => ({ w: 6, d: 6, h: 10 + r() * 6, color: pickColor(r, ['#d8ccb4', '#cbbd9f']) }),
  },
}

/** Bâtiments génériques d'un quartier, évitant les emplacements réservés. */
export function genericBuildings(districtId: string): GenericBuilding[] {
  const [cx, cz] = districtCenter(districtId)
  const st = STYLES[districtId]
  const r = rng(districtId.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7))
  const reserved = Object.values(SLOTS).filter((s) => s.district === districtId)
  const out: GenericBuilding[] = []
  const half = BLOCK / 2 - 3
  for (let lx = -half; lx <= half + 0.01; lx += st.cell) {
    for (let lz = -half; lz <= half + 0.01; lz += st.cell) {
      const blocked = reserved.some((s) => Math.hypot(s.local[0] - lx, s.local[1] - lz) < s.r + st.cell * 0.55)
      if (blocked) continue
      const b = st.style(r)
      if (!b) continue
      out.push({ ...b, x: cx + lx + (r() - 0.5) * 1.5, z: cz + lz + (r() - 0.5) * 1.5 })
    }
  }
  return out
}

export const ALL_DISTRICTS = DISTRICTS.map((d) => d.id)
