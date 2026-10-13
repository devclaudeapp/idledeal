import { Billboard, Text } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { streetClick } from '../game/actions'
import { BUSINESS_BY_ID } from '../game/data/businesses'
import { FRONT_BY_ID } from '../game/data/fronts'
import { HEIST_BY_ID } from '../game/data/heists'
import { globalMult, isBusinessUnlocked, revenuePerCycle } from '../game/economy'
import { money } from '../game/num'
import { act, useGame } from '../game/store'
import { play } from '../ui/sound'
import { useUi } from '../ui/uiStore'
import { FONT } from './Districts'
import { PulseRing, useFx } from './fx'
import { slotPos } from './layout'
import { glow, makeWindowMaterial, solid } from './materials'
import { B, Car, Container, CONTAINER_COLORS, Crane, Cyl, NeonSign, Person, Plane, Scooter, Boat, Ship } from './props'

/** Nombre d'étages / d'éléments en fonction du niveau (croissance logarithmique). */
const tier = (level: number, max: number) => (level <= 0 ? 0 : Math.min(max, 1 + Math.floor(Math.log2(level))))

const baseBox = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)

/** Bâtiment avec fenêtres, origine à la base. */
function Building({ p, s, color, lit = 0.5, winColor, mat }: { p: [number, number, number]; s: [number, number, number]; color?: string; lit?: number; winColor?: string; mat?: THREE.Material }) {
  const m = useMemo(() => mat ?? makeWindowMaterial({ lit, color, winColor }), [mat, lit, color, winColor])
  return <mesh geometry={baseBox} material={m} position={p} scale={s} castShadow />
}

const ghostMat = new THREE.MeshBasicMaterial({ color: '#22c55e', wireframe: true, transparent: true, opacity: 0.25 })

interface LandmarkProps {
  slot: string
  tab: string
  label: string
  sub?: string
  height?: number
  onClick?: () => void
  highlight?: string | null
  children: ReactNode
}

/** Enveloppe commune : position, survol, clic, étiquette. */
function Landmark({ slot, tab, label, sub, height = 10, onClick, highlight, children }: LandmarkProps) {
  const [x, z] = slotPos(slot)
  const [hover, setHover] = useState(false)
  const setTab = useUi((s) => s.setTab)
  const setFocus = useUi((s) => s.setFocus)
  const focused = useUi((s) => s.focus === slot)
  return (
    <group
      position={[x, 0.3, z]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        if (onClick) return onClick()
        setTab(tab)
        setFocus(slot)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHover(false)
        document.body.style.cursor = ''
      }}
    >
      {children}
      {(hover || focused) && (
        <Billboard position={[0, height + 3, 0]}>
          <Text font={FONT} fontSize={2.4} color="#ffffff" outlineWidth={0.15} outlineColor="#000" anchorX="center" anchorY="bottom">
            {label}
          </Text>
          {sub && (
            <Text font={FONT} fontSize={1.6} position={[0, -0.3, 0]} color="#22c55e" outlineWidth={0.12} outlineColor="#000" anchorX="center" anchorY="top">
              {sub}
            </Text>
          )}
        </Billboard>
      )}
      {highlight && <PulseRing p={[0, 0.1, 0]} color={highlight} r={7} />}
    </group>
  )
}

/** Fait apparaître « +X € » au-dessus d'un business à chaque cycle terminé (limité en fréquence). */
function useIncomePopups(id: string, slot: string, height: number) {
  const lastProgress = useRef(0)
  const lastPopup = useRef(0)
  useFrame(({ clock }) => {
    const g = useGame.getState().game
    const b = g.businesses[id]
    if (!b || b.level <= 0) return
    const wrapped = b.progress < lastProgress.current - 0.05 || (!b.running && lastProgress.current > 0 && b.progress === 0)
    lastProgress.current = b.progress
    if (!wrapped) return
    const t = clock.elapsedTime
    if (t - lastPopup.current < 1.2) return
    lastPopup.current = t
    const [x, z] = slotPos(slot)
    useFx.getState().popup({ x, y: height + 2, z, text: `+${money(revenuePerCycle(g, id, globalMult(g)), 1)}`, color: '#4ade80' })
  })
}

function useBiz(id: string) {
  const level = useGame((s) => s.game.businesses[id]?.level ?? 0)
  const manager = useGame((s) => s.game.businesses[id]?.manager ?? false)
  const unlocked = useGame((s) => isBusinessUnlocked(s.game, BUSINESS_BY_ID[id]))
  return { level, manager, unlocked }
}

function BizLandmark({ id, height, children, onClick }: { id: string; height: number; children: (level: number, manager: boolean) => ReactNode; onClick?: () => void }) {
  const { level, manager, unlocked } = useBiz(id)
  const slot = `biz:${id}`
  useIncomePopups(id, slot, height)
  if (!unlocked) return null
  const def = BUSINESS_BY_ID[id]
  return (
    <Landmark slot={slot} tab="business" label={def.name} sub={level > 0 ? `niv. ${level}${manager ? ' · ' + def.managerName : ''}` : 'À acheter'} height={height} onClick={onClick}>
      {level > 0 ? children(level, manager) : <mesh geometry={baseBox} material={ghostMat} scale={[8, 6, 8]} />}
    </Landmark>
  )
}

const HOODIES = ['#111827', '#374151', '#7f1d1d', '#1e3a8a', '#064e3b', '#3f3f46']

function Deal() {
  const charbonner = () => {
    const gain = act(streetClick)
    if (gain.lte(0)) return
    play('click')
    const [x, z] = slotPos('biz:deal')
    useFx.getState().popup({ x: x + (Math.random() - 0.5) * 3, y: 4, z, text: `+${money(gain, 1)}`, color: '#86efac', size: 1.8 })
  }
  return (
    <BizLandmark id="deal" height={6} onClick={charbonner}>
      {(level, manager) => {
        const n = tier(level, 6)
        return (
          <group>
            <B p={[0, 0.25, 0]} s={[8, 0.5, 8]} c="#3f3f46" />
            <B p={[-2.5, 0.8, -2.5]} s={[3, 0.6, 0.8]} c="#57534e" />
            <Cyl p={[2.5, 0.9, 2.5]} s={[1.5, 1.2, 1.5]} c="#52525b" />
            {Array.from({ length: n }, (_, i) => {
              const a = (i / n) * Math.PI * 2
              return <Person key={i} p={[Math.cos(a) * 2.2, 0.5, Math.sin(a) * 2.2]} color={HOODIES[i % HOODIES.length]} rotY={-a} />
            })}
            {manager && <Person p={[0, 0.5, 0]} color="#16a34a" scale={1.1} />}
            <B p={[0, 4.2, 0]} s={[0.5, 0.5, 0.5]} m={glow('#22c55e', 4)} />
          </group>
        )
      }}
    </BizLandmark>
  )
}

function ScooterGarage() {
  return (
    <BizLandmark id="scooter" height={6}>
      {(level) => {
        const n = tier(level, 8)
        return (
          <group>
            <Building p={[0, 0, -2]} s={[9, 4 + tier(level, 6), 4]} color="#6b7280" lit={0.6} />
            <B p={[0, 1.5, 0.05]} s={[5, 2.8, 0.1]} m={glow('#f97316', 1.2)} />
            {Array.from({ length: n }, (_, i) => (
              <group key={i} position={[-3.5 + i * 1, 0, 2.5]}>
                <Scooter color={['#f59e0b', '#ef4444', '#3b82f6', '#a3a3a3'][i % 4]} />
              </group>
            ))}
          </group>
        )
      }}
    </BizLandmark>
  )
}

const SHOP_NEONS = ['#f472b6', '#facc15', '#38bdf8', '#a3e635', '#fb923c']

function Racket() {
  return (
    <BizLandmark id="racket" height={7}>
      {(level, manager) => {
        const n = tier(level, 5)
        return (
          <group>
            {Array.from({ length: n }, (_, i) => (
              <group key={i} position={[-4 + (i % 3) * 4, 0, i < 3 ? -2 : 3]}>
                <Building p={[0, 0, 0]} s={[3.6, 4, 3.6]} color="#a8a29e" lit={0.7} />
                <NeonSign p={[0, 3.2, 1.9]} w={2.6} color={SHOP_NEONS[i]} h={0.5} />
              </group>
            ))}
            <Person p={[0, 0.3, 5.5]} color="#1f2937" scale={1.4} />
            {manager && <Person p={[1.5, 0.3, 5.5]} color="#16a34a" scale={1.6} />}
          </group>
        )
      }}
    </BizLandmark>
  )
}

function Paris() {
  return (
    <BizLandmark id="paris" height={8}>
      {(level) => (
        <group>
          <Building p={[0, 0, -2]} s={[8, 4 + tier(level, 6), 5]} color="#78716c" lit={0.8} />
          <NeonSign p={[0, 3.6, 0.55]} w={5} color="#22c55e" />
          <mesh position={[0, 0.06, 4]} rotation={[-Math.PI / 2, 0, 0]} material={solid('#a16207')}>
            <ringGeometry args={[1.6, 3, 32]} />
          </mesh>
        </group>
      )}
    </BizLandmark>
  )
}

function Smoke({ p, color = '#9ca3af', count = 6 }: { p: [number, number, number]; color?: string; count?: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.35, depthWrite: false }), [color])
  useFrame(({ clock }) => {
    refs.current.forEach((m, i) => {
      if (!m) return
      const t = (clock.elapsedTime * 0.35 + i / count) % 1
      m.position.set(Math.sin(i * 3 + t * 2) * 0.8, t * 10, Math.cos(i * 5) * 0.6)
      m.scale.setScalar(0.8 + t * 3)
    })
    mat.opacity = 0.3
  })
  return (
    <group position={p}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} ref={(el) => void (refs.current[i] = el)} material={mat}>
          <icosahedronGeometry args={[0.6, 0]} />
        </mesh>
      ))}
    </group>
  )
}

function Labo() {
  const mat = useMemo(() => makeWindowMaterial({ lit: 0.9, color: '#57534e', winColor: '#4ade80', winColor2: '#a3e635', intensity: 3, floor: 0.8 }), [])
  return (
    <BizLandmark id="labo" height={10}>
      {(level) => {
        const len = 8 + tier(level, 6) * 2
        return (
          <group>
            <Building p={[0, 0, 0]} s={[12, 6, len]} mat={mat} />
            <Cyl p={[4, 8, -len / 2 + 2]} s={[1, 6, 1]} c="#44403c" />
            <Smoke p={[4, 11, -len / 2 + 2]} color="#86efac" />
            <group position={[-8, 0, len / 2 - 2]}>
              <Car color="#e5e7eb" scale={1.1}>
                <B p={[0, 1.6, -0.5]} s={[1.8, 1.6, 3]} c="#e5e7eb" />
              </Car>
            </group>
          </group>
        )
      }}
    </BizLandmark>
  )
}

function Contrebande() {
  return (
    <BizLandmark id="contrebande" height={12}>
      {(level) => {
        const n = Math.min(24, 2 + tier(level, 12) * 2)
        return (
          <group>
            {Array.from({ length: n }, (_, i) => (
              <Container key={i} p={[-9 + (i % 6) * 3.2, 1.6 + Math.floor(i / 12) * 2.6, (Math.floor(i / 6) % 2) * 7 - 3]} c={CONTAINER_COLORS[i % CONTAINER_COLORS.length]} />
            ))}
            <Crane p={[0, 0, 10]} />
          </group>
        )
      }}
    </BizLandmark>
  )
}

function FlyingBills({ p }: { p: [number, number, number] }) {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#86efac', emissive: '#22c55e', emissiveIntensity: 1.5, side: THREE.DoubleSide }), [])
  useFrame(({ clock }) => {
    refs.current.forEach((m, i) => {
      if (!m) return
      const t = clock.elapsedTime + i * 0.7
      m.position.set(Math.sin(t * 0.9 + i) * 3, 2 + ((t * 0.8) % 6), Math.cos(t * 0.7 + i) * 3)
      m.rotation.set(t * 2, t * 3, 0)
    })
  })
  return (
    <group position={p}>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} ref={(el) => void (refs.current[i] = el)} material={mat}>
          <planeGeometry args={[0.9, 0.45]} />
        </mesh>
      ))}
    </group>
  )
}

function FauxBillets() {
  const mat = useMemo(() => makeWindowMaterial({ lit: 0.85, color: '#a8a29e', winColor: '#4ade80', winColor2: '#86efac', intensity: 2.6 }), [])
  return (
    <BizLandmark id="fauxbillets" height={16}>
      {(level) => (
        <group>
          <Building p={[0, 0, 0]} s={[8, 8 + tier(level, 6) * 1.5, 8]} mat={mat} />
          <NeonSign p={[0, 3, 4.1]} w={4} color="#22c55e" h={0.6} />
          <FlyingBills p={[0, 0, 6]} />
        </group>
      )}
    </BizLandmark>
  )
}

function CasinoBiz() {
  const stripes = useRef<THREE.MeshStandardMaterial[]>([])
  const mats = useMemo(() => Array.from({ length: 6 }, () => new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ff00aa', emissiveIntensity: 4, toneMapped: false })), [])
  stripes.current = mats
  useFrame(({ clock }) => {
    mats.forEach((m, i) => m.emissive.setHSL((clock.elapsedTime * 0.15 + i * 0.12) % 1, 1, 0.5))
  })
  return (
    <BizLandmark id="casino" height={20}>
      {(level) => {
        const h = 10 + tier(level, 6) * 2
        return (
          <group>
            <Building p={[0, 0, 0]} s={[12, h, 10]} color="#1f1f2b" lit={0.3} winColor="#f0abfc" />
            {mats.map((m, i) => (
              <mesh key={i} geometry={baseBox} material={m} position={[0, (h / 7) * (i + 1), 5.05]} scale={[12.2, 0.25, 0.1]} />
            ))}
            <NeonSign p={[0, h + 1.5, 0]} w={8} color="#facc15" h={1.6} />
          </group>
        )
      }}
    </BizLandmark>
  )
}

function Cartel() {
  const plane = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const g = plane.current
    if (!g) return
    // cycle : roulage → décollage → boucle → atterrissage
    const t = (clock.elapsedTime % 40) / 40
    if (t < 0.15) {
      g.position.set(-16 + (t / 0.15) * 30, 0, 4)
      g.rotation.set(0, Math.PI / 2, 0)
    } else if (t < 0.85) {
      const a = ((t - 0.15) / 0.7) * Math.PI * 2
      g.position.set(14 + Math.sin(a) * 60, 6 + Math.sin(a / 2) * 40, 4 - (1 - Math.cos(a)) * 60)
      g.rotation.set(-0.1, Math.PI / 2 + a, Math.sin(a) * 0.3)
    } else {
      const u = (t - 0.85) / 0.15
      g.position.set(14 - u * 30, Math.max(0, 6 - u * 10), 4)
      g.rotation.set(0, -Math.PI / 2, 0)
    }
  })
  return (
    <BizLandmark id="cartel" height={12}>
      {(level) => (
        <group>
          <Plane ref={plane} scale={0.8} />
          {Array.from({ length: Math.min(3, tier(level, 3)) }, (_, i) => (
            <group key={i} position={[-12 + i * 9, 0, -4]} rotation={[0, Math.PI, 0]}>
              <Plane color="#111827" scale={0.45} />
            </group>
          ))}
        </group>
      )}
    </BizLandmark>
  )
}

function Ransomware() {
  const mat = useMemo(() => makeWindowMaterial({ lit: 0.6, color: '#0f172a', winColor: '#22d3ee', winColor2: '#e879f9', intensity: 3, winW: 1, winH: 1.2, metalness: 0.6, roughness: 0.3 }), [])
  useFrame(({ clock }) => {
    mat.userData.uniforms.uLit.value = 0.45 + Math.sin(clock.elapsedTime * 7) * 0.15
  })
  return (
    <BizLandmark id="ransomware" height={30}>
      {(level) => (
        <group>
          <Building p={[0, 0, 0]} s={[7, 16 + tier(level, 6) * 3, 7]} mat={mat} />
          <B p={[0, 0.5, 5]} s={[9, 1, 0.4]} m={glow('#22d3ee', 2)} />
        </group>
      )}
    </BizLandmark>
  )
}

function Front({ id, children, height = 6 }: { id: string; children: ReactNode; height?: number }) {
  const lvl = useGame((s) => s.game.fronts[id] ?? 0)
  if (lvl <= 0) return null
  return (
    <Landmark slot={`front:${id}`} tab="blanchiment" label={FRONT_BY_ID[id].name} sub={`niv. ${lvl}`} height={height}>
      {children}
    </Landmark>
  )
}

function Fronts() {
  return (
    <>
      <Front id="laverie">
        <Building p={[0, 0, 0]} s={[5, 3.5, 4]} color="#d4d4d8" lit={0.9} winColor="#bae6fd" />
        <NeonSign p={[0, 3, 2.05]} w={3.6} color="#38bdf8" h={0.5} />
      </Front>
      <Front id="kebab">
        <Building p={[0, 0, 0]} s={[4.5, 3.5, 4]} color="#a8a29e" lit={0.9} />
        <NeonSign p={[0, 3, 2.05]} w={3.4} color="#f97316" h={0.5} />
      </Front>
      <Front id="carwash">
        <B p={[0, 3.2, 0]} s={[8, 0.4, 6]} c="#e5e7eb" />
        {[-3.6, 3.6].map((x) => (
          <B key={x} p={[x, 1.6, 0]} s={[0.4, 3.2, 6]} c="#9ca3af" />
        ))}
        <B p={[0, 3.45, 3.05]} s={[6, 0.4, 0.1]} m={glow('#38bdf8', 3)} />
      </Front>
      <Front id="onglerie">
        <Building p={[0, 0, 0]} s={[5, 4, 5]} color="#e7e5e4" lit={0.9} winColor="#f9a8d4" />
        <NeonSign p={[0, 3.4, 2.55]} w={3.6} color="#f472b6" h={0.5} />
      </Front>
      <Front id="boite" height={10}>
        <Building p={[0, 0, 0]} s={[9, 6, 8]} color="#18181b" lit={0.15} />
        <NeonSign p={[0, 5, 4.05]} w={6} color="#a855f7" h={0.9} />
        <Beams />
      </Front>
      <Front id="immo" height={14}>
        <Building p={[0, 0, 0]} s={[6, 12, 6]} color="#94a3b8" lit={0.7} />
      </Front>
      <Front id="offshore">
        <Boat p={[0, 0, 0]} s={1.2} rotY={0.4} />
      </Front>
      <Front id="mixer" height={8}>
        <B p={[0, 2.5, 0]} s={[5, 5, 5]} c="#0f172a" />
        <B p={[0, 2.5, 2.55]} s={[4, 4, 0.1]} m={glow('#22d3ee', 1.5)} />
      </Front>
    </>
  )
}

function Beams() {
  const ref = useRef<THREE.Group>(null)
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#c084fc', transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false }),
    [],
  )
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.8
  })
  return (
    <group ref={ref} position={[0, 6, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} material={mat} rotation={[0.35, (i * Math.PI * 2) / 3, 0]} position={[0, 20, 0]}>
          <cylinderGeometry args={[0.3, 2.5, 40, 8, 1, true]} />
        </mesh>
      ))}
    </group>
  )
}

/** Cibles de braquage (toujours présentes dans la ville). */
function HeistTarget({ id, height, children }: { id: string; height: number; children: ReactNode }) {
  const active = useGame((s) => s.game.heist?.id === id)
  return (
    <Landmark slot={`heist:${id}`} tab="braquages" label={HEIST_BY_ID[id].name} sub={active ? 'Braquage en cours !' : 'Cible'} height={height} highlight={active ? '#f59e0b' : null}>
      {children}
    </Landmark>
  )
}

function HeistTargets() {
  return (
    <>
      <HeistTarget id="superette" height={5}>
        <Building p={[0, 0, 0]} s={[5, 3.5, 5]} color="#e5e7eb" lit={1} winColor="#f8fafc" />
        <NeonSign p={[0, 3.2, 2.55]} w={3} color="#4ade80" h={0.5} />
      </HeistTarget>
      <HeistTarget id="station" height={6}>
        <B p={[0, 4, 0]} s={[9, 0.5, 6]} c="#f8fafc" />
        <B p={[0, 4.3, 3.05]} s={[9, 0.6, 0.1]} m={glow('#ef4444', 3)} />
        {[-3, 0, 3].map((x) => (
          <B key={x} p={[x, 0.9, 0]} s={[0.8, 1.8, 0.6]} c="#dc2626" />
        ))}
        {[-4, 4].map((x) => (
          <B key={`p${x}`} p={[x, 2, 0]} s={[0.4, 4, 0.4]} c="#9ca3af" />
        ))}
      </HeistTarget>
      <HeistTarget id="bijouterie" height={8}>
        <Building p={[0, 0, 0]} s={[6, 6, 5]} color="#1c1917" lit={0.9} winColor="#fde68a" />
        <NeonSign p={[0, 4.5, 2.55]} w={4} color="#fbbf24" h={0.6} />
      </HeistTarget>
      <HeistTarget id="banque" height={14}>
        <Building p={[0, 0, 0]} s={[12, 10, 9]} color="#d6d3d1" lit={0.5} />
        {[-4.5, -1.5, 1.5, 4.5].map((x) => (
          <Cyl key={x} p={[x, 3, 4.8]} s={[0.9, 6, 0.9]} c="#e7e5e4" />
        ))}
        <B p={[0, 6.4, 4.8]} s={[12, 0.8, 1.6]} c="#e7e5e4" />
      </HeistTarget>
      <HeistTarget id="casino" height={26}>
        <Building p={[0, 0, 0]} s={[12, 22, 11]} color="#3b0764" lit={0.6} winColor="#fcd34d" />
        <NeonSign p={[0, 23.5, 0]} w={10} color="#fbbf24" h={2} />
      </HeistTarget>
      <HeistTarget id="reserve" height={10}>
        <Building p={[0, 0, 0]} s={[12, 7, 9]} color="#6b7280" lit={0.15} />
        <Cyl p={[0, 3, 4.6]} s={[4, 0.4, 4]} c="#9ca3af" rot={[Math.PI / 2, 0, 0]} />
      </HeistTarget>
      <HeistTarget id="fourgon" height={4}>
        <group rotation={[0, Math.PI / 2, 0]}>
          <Car color="#9ca3af" scale={1.3}>
            <B p={[0, 1.4, -0.4]} s={[1.8, 1.4, 3]} c="#6b7280" />
          </Car>
        </group>
      </HeistTarget>
    </>
  )
}

/** Le QG du joueur : grandit avec les quartiers contrôlés. */
function Headquarters() {
  const districts = useGame((s) => s.game.districts.length)
  const legend = useGame((s) => s.game.legend.gt(0))
  const raid = useGame((s) => !!s.game.raid)
  const mat = useMemo(() => makeWindowMaterial({ lit: 0.6, color: '#57534e', winColor: '#fde68a' }), [])
  const h = 16 + districts * 4
  return (
    <Landmark slot="hq" tab="terrain" label="Ton QG" sub={`${districts} quartier${districts > 1 ? 's' : ''}`} height={h + 4} highlight={raid ? '#ef4444' : null}>
      <Building p={[0, 0, 0]} s={[9, h, 9]} mat={mat} />
      <B p={[0, h + 0.6, 0]} s={[6, 1.2, 6]} c="#1c1917" />
      <NeonSign p={[0, h + 2.4, 0]} w={5} color={legend ? '#c084fc' : '#22c55e'} h={1.2} />
      <NeonSign p={[0, h + 2.4, 0]} w={5} color={legend ? '#c084fc' : '#22c55e'} h={1.2} rotY={Math.PI} />
    </Landmark>
  )
}

function CityHall() {
  const owned = useGame((s) => s.game.districts.includes('mairie'))
  return (
    <Landmark slot="mairie" tab="territoire" label="Hôtel de ville" sub={owned ? 'À toi' : 'Pas encore à toi'} height={20}>
      <Building p={[0, 0, 0]} s={[18, 9, 10]} color="#e7e5e4" lit={owned ? 0.9 : 0.2} />
      {[-7, -4, -1, 2, 5, 8].map((x) => (
        <Cyl key={x} p={[x - 0.5, 4, 5.4]} s={[0.8, 8, 0.8]} c="#f5f5f4" />
      ))}
      <mesh position={[0, 11, 0]} material={owned ? glow('#fbbf24', 1.2) : solid('#a8a29e')}>
        <sphereGeometry args={[4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </Landmark>
  )
}

function DocksShip() {
  const owned = useGame((s) => s.game.districts.includes('docks'))
  const [x, z] = slotPos('biz:contrebande')
  return owned ? <Ship p={[x + 30, -0.5, z + 34]} rotY={Math.PI / 2} /> : null
}

export function Landmarks() {
  return (
    <group>
      <Headquarters />
      <CityHall />
      <Deal />
      <ScooterGarage />
      <Racket />
      <Paris />
      <Labo />
      <Contrebande />
      <FauxBillets />
      <CasinoBiz />
      <Cartel />
      <Ransomware />
      <Fronts />
      <HeistTargets />
      <DocksShip />
    </group>
  )
}
