import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import fontUrl from '@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff?url'
import { DISTRICTS, DISTRICT_BY_ID } from '../game/data/districts'
import { fmt } from '../game/num'
import { useGame } from '../game/store'
import { useUi } from '../ui/uiStore'
import { BLOCK, districtCenter, genericBuildings, HALF_D, HALF_W, PITCH, ROAD, ROAD_X, ROAD_Z, SEA_Z, STYLES } from './layout'
import { GEO, glow, makeWindowMaterial, solid } from './materials'
import { B, Cyl, Palm, StreetLight, Tree } from './props'

export const FONT = fontUrl

/** Boîte dont l'origine est à la base (pratique pour les immeubles). */
const baseBox = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)

function GenericBuildings({ id, owned }: { id: string; owned: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const list = useMemo(() => genericBuildings(id), [id])
  const mat = useMemo(
    () =>
      makeWindowMaterial({
        lit: 0.4,
        intensity: id === 'affaires' ? 2.6 : 2.2,
        winColor: id === 'affaires' ? '#cfe8ff' : '#ffcf7a',
        winW: id === 'affaires' ? 1.6 : 2.2,
        winH: id === 'affaires' ? 2.4 : 3,
        metalness: id === 'affaires' ? 0.5 : 0.05,
        roughness: id === 'affaires' ? 0.35 : 0.85,
      }),
    [id],
  )
  // Quartier non contrôlé : fenêtres presque toutes éteintes
  useFrame((_, dt) => {
    const u = mat.userData.uniforms.uLit
    const target = owned ? 0.42 : 0.06
    u.value += (target - u.value) * Math.min(1, dt * 2)
  })
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const c = new THREE.Color()
    list.forEach((b, i) => {
      m.compose(new THREE.Vector3(b.x, 0, b.z), new THREE.Quaternion(), new THREE.Vector3(b.w, b.h, b.d))
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, c.set(b.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [list])
  if (!list.length) return null
  return <instancedMesh ref={ref} args={[baseBox, mat, list.length]} castShadow receiveShadow />
}

function DistrictLabel({ id, owned }: { id: string; owned: boolean }) {
  const d = DISTRICT_BY_ID[id]
  const [cx, cz] = districtCenter(id)
  const respect = useGame((s) => s.game.respect)
  const affordable = respect >= d.respect
  if (owned) return null
  return (
    <group position={[cx, 34, cz]}>
      <Text font={FONT} fontSize={5} color={affordable ? '#f59e0b' : '#a1a1aa'} anchorX="center" anchorY="bottom" outlineWidth={0.25} outlineColor="#000">
        {d.name.toUpperCase()}
      </Text>
      <Text font={FONT} fontSize={3} position={[0, -0.6, 0]} color={affordable ? '#fbbf24' : '#71717a'} anchorX="center" anchorY="top" outlineWidth={0.2} outlineColor="#000">
        {`${fmt(d.respect, 0)} respect requis`}
      </Text>
    </group>
  )
}

function DistrictGround({ id, owned }: { id: string; owned: boolean }) {
  const [cx, cz] = districtCenter(id)
  const selectDistrict = useUi((s) => s.selectDistrict)
  const setTab = useUi((s) => s.setTab)
  const setFocus = useUi((s) => s.setFocus)
  const edge = owned ? glow('#22c55e', 1.6) : glow('#52525b', 0.6)
  return (
    <group>
      <mesh
        geometry={GEO.box}
        material={solid(STYLES[id].ground, 0.95)}
        position={[cx, 0.15, cz]}
        scale={[BLOCK, 0.3, BLOCK]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation()
          selectDistrict(id)
          setFocus(`district:${id}`)
          setTab('territoire')
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      />
      {/* liseré du territoire */}
      <B p={[cx, 0.32, cz - BLOCK / 2]} s={[BLOCK, 0.06, 0.25]} m={edge} />
      <B p={[cx, 0.32, cz + BLOCK / 2]} s={[BLOCK, 0.06, 0.25]} m={edge} />
      <B p={[cx - BLOCK / 2, 0.32, cz]} s={[0.25, 0.06, BLOCK]} m={edge} />
      <B p={[cx + BLOCK / 2, 0.32, cz]} s={[0.25, 0.06, BLOCK]} m={edge} />
    </group>
  )
}

/** Routes, trottoirs, marquages et lampadaires. */
function Roads() {
  const dashes = useMemo(() => {
    const out: [number, number, boolean][] = []
    for (const z of ROAD_Z) for (let x = -HALF_W; x < HALF_W; x += 6) out.push([x + 1.5, z, true])
    for (const x of ROAD_X) for (let z = -HALF_D; z < HALF_D; z += 6) out.push([x, z + 1.5, false])
    return out
  }, [])
  const dashRef = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = dashRef.current!
    const m = new THREE.Matrix4()
    dashes.forEach(([x, z, horiz], i) => {
      m.compose(new THREE.Vector3(x, 0.06, z), new THREE.Quaternion(), new THREE.Vector3(horiz ? 2.5 : 0.25, 0.02, horiz ? 0.25 : 2.5))
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [dashes])
  const lights = useMemo(() => {
    const out: [number, number, number][] = []
    for (let i = 0; i < ROAD_X.length - 1; i++)
      for (const z of ROAD_Z) {
        const x = (ROAD_X[i] + ROAD_X[i + 1]) / 2
        out.push([x - 10, 0, z - ROAD / 2 - 0.6], [x + 10, 0, z + ROAD / 2 + 0.6])
      }
    return out
  }, [])
  const W = HALF_W * 2 + ROAD
  const D = HALF_D * 2 + ROAD
  return (
    <group>
      <B p={[0, -0.05, 0]} s={[W + 6, 0.1, D + 6]} c="#18181c" />
      {ROAD_Z.map((z) => (
        <B key={`h${z}`} p={[0, 0.02, z]} s={[W, 0.04, ROAD]} m={solid('#202024', 0.9)} />
      ))}
      {ROAD_X.map((x) => (
        <B key={`v${x}`} p={[x, 0.02, 0]} s={[ROAD, 0.04, D]} m={solid('#202024', 0.9)} />
      ))}
      <instancedMesh ref={dashRef} args={[GEO.box, solid('#d4d4d8', 0.6), dashes.length]} />
      {lights.map((p, i) => (
        <StreetLight key={i} p={p} />
      ))}
    </group>
  )
}

function Sea() {
  const ref = useRef<THREE.Mesh>(null)
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0b2236', roughness: 0.15, metalness: 0.7 }), [])
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = -0.6 + Math.sin(clock.elapsedTime * 0.6) * 0.08
  })
  return (
    <group>
      <mesh ref={ref} geometry={GEO.box} material={mat} position={[0, -0.6, SEA_Z + 150]} scale={[900, 0.1, 300]} />
      {/* quai */}
      <B p={[0, -0.2, SEA_Z - 1]} s={[HALF_W * 2 + ROAD + 6, 1, 2]} c="#3f3f46" />
      {Array.from({ length: 12 }, (_, i) => (
        <Cyl key={i} p={[-HALF_W + i * 17, 0.6, SEA_Z - 1.5]} s={[0.4, 0.8, 0.4]} c="#1f2937" />
      ))}
    </group>
  )
}

function Backdrop() {
  // collines et ville lointaine
  const hills = useMemo(() => {
    const r = (i: number) => (Math.sin(i * 12.9898) * 43758.5453) % 1
    return Array.from({ length: 16 }, (_, i) => ({ x: -260 + i * 34, z: -150 - Math.abs(r(i)) * 40, s: 40 + Math.abs(r(i + 3)) * 40 }))
  }, [])
  const far = useMemo(() => makeWindowMaterial({ lit: 0.25, intensity: 1.4, color: '#3b3f4a' }), [])
  return (
    <group>
      <B p={[0, -0.3, -90]} s={[600, 0.4, 80]} c="#121216" />
      {hills.map((h, i) => (
        <mesh key={i} geometry={GEO.ico} material={solid('#0f1a14', 1)} position={[h.x, -h.s * 0.3, h.z]} scale={[h.s * 1.6, h.s, h.s]} />
      ))}
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={`f${i}`} geometry={baseBox} material={far} position={[-220 + i * 15, 0, -75 - (i % 4) * 9]} scale={[8, 10 + ((i * 37) % 30), 8]} />
      ))}
    </group>
  )
}

/** Décors propres à chaque quartier. */
function DistrictDecor({ id }: { id: string }) {
  const [cx, cz] = districtCenter(id)
  switch (id) {
    case 'lilas':
      return (
        <group position={[cx, 0.3, cz]}>
          {/* terrain de basket */}
          <B p={[0, 0.02, 12]} s={[9, 0.04, 5]} c="#9a3412" />
          <B p={[-4.2, 1.5, 12]} s={[0.15, 3, 0.15]} c="#e5e7eb" />
          <B p={[4.2, 1.5, 12]} s={[0.15, 3, 0.15]} c="#e5e7eb" />
          <Tree p={[-16, 0, 16]} s={0.8} />
          <Tree p={[16, 0, -16]} s={0.8} />
        </group>
      )
    case 'zi':
      return (
        <group position={[cx, 0.3, cz]}>
          <Cyl p={[-14, 9, -14]} s={[2, 18, 2]} c="#57534e" />
          <B p={[-14, 18.2, -14]} s={[2.2, 0.5, 2.2]} m={glow('#ef4444', 4)} />
          <Cyl p={[-9, 7, -15]} s={[1.6, 14, 1.6]} c="#57534e" />
          <B p={[0, 1, -17.5]} s={[34, 2, 0.2]} c="#52525b" />
        </group>
      )
    case 'centre':
      return (
        <group position={[cx, 0.3, cz]}>
          <Cyl p={[0, 0.4, 0]} s={[6, 0.8, 6]} c="#a8a29e" />
          <Cyl p={[0, 0.85, 0]} s={[5, 0.2, 5]} m={glow('#38bdf8', 1.5)} />
          <Cyl p={[0, 2, 0]} s={[0.6, 3, 0.6]} c="#d6d3d1" />
          <Tree p={[-6, 0, 5]} s={0.7} />
          <Tree p={[6, 0, -5]} s={0.7} />
        </group>
      )
    case 'corniche':
      return (
        <group position={[cx, 0.3, cz]}>
          {[-15, -8, 0, 8, 15].map((x) => (
            <Palm key={x} p={[x, 0, 17]} s={0.9} />
          ))}
          <B p={[-12, 0.05, -13]} s={[5, 0.1, 3]} m={glow('#22d3ee', 1.2)} />
          <B p={[0, -0.1, BLOCK / 2 + 6]} s={[BLOCK, 0.2, 6]} c="#d6c08f" />
        </group>
      )
    case 'aeroport':
      return (
        <group position={[cx, 0.3, cz]}>
          <B p={[0, 0.03, 4]} s={[34, 0.06, 7]} c="#111113" />
          {Array.from({ length: 8 }, (_, i) => (
            <B key={i} p={[-14 + i * 4, 0.08, 4]} s={[2, 0.02, 0.3]} c="#e5e7eb" />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <B key={`l${i}`} p={[-16 + i * 3.5, 0.15, 7.8]} s={[0.25, 0.15, 0.25]} m={glow('#60a5fa', 5)} />
          ))}
          <Cyl p={[12, 6, -10]} s={[2, 12, 2]} c="#9ca3af" />
          <B p={[12, 12.8, -10]} s={[4.5, 2, 4.5]} m={glow('#86efac', 1.2)} />
          <B p={[-6, 3, -11]} s={[18, 6, 9]} m={makeWindowMaterial({ lit: 0.7, color: '#9ca3af', winH: 6, winW: 3, floor: 0.5 })} />
        </group>
      )
    case 'affaires':
      return (
        <group position={[cx, 0.3, cz]}>
          <B p={[0, 0.03, 0]} s={[10, 0.06, 10]} c="#3f3f46" />
          <B p={[0, 1.5, 0]} s={[1.2, 3, 1.2]} m={glow('#c084fc', 2)} />
        </group>
      )
    case 'mairie':
      return (
        <group position={[cx, 0.3, cz]}>
          <B p={[0, 0.02, 4]} s={[16, 0.04, 6]} c="#a8a29e" />
          <B p={[0, 8, 4]} s={[0.15, 16, 0.15]} c="#d4d4d8" />
          <B p={[1.4, 14.8, 4]} s={[2.6, 1.6, 0.05]} c="#1d4ed8" />
        </group>
      )
    default:
      return null
  }
}

export function Districts() {
  const owned = useGame((s) => s.game.districts)
  return (
    <group>
      <Backdrop />
      <Roads />
      <Sea />
      {DISTRICTS.map((d) => {
        const mine = owned.includes(d.id)
        return (
          <group key={d.id}>
            <DistrictGround id={d.id} owned={mine} />
            <group position={[0, 0.3, 0]}>
              <GenericBuildings id={d.id} owned={mine} />
            </group>
            <DistrictDecor id={d.id} />
            <DistrictLabel id={d.id} owned={mine} />
          </group>
        )
      })}
    </group>
  )
}

export const WORLD_SPAN = PITCH * 4
