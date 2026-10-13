import clsx from 'clsx'
import confetti from 'canvas-confetti'
import { motion } from 'motion/react'
import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'
import type { IconType } from 'react-icons'
import {
  GiChart, GiCityCar, GiCog, GiCrownedSkull, GiHandcuffs, GiPistolGun, GiPowderBag, GiSoap, GiTrophy,
  GiUpgrade, GiWalkingBoot,
} from 'react-icons/gi'
import { Toaster, toast } from 'sonner'
import { Achievements, Corruption, Upgrades } from './components/Shops'
import { Businesses } from './components/Businesses'
import { Header } from './components/Header'
import { Heists } from './components/Heists'
import { Laundering } from './components/Laundering'
import { Options } from './components/Options'
import { EventModal, OfflineModal, QteOverlay, RaidOverlay } from './components/Overlays'
import { Prestige } from './components/Prestige'
import { Street } from './components/Street'
import { Territory } from './components/Territory'
import { bus } from './game/bus'
import { ACHIEVEMENT_BY_ID } from './game/data/achievements'
import { HEIST_BY_ID } from './game/data/heists'
import { ROLE_BY_ID } from './game/data/crew'
import { passiveIncome } from './game/economy'
import { money } from './game/num'
import { save, useGame } from './game/store'
import { useHistory } from './ui/history'
import { play, setMuted } from './ui/sound'

// Recharts est lourd : chargé seulement à l'ouverture de l'onglet Stats
const Stats = lazy(() => import('./components/Stats').then((m) => ({ default: m.Stats })))

interface Tab {
  id: string
  label: string
  icon: IconType
  view: ComponentType
}

const TABS: Tab[] = [
  { id: 'terrain', label: 'Terrain', icon: GiWalkingBoot, view: Street },
  { id: 'business', label: 'Business', icon: GiPowderBag, view: Businesses },
  { id: 'blanchiment', label: 'Blanchiment', icon: GiSoap, view: Laundering },
  { id: 'braquages', label: 'Braquages', icon: GiPistolGun, view: Heists },
  { id: 'territoire', label: 'Territoire', icon: GiCityCar, view: Territory },
  { id: 'corruption', label: 'Corruption', icon: GiHandcuffs, view: Corruption },
  { id: 'upgrades', label: 'Améliorations', icon: GiUpgrade, view: Upgrades },
  { id: 'succes', label: 'Succès', icon: GiTrophy, view: Achievements },
  { id: 'stats', label: 'Stats', icon: GiChart, view: Stats },
  { id: 'prestige', label: 'Identité', icon: GiCrownedSkull, view: Prestige },
  { id: 'options', label: 'Options', icon: GiCog, view: Options },
]

/** Boucle de jeu, sauvegarde auto, historique. */
function useGameLoop() {
  useEffect(() => {
    let last = performance.now()
    const loop = setInterval(() => {
      const now = performance.now()
      // dt plafonné : un onglet en arrière-plan est rattrapé au prochain chargement via le hors-ligne
      const dt = Math.min((now - last) / 1000, 60)
      last = now
      useGame.getState().tick(dt)
    }, 100)
    const autosave = setInterval(save, 10000)
    const sample = setInterval(() => {
      const g = useGame.getState().game
      useHistory.getState().push({ t: Date.now(), income: passiveIncome(g).toNumber(), heat: g.heat, cash: g.cash.toNumber() })
    }, 5000)
    const onHide = () => document.visibilityState === 'hidden' && save()
    window.addEventListener('beforeunload', save)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      clearInterval(loop)
      clearInterval(autosave)
      clearInterval(sample)
      window.removeEventListener('beforeunload', save)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])
}

/** Réactions de l'UI aux événements du moteur. */
function useGameEvents() {
  useEffect(() => {
    setMuted(useGame.getState().game.muted)
    const handler = (e: import('./game/types').GameEvent) => {
      switch (e.type) {
        case 'raidStart':
          play('siren')
          break
        case 'raid':
          play('fail')
          toast.error(`Descente terminée : ${money(e.lost)} saisis. Tu en as planqué ${Math.round(e.saved * 100)} %.`)
          break
        case 'heistDone': {
          const h = HEIST_BY_ID[e.id]
          if (e.success) {
            play('success')
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 }, colors: ['#22c55e', '#f59e0b', '#ffffff'] })
            toast.success(`${h.name} : réussi ! +${money(e.reward)} · +${e.respect} respect`)
          } else {
            play('fail')
            toast.error(`${h.name} : raté.${e.arrested ? ` Ton ${ROLE_BY_ID[e.arrested].name.toLowerCase()} s’est fait serrer (−1 niveau).` : ''}`)
          }
          break
        }
        case 'qte':
          play('alert')
          break
        case 'achievement': {
          const a = ACHIEVEMENT_BY_ID[e.id]
          play('unlock')
          toast(`🏆 Succès : ${a.name}`, { description: a.desc })
          break
        }
        case 'event':
          play('alert')
          break
        case 'order':
          play('alert')
          toast(`📱 ${e.client} a passé commande`, { description: 'Onglet Terrain' })
          break
        case 'orderExpired':
          toast(`${e.client} a trouvé un autre fournisseur.`)
          break
      }
    }
    bus.on('game', handler)
    return () => bus.off('game', handler)
  }, [])
}

function useBadges(): Record<string, boolean> {
  const g = useGame((s) => s.game)
  return {
    terrain: g.orders.some((o) => o.delivering === null || o.delivering === 0) || g.safeCooldown <= 0,
    braquages: !!g.heist,
    business: Object.values(g.businesses).some((b) => b.level > 0 && !b.manager && !b.running),
  }
}

export default function App() {
  useGameLoop()
  useGameEvents()
  const [tab, setTab] = useState('terrain')
  const badges = useBadges()
  const View = TABS.find((t) => t.id === tab)!.view

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <Header />
      <div className="mx-auto flex max-w-6xl gap-4 px-3 pt-3">
        <nav className="sticky top-32 hidden h-fit w-44 shrink-0 flex-col gap-1 md:flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'relative flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition',
                tab === t.id ? 'bg-money/15 text-money' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200',
              )}
            >
              <t.icon size={20} />
              {t.label}
              {badges[t.id] && <span className="ml-auto size-2 rounded-full bg-respect" />}
            </button>
          ))}
        </nav>
        <main className="min-w-0 flex-1">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <Suspense fallback={<div className="p-6 text-zinc-500">Chargement…</div>}>
              <View />
            </Suspense>
          </motion.div>
        </main>
      </div>

      <nav className="scrollbar-thin fixed inset-x-0 bottom-0 z-30 flex gap-1 overflow-x-auto border-t border-line bg-ink/95 px-2 py-1.5 backdrop-blur md:hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'relative flex min-w-16 flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px]',
              tab === t.id ? 'bg-money/15 text-money' : 'text-zinc-400',
            )}
          >
            <t.icon size={22} />
            {t.label}
            {badges[t.id] && <span className="absolute right-2 top-1 size-2 rounded-full bg-respect" />}
          </button>
        ))}
      </nav>

      <RaidOverlay />
      <QteOverlay />
      <EventModal />
      <OfflineModal />
      <Toaster theme="dark" position="bottom-right" richColors closeButton visibleToasts={4} mobileOffset={{ bottom: 80 }} toastOptions={{ duration: 3500 }} />
    </div>
  )
}
