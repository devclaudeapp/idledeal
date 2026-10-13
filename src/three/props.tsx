import { useFrame } from '@react-three/fiber'
import { forwardRef, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { GEO, glow, neon, solid } from './materials'

type V3 = [number, number, number]

/** Boîte simple (la brique de base de toute la ville). */
export function B({ p, s, c, m, rot, castShadow }: { p: V3; s: V3; c?: string; m?: THREE.Material; rot?: V3; castShadow?: boolean }) {
  return <mesh geometry={GEO.box} material={m ?? solid(c ?? '#888')} position={p} scale={s} rotation={rot} castShadow={castShadow} />
}

export function Cyl({ p, s, c, m, rot }: { p: V3; s: V3; c?: string; m?: THREE.Material; rot?: V3 }) {
  return <mesh geometry={GEO.cyl} material={m ?? solid(c ?? '#888')} position={p} scale={s} rotation={rot} />
}

export const CAR_COLORS = ['#b91c1c', '#1d4ed8', '#e5e7eb', '#111827', '#ca8a04', '#15803d', '#6b7280', '#7c3aed']

/** Voiture low-poly. L'avant pointe vers +Z. */
export const Car = forwardRef<THREE.Group, { color: string; police?: boolean; scale?: number; children?: ReactNode }>(function Car(
  { color, police, scale = 1, children },
  ref,
) {
  const red = useMemo(() => neon('#ff2020', 6), [])
  const blue = useMemo(() => neon('#2060ff', 6), [])
  const t = useRef(Math.random() * 10)
  useFrame((_, dt) => {
    if (!police) return
    t.current += dt
    const on = Math.floor(t.current * 6) % 2 === 0
    red.emissiveIntensity = on ? 8 : 0.2
    blue.emissiveIntensity = on ? 0.2 : 8
  })
  return (
    <group ref={ref} scale={scale}>
      <B p={[0, 0.55, 0]} s={[1.8, 0.7, 4]} c={police ? '#f3f4f6' : color} m={solid(police ? '#f3f4f6' : color, 0.35, 0.4)} />
      <B p={[0, 1.1, -0.3]} s={[1.6, 0.6, 2]} m={solid(police ? '#1e3a8a' : '#1f2937', 0.2, 0.6)} />
      <B p={[0, 0.3, 1.2]} s={[1.9, 0.4, 0.7]} c="#111" />
      <B p={[0, 0.3, -1.2]} s={[1.9, 0.4, 0.7]} c="#111" />
      <B p={[0.6, 0.6, 2.01]} s={[0.35, 0.2, 0.05]} m={glow('#fff6d5', 4)} />
      <B p={[-0.6, 0.6, 2.01]} s={[0.35, 0.2, 0.05]} m={glow('#fff6d5', 4)} />
      <B p={[0.6, 0.6, -2.01]} s={[0.35, 0.2, 0.05]} m={glow('#ff2a2a', 3)} />
      <B p={[-0.6, 0.6, -2.01]} s={[0.35, 0.2, 0.05]} m={glow('#ff2a2a', 3)} />
      {police && (
        <>
          <B p={[0.4, 1.5, -0.3]} s={[0.6, 0.18, 0.35]} m={red} />
          <B p={[-0.4, 1.5, -0.3]} s={[0.6, 0.18, 0.35]} m={blue} />
          <B p={[0, 0.65, 0]} s={[1.82, 0.18, 2.4]} c="#1d4ed8" />
        </>
      )}
      {children}
    </group>
  )
})

export const Scooter = forwardRef<THREE.Group, { color?: string }>(function Scooter({ color = '#f59e0b' }, ref) {
  return (
    <group ref={ref}>
      <B p={[0, 0.45, 0]} s={[0.5, 0.4, 1.6]} c={color} />
      <B p={[0, 0.9, 0.6]} s={[0.15, 0.7, 0.15]} c="#333" />
      <B p={[0, 0.25, 0.7]} s={[0.15, 0.5, 0.5]} c="#111" />
      <B p={[0, 0.25, -0.7]} s={[0.15, 0.5, 0.5]} c="#111" />
      <B p={[0, 0.9, 0.82]} s={[0.25, 0.15, 0.05]} m={glow('#fff6d5', 5)} />
      <Person p={[0, 0.5, -0.1]} color="#222" scale={0.85} />
    </group>
  )
})

export function Person({ p, color, scale = 1, rotY = 0 }: { p: V3; color: string; scale?: number; rotY?: number }) {
  return (
    <group position={p} scale={scale} rotation={[0, rotY, 0]}>
      <mesh geometry={GEO.capsule} material={solid(color)} position={[0, 0.7, 0]} />
      <mesh geometry={GEO.sphere} material={solid('#c58c6b')} position={[0, 1.55, 0]} scale={0.42} />
      <mesh geometry={GEO.sphere} material={solid('#111')} position={[0, 1.65, 0]} scale={[0.44, 0.3, 0.44]} />
    </group>
  )
}

export function StreetLight({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <Cyl p={[0, 2.5, 0]} s={[0.15, 5, 0.15]} c="#3a3a40" />
      <B p={[0, 5, 0.5]} s={[0.3, 0.12, 1.2]} c="#3a3a40" />
      <B p={[0, 4.9, 0.9]} s={[0.35, 0.1, 0.45]} m={glow('#ffd59a', 6)} />
    </group>
  )
}

export function Tree({ p, s = 1 }: { p: V3; s?: number }) {
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 1, 0]} s={[0.3, 2, 0.3]} c="#4b3621" />
      <mesh geometry={GEO.ico} material={solid('#1f4d2b')} position={[0, 2.8, 0]} scale={2.4} />
    </group>
  )
}

export function Palm({ p, s = 1 }: { p: V3; s?: number }) {
  const leaves = useMemo(() => Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2), [])
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 3, 0]} s={[0.3, 6, 0.3]} c="#7a5c3a" rot={[0, 0, 0.08]} />
      {leaves.map((a) => (
        <B key={a} p={[Math.sin(a) * 1.2, 6, Math.cos(a) * 1.2]} s={[0.5, 0.08, 2.6]} c="#2f6b33" rot={[0.4, a, 0]} />
      ))}
    </group>
  )
}

export const CONTAINER_COLORS = ['#b45309', '#1d4ed8', '#15803d', '#b91c1c', '#6b21a8', '#0f766e', '#a16207']

export function Container({ p, c, rotY = 0 }: { p: V3; c: string; rotY?: number }) {
  return <B p={p} s={[2.4, 2.6, 6]} m={solid(c, 0.6, 0.3)} rot={[0, rotY, 0]} />
}

export function Crane({ p, rotY = 0 }: { p: V3; rotY?: number }) {
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <B p={[-3, 7, -2]} s={[0.6, 14, 0.6]} c="#d97706" />
      <B p={[3, 7, -2]} s={[0.6, 14, 0.6]} c="#d97706" />
      <B p={[-3, 7, 2]} s={[0.6, 14, 0.6]} c="#d97706" />
      <B p={[3, 7, 2]} s={[0.6, 14, 0.6]} c="#d97706" />
      <B p={[0, 14, 3]} s={[7, 1, 18]} c="#f59e0b" />
      <B p={[0, 15, -2]} s={[2, 1.5, 3]} c="#78350f" />
      <B p={[0, 14.6, 11.5]} s={[0.4, 0.4, 0.4]} m={glow('#ff3b3b', 6)} />
    </group>
  )
}

export const Plane = forwardRef<THREE.Group, { color?: string; scale?: number }>(function Plane({ color = '#e5e7eb', scale = 1 }, ref) {
  return (
    <group ref={ref} scale={scale}>
      <mesh geometry={GEO.capsule} material={solid(color, 0.3, 0.5)} rotation={[Math.PI / 2, 0, 0]} scale={[1.5, 6, 1.5]} position={[0, 1.5, 0]} />
      <B p={[0, 1.4, 0.5]} s={[12, 0.25, 2.2]} c={color} />
      <B p={[0, 1.6, -4.2]} s={[4, 0.2, 1.2]} c={color} />
      <B p={[0, 2.8, -4.3]} s={[0.25, 2.2, 1.4]} c="#991b1b" />
      <B p={[6, 1.4, 0.5]} s={[0.3, 0.3, 0.3]} m={glow('#22ff55', 6)} />
      <B p={[-6, 1.4, 0.5]} s={[0.3, 0.3, 0.3]} m={glow('#ff2222', 6)} />
    </group>
  )
})

export const Helicopter = forwardRef<THREE.Group, { searchlight?: boolean }>(function Helicopter({ searchlight }, ref) {
  const rotor = useRef<THREE.Mesh>(null)
  const beamMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#dbeafe', transparent: true, opacity: 0.05, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    [],
  )
  useFrame((_, dt) => {
    if (rotor.current) rotor.current.rotation.y += dt * 25
  })
  return (
    <group ref={ref}>
      <mesh geometry={GEO.sphere} material={solid('#1e293b', 0.4, 0.4)} scale={[2, 1.6, 3.2]} />
      <B p={[0, 0.2, -3]} s={[0.4, 0.4, 3]} c="#1e293b" />
      <mesh ref={rotor} geometry={GEO.box} material={solid('#111')} position={[0, 1, 0]} scale={[9, 0.08, 0.4]} />
      <B p={[0, -0.6, 1.4]} s={[0.3, 0.3, 0.3]} m={glow('#ff2020', 6)} />
      {searchlight && <mesh geometry={GEO.cone} material={beamMat} position={[0, -17, 0]} scale={[9, 34, 9]} />}
    </group>
  )
})

export function Boat({ p, rotY = 0, s = 1, color = '#f8fafc' }: { p: V3; rotY?: number; s?: number; color?: string }) {
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <B p={[0, 0.5, 0]} s={[3, 1.2, 9]} c={color} />
      <B p={[0, 1.6, -0.5]} s={[2.4, 1.2, 4]} c="#e2e8f0" />
      <B p={[0, 1.7, 1.4]} s={[2.2, 0.6, 0.2]} m={glow('#93c5fd', 2)} />
    </group>
  )
}

export function Ship({ p, rotY = 0 }: { p: V3; rotY?: number }) {
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <B p={[0, 1.5, 0]} s={[9, 4, 44]} c="#7f1d1d" />
      <B p={[0, 3.6, 0]} s={[9.2, 0.4, 44.2]} c="#1f2937" />
      <B p={[0, 7, -17]} s={[8, 7, 6]} c="#f1f5f9" />
      <B p={[0, 9, -14]} s={[7, 1, 0.2]} m={glow('#fde68a', 3)} />
      {Array.from({ length: 10 }, (_, i) => (
        <Container key={i} p={[i % 2 ? 1.4 : -1.4, 5.1 + (i % 3) * 2.6, -8 + Math.floor(i / 2) * 6.5]} c={CONTAINER_COLORS[i % CONTAINER_COLORS.length]} />
      ))}
    </group>
  )
}

/** Panneau néon (texte simulé par une bande lumineuse). */
export function NeonSign({ p, w, color, rotY = 0, h = 0.8 }: { p: V3; w: number; color: string; rotY?: number; h?: number }) {
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <B p={[0, 0, 0]} s={[w + 0.3, h + 0.3, 0.2]} c="#111" />
      <B p={[0, 0, 0.12]} s={[w, h, 0.05]} m={glow(color, 4)} />
    </group>
  )
}
