import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { create } from 'zustand'
import { FONT } from './Districts'

interface Popup {
  id: number
  x: number
  y: number
  z: number
  text: string
  color: string
  born: number
  size: number
}

interface Burst {
  id: number
  x: number
  y: number
  z: number
  color: string
  born: number
  count: number
}

interface FxStore {
  popups: Popup[]
  bursts: Burst[]
  popup: (p: Omit<Popup, 'id' | 'born' | 'size'> & { size?: number }) => void
  burst: (b: Omit<Burst, 'id' | 'born' | 'count'> & { count?: number }) => void
  prune: (now: number) => void
}

let seq = 0
const now = () => performance.now() / 1000
const POPUP_LIFE = 1.6
const BURST_LIFE = 2.2

/** Effets visuels éphémères dans la ville (gains flottants, gerbes de billets). */
export const useFx = create<FxStore>((set) => ({
  popups: [],
  bursts: [],
  popup: (p) => set((s) => ({ popups: [...s.popups.slice(-30), { size: 2.2, ...p, id: ++seq, born: now() }] })),
  burst: (b) => set((s) => ({ bursts: [...s.bursts.slice(-6), { count: 40, ...b, id: ++seq, born: now() }] })),
  prune: (t) =>
    set((s) => {
      const popups = s.popups.filter((p) => t - p.born < POPUP_LIFE)
      const bursts = s.bursts.filter((b) => t - b.born < BURST_LIFE)
      return popups.length === s.popups.length && bursts.length === s.bursts.length ? s : { popups, bursts }
    }),
}))

function FloatingText({ p }: { p: Popup }) {
  const ref = useRef<THREE.Group>(null)
  const textRef = useRef<{ fillOpacity: number; outlineOpacity: number } | null>(null)
  useFrame(() => {
    const age = now() - p.born
    if (ref.current) ref.current.position.y = p.y + age * 4
    if (textRef.current) {
      const o = Math.max(0, 1 - age / POPUP_LIFE)
      textRef.current.fillOpacity = o
      textRef.current.outlineOpacity = o
    }
  })
  return (
    <group ref={ref} position={[p.x, p.y, p.z]}>
      <Billboard>
        <Text ref={textRef as never} font={FONT} fontSize={p.size} color={p.color} outlineWidth={0.12} outlineColor="#000" anchorX="center">
          {p.text}
        </Text>
      </Billboard>
    </group>
  )
}

const billGeo = new THREE.PlaneGeometry(0.9, 0.45)

/** Gerbe de billets qui retombent. */
function MoneyBurst({ b }: { b: Burst }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const parts = useMemo(
    () =>
      Array.from({ length: b.count }, () => ({
        vx: (Math.random() - 0.5) * 14,
        vy: 8 + Math.random() * 10,
        vz: (Math.random() - 0.5) * 14,
        spin: (Math.random() - 0.5) * 12,
      })),
    [b.count],
  )
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: b.color, emissive: b.color, emissiveIntensity: 0.6, side: THREE.DoubleSide }), [b.color])
  const m = useMemo(() => new THREE.Matrix4(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const e = useMemo(() => new THREE.Euler(), [])
  const v = useMemo(() => new THREE.Vector3(), [])
  const one = useMemo(() => new THREE.Vector3(1, 1, 1), [])
  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const t = now() - b.born
    parts.forEach((pt, i) => {
      const y = Math.max(0.3, b.y + pt.vy * t - 9 * t * t)
      v.set(b.x + pt.vx * t * 0.6, y, b.z + pt.vz * t * 0.6)
      e.set(pt.spin * t, pt.spin * t * 0.7, 0)
      q.setFromEuler(e)
      m.compose(v, q, one)
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={ref} args={[billGeo, mat, b.count]} frustumCulled={false} />
}

/** Anneau pulsant au sol (cible de braquage, sélection…). */
export function PulseRing({ p, color, r = 6 }: { p: [number, number, number]; color: string; r?: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, toneMapped: false, depthWrite: false }),
    [color],
  )
  const geo = useMemo(() => new THREE.RingGeometry(0.85, 1, 48).rotateX(-Math.PI / 2), [])
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime % 1.4) / 1.4
    if (ref.current) ref.current.scale.setScalar(r * (0.6 + t * 0.8))
    mat.opacity = 0.8 * (1 - t)
  })
  return <mesh ref={ref} geometry={geo} material={mat} position={p} />
}

export function Effects() {
  const popups = useFx((s) => s.popups)
  const bursts = useFx((s) => s.bursts)
  const last = useRef(0)
  useFrame(() => {
    const t = now()
    if (t - last.current > 0.5) {
      last.current = t
      useFx.getState().prune(t)
    }
  })
  return (
    <group>
      {popups.map((p) => (
        <FloatingText key={p.id} p={p} />
      ))}
      {bursts.map((b) => (
        <MoneyBurst key={b.id} b={b} />
      ))}
    </group>
  )
}

