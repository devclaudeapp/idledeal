import { CameraControls, PerformanceMonitor, Stars } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { bus } from '../game/bus'
import type { GameEvent } from '../game/types'
import { useUi, type Quality } from '../ui/uiStore'
import { Actors } from './Actors'
import { Districts } from './Districts'
import { Effects, useFx } from './fx'
import { Landmarks } from './Landmarks'
import { districtCenter, slotPos } from './layout'

const HOME = { pos: new THREE.Vector3(0, 140, 175), target: new THREE.Vector3(0, 0, 6) }

/** Déplace la caméra vers l'élément ciblé (clic dans la ville ou dans l'interface). */
function CameraRig() {
  const ref = useRef<CameraControls>(null)
  const focus = useUi((s) => s.focus)
  const homeTick = useUi((s) => s.homeTick)
  const panelOpen = useUi((s) => s.panelOpen)
  const size = useThree((s) => s.size)
  const intro = useRef(true)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    if (intro.current) {
      // arrivée en survol depuis le ciel
      intro.current = false
      c.setLookAt(HOME.pos.x, HOME.pos.y + 120, HOME.pos.z + 160, HOME.target.x, 0, HOME.target.z, false)
    }
    // Sur grand écran, le panneau couvre la droite : on recule et on décale la vue pour centrer la ville à gauche
    const shifted = panelOpen && size.width >= 768
    let dist: number
    if (!focus) {
      const k = shifted ? 1.55 : 1
      const p = HOME.pos.clone().sub(HOME.target).multiplyScalar(k).add(HOME.target)
      void c.setLookAt(p.x, p.y, p.z, HOME.target.x, HOME.target.y, HOME.target.z, true)
      dist = HOME.pos.distanceTo(HOME.target) * k
    } else {
      const [x, z] = focus.startsWith('district:') ? districtCenter(focus.slice(9)) : slotPos(focus)
      const far = focus.startsWith('district:') ? 2.1 : 1.1
      void c.setLookAt(x + 28 * far, 38 * far, z + 46 * far, x, 4, z, true)
      dist = Math.hypot(28, 34, 46) * far
    }
    void c.setFocalOffset(shifted ? dist * 0.15 : 0, shifted ? -dist * 0.1 : 0, 0, true)
  }, [focus, homeTick, panelOpen, size.width])
  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={18}
      maxDistance={320}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2.25}
      smoothTime={0.6}
      draggingSmoothTime={0.15}
    />
  )
}

/** Tremblement de caméra pendant une descente, gerbes de billets sur les coups réussis. */
function GameReactions() {
  const shake = useRef(0)
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    const handler = (e: GameEvent) => {
      if (e.type === 'raidStart') shake.current = 5
      if (e.type === 'heistDone' && e.success) {
        const [x, z] = slotPos('hq')
        useFx.getState().burst({ x, y: 30, z, color: '#4ade80', count: 60 })
      }
      if (e.type === 'achievement') {
        const [x, z] = slotPos('hq')
        useFx.getState().popup({ x, y: 40, z, text: 'SUCCÈS !', color: '#fbbf24', size: 3 })
      }
    }
    bus.on('game', handler)
    return () => bus.off('game', handler)
  }, [])
  useFrame((_, dt) => {
    if (shake.current <= 0) return
    shake.current = Math.max(0, shake.current - dt)
    const k = Math.min(1, shake.current) * 0.5
    camera.position.x += (Math.random() - 0.5) * k
    camera.position.y += (Math.random() - 0.5) * k
  })
  return null
}

function Lights({ quality }: { quality: Quality }) {
  const shadows = quality === 'high'
  return (
    <>
      <hemisphereLight args={['#5b6b9a', '#1a1410', 0.55]} />
      <ambientLight intensity={0.15} />
      <directionalLight
        position={[-90, 140, 70]}
        intensity={1.1}
        color="#a9bcff"
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-130}
        shadow-camera-right={130}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-camera-far={400}
        shadow-bias={-0.0005}
      />
      {/* halo chaud du centre-ville */}
      <pointLight position={[0, 25, 0]} intensity={900} distance={160} color="#ffb366" />
      <mesh position={[-180, 160, -320]}>
        <sphereGeometry args={[14, 24, 16]} />
        <meshBasicMaterial color="#e8eeff" toneMapped={false} />
      </mesh>
    </>
  )
}

function Post({ quality }: { quality: Quality }) {
  if (quality === 'low') return null
  return (
    <EffectComposer multisampling={quality === 'high' ? 4 : 0}>
      <Bloom mipmapBlur intensity={quality === 'high' ? 1.1 : 0.9} luminanceThreshold={1} luminanceSmoothing={0.2} />
      <Vignette offset={0.25} darkness={0.75} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}

export default function City() {
  const quality = useUi((s) => s.quality)
  const [dprCap, setDprCap] = useState(quality === 'high' ? 2 : quality === 'medium' ? 1.5 : 1)
  useEffect(() => setDprCap(quality === 'high' ? 2 : quality === 'medium' ? 1.5 : 1), [quality])
  return (
    <Canvas
      shadows={quality === 'high'}
      dpr={[1, dprCap]}
      camera={{ fov: 40, near: 1, far: 1200, position: [10, 115, 150] }}
      gl={{ antialias: quality !== 'medium', powerPreference: 'high-performance' }}
      onPointerMissed={() => useUi.getState().setFocus(null)}
    >
      <color attach="background" args={['#070912']} />
      <fog attach="fog" args={['#0a0d18', 160, 520]} />
      <PerformanceMonitor onDecline={() => setDprCap((d) => Math.max(0.75, d - 0.25))} />
      <Stars radius={400} depth={60} count={2500} factor={6} fade speed={0.5} />
      <Lights quality={quality} />
      <Districts />
      <Landmarks />
      <Actors />
      <Effects />
      <CameraRig />
      <GameReactions />
      <Post quality={quality} />
    </Canvas>
  )
}
