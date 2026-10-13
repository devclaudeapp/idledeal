import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { easing } from 'maath'
import { useGame } from '../game/store'
import { districtCenter, slotPos, ALL_DISTRICTS, type Vec2 } from './layout'
import { Path, route, TRAFFIC_LOOPS } from './paths'
import { Car, CAR_COLORS, Helicopter, Scooter } from './props'

const tmp = { x: 0, z: 0, angle: 0 }

function placeOn(g: THREE.Group | null, path: Path, s: number, dt: number, y = 0.3) {
  if (!g) return
  path.sample(s, tmp)
  g.position.set(tmp.x, y, tmp.z)
  // rotation amortie dans les virages
  easing.dampAngle(g.rotation, 'y', tmp.angle, 0.12, dt)
}

const MAX_CARS = 20

/** Circulation civile : plus dense quand l'empire s'étend. */
function Traffic() {
  const districts = useGame((s) => s.game.districts.length)
  const count = Math.min(MAX_CARS, 6 + districts * 2)
  const cars = useMemo(
    () =>
      Array.from({ length: MAX_CARS }, (_, i) => ({
        path: TRAFFIC_LOOPS[i % TRAFFIC_LOOPS.length],
        offset: (i * 137.5) % 400,
        speed: 9 + ((i * 7) % 6),
        color: CAR_COLORS[i % CAR_COLORS.length],
      })),
    [],
  )
  const refs = useRef<(THREE.Group | null)[]>([])
  const dist = useRef(0)
  useFrame((_, dt) => {
    dist.current += Math.min(dt, 0.1)
    for (let i = 0; i < count; i++) {
      const c = cars[i]
      placeOn(refs.current[i], c.path, c.offset + dist.current * c.speed, dt)
    }
  })
  return (
    <group>
      {cars.slice(0, count).map((c, i) => (
        <Car key={i} ref={(el) => void (refs.current[i] = el)} color={c.color} />
      ))}
    </group>
  )
}

/** Patrouilles de police : leur nombre suit la chaleur. */
function Patrols() {
  const heat = useGame((s) => Math.floor(s.game.heat / 25))
  const count = [0, 1, 2, 4, 6][Math.min(4, heat)]
  const refs = useRef<(THREE.Group | null)[]>([])
  const dist = useRef(0)
  useFrame((_, dt) => {
    dist.current += Math.min(dt, 0.1)
    for (let i = 0; i < count; i++) {
      const path = TRAFFIC_LOOPS[(i * 2 + 1) % TRAFFIC_LOOPS.length]
      placeOn(refs.current[i], path, i * 90 + dist.current * 16, dt)
    }
  })
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <Car key={i} ref={(el) => void (refs.current[i] = el)} color="#fff" police />
      ))}
    </group>
  )
}

/** Descente : les voitures de police convergent vers le QG. */
function RaidConvoy() {
  const raid = useGame((s) => !!s.game.raid)
  const paths = useMemo(() => {
    const [hx, hz] = slotPos('hq')
    const starts: Vec2[] = [
      [-140, -46],
      [140, 46],
      [hx, -120],
      [140, -46],
      [-140, 46],
    ]
    return starts.map((s, i) => route(s, [hx + Math.cos(i * 1.3) * 9, hz + Math.sin(i * 1.3) * 9]))
  }, [])
  const refs = useRef<(THREE.Group | null)[]>([])
  useFrame((_, dt) => {
    const r = useGame.getState().game.raid
    if (!r) return
    const progress = Math.min(1, ((r.total - r.remaining) / r.total) * 1.6)
    paths.forEach((p, i) => placeOn(refs.current[i], p, p.length * progress, dt))
  })
  if (!raid) return null
  return (
    <group>
      {paths.map((_, i) => (
        <Car key={i} ref={(el) => void (refs.current[i] = el)} color="#fff" police />
      ))}
    </group>
  )
}

/** La voiture de l'équipe pendant un braquage : aller, coup, retour. */
function GetawayCar() {
  const heistId = useGame((s) => s.game.heist?.id ?? null)
  const path = useMemo(() => (heistId ? route(slotPos('hq'), slotPos(`heist:${heistId}`)) : null), [heistId])
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    const h = useGame.getState().game.heist
    if (!h || !path) return
    const t = 1 - h.remaining / h.duration
    // 35 % aller, 30 % sur place, 35 % retour
    const s = t < 0.35 ? t / 0.35 : t < 0.65 ? 1 : 1 - (t - 0.65) / 0.35
    placeOn(ref.current, path, path.length * s, dt)
  })
  if (!path) return null
  return <Car ref={ref} color="#0a0a0a" scale={1.1} />
}

/** Scooters de livraison des commandes en cours. */
function Deliveries() {
  const uids = useGame((s) =>
    s.game.orders
      .filter((o) => o.delivering !== null)
      .map((o) => o.uid)
      .join(','),
  )
  const list = useMemo(() => (uids ? uids.split(',').map(Number) : []), [uids])
  const paths = useMemo(
    () =>
      list.map((uid) => {
        const d = ALL_DISTRICTS[uid % ALL_DISTRICTS.length]
        const [cx, cz] = districtCenter(d)
        return route(slotPos('biz:deal'), [cx + ((uid * 7) % 20) - 10, cz + 19])
      }),
    [list],
  )
  const refs = useRef<(THREE.Group | null)[]>([])
  useFrame((_, dt) => {
    const orders = useGame.getState().game.orders
    list.forEach((uid, i) => {
      const o = orders.find((x) => x.uid === uid)
      if (!o || o.delivering === null) return
      const t = 1 - o.delivering / o.deliverTime
      placeOn(refs.current[i], paths[i], paths[i].length * Math.min(1, t), dt)
    })
  })
  return (
    <group>
      {list.map((uid, i) => (
        <Scooter key={uid} ref={(el) => void (refs.current[i] = el)} />
      ))}
    </group>
  )
}

/** Hélico de police quand la chaleur monte. */
function PoliceHelicopter() {
  const hot = useGame((s) => s.game.heat >= 65 || !!s.game.raid)
  const ref = useRef<THREE.Group>(null)
  const [hx, hz] = slotPos('hq')
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const a = clock.elapsedTime * 0.25
    g.position.set(hx + Math.cos(a) * 26, 40 + Math.sin(a * 3) * 2, hz + Math.sin(a) * 26)
    g.rotation.y = -a
  })
  if (!hot) return null
  return <Helicopter ref={ref} searchlight />
}

export function Actors() {
  return (
    <group>
      <Traffic />
      <Patrols />
      <RaidConvoy />
      <GetawayCar />
      <Deliveries />
      <PoliceHelicopter />
    </group>
  )
}
