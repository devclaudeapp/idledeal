import { ROAD_X, ROAD_Z, type Vec2 } from './layout'

/** Polyligne parcourable à vitesse constante. */
export class Path {
  readonly pts: Vec2[]
  readonly cum: number[]
  readonly length: number
  readonly closed: boolean

  constructor(pts: Vec2[], closed = false) {
    this.pts = closed ? [...pts, pts[0]] : pts
    this.closed = closed
    this.cum = [0]
    for (let i = 1; i < this.pts.length; i++) {
      const [ax, az] = this.pts[i - 1]
      const [bx, bz] = this.pts[i]
      this.cum.push(this.cum[i - 1] + Math.hypot(bx - ax, bz - az))
    }
    this.length = this.cum[this.cum.length - 1] || 1
  }

  /** Position et cap à la distance `s` le long du chemin. */
  sample(s: number, out: { x: number; z: number; angle: number }): void {
    let d = this.closed ? ((s % this.length) + this.length) % this.length : Math.max(0, Math.min(this.length, s))
    let i = 1
    while (i < this.cum.length - 1 && this.cum[i] < d) i++
    const [ax, az] = this.pts[i - 1]
    const [bx, bz] = this.pts[i]
    const seg = this.cum[i] - this.cum[i - 1] || 1
    d = (d - this.cum[i - 1]) / seg
    out.x = ax + (bx - ax) * d
    out.z = az + (bz - az) * d
    out.angle = Math.atan2(bx - ax, bz - az)
  }
}

/** Boucle rectangulaire sur les routes, décalée d'une voie. */
export function rectLoop(x0: number, z0: number, x1: number, z1: number, clockwise: boolean, lane = 2.4): Path {
  const a = x0 + lane
  const b = x1 - lane
  const c = z0 + lane
  const d = z1 - lane
  const pts: Vec2[] = [
    [a, c],
    [b, c],
    [b, d],
    [a, d],
  ]
  return new Path(clockwise ? pts : pts.reverse(), true)
}

const nearest = (arr: number[], v: number) => arr.reduce((best, x) => (Math.abs(x - v) < Math.abs(best - v) ? x : best), arr[0])

/** Itinéraire « en Manhattan » par les routes entre deux points. */
export function route(from: Vec2, to: Vec2): Path {
  const z1 = nearest(ROAD_Z, from[1])
  const x2 = nearest(ROAD_X, to[0])
  const z2 = nearest(ROAD_Z, to[1])
  const pts: Vec2[] = [from, [from[0], z1], [x2, z1], [x2, z2], [to[0], z2], to]
  // supprime les doublons consécutifs
  return new Path(pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]))
}

export const TRAFFIC_LOOPS: Path[] = [
  rectLoop(ROAD_X[0], ROAD_Z[0], ROAD_X[4], ROAD_Z[2], true),
  rectLoop(ROAD_X[0], ROAD_Z[0], ROAD_X[4], ROAD_Z[2], false),
  rectLoop(ROAD_X[1], ROAD_Z[0], ROAD_X[3], ROAD_Z[2], true),
  rectLoop(ROAD_X[0], ROAD_Z[1], ROAD_X[2], ROAD_Z[2], false),
  rectLoop(ROAD_X[2], ROAD_Z[0], ROAD_X[4], ROAD_Z[1], true),
  rectLoop(ROAD_X[1], ROAD_Z[1], ROAD_X[4], ROAD_Z[2], false),
]
