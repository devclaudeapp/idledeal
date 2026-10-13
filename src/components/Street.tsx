import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { GiLockPicking, GiPowderBag, GiSmartphone, GiScooter } from 'react-icons/gi'
import { acceptOrder, claimOrder, crackSafe, streetClick } from '../game/actions'
import { clickValue, comboMult, referenceIncome, safeReward, upgradeMult } from '../game/economy'
import { Decimal, money } from '../game/num'
import { act, useGame } from '../game/store'
import { play } from '../ui/sound'
import { toast } from 'sonner'
import { Bar, Btn, Card, SectionTitle } from './ui'

interface Floater {
  id: number
  x: number
  y: number
  text: string
}

let floaterId = 0

function Clicker() {
  const combo = useGame((s) => s.game.combo)
  const comboTimer = useGame((s) => s.game.comboTimer)
  const value = clickValue(useGame((s) => s.game))
  const [floaters, setFloaters] = useState<Floater[]>([])

  const onClick = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const gain = act(streetClick)
    if (gain.lte(0)) return
    play('click')
    const f = { id: ++floaterId, x: e.clientX - rect.left, y: e.clientY - rect.top, text: `+${money(gain, 1)}` }
    setFloaters((fs) => [...fs.slice(-14), f])
    setTimeout(() => setFloaters((fs) => fs.filter((x) => x.id !== f.id)), 900)
  }

  return (
    <Card className="flex flex-col items-center gap-3">
      <div className="text-center">
        <div className="font-display text-2xl tracking-wide">Charbonner</div>
        <div className="text-xs text-zinc-400">Vends toi-même au pied de la tour. Clique vite pour monter le combo.</div>
      </div>
      <button
        onPointerDown={onClick}
        className="relative grid size-40 place-items-center rounded-full border-4 border-money/50 bg-gradient-to-b from-money/30 to-money/5 text-money shadow-[0_0_40px_rgba(34,197,94,0.25)] transition active:scale-95"
        aria-label="Charbonner"
      >
        <GiPowderBag size={72} />
        <AnimatePresence>
          {floaters.map((f) => (
            <motion.span
              key={f.id}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -70 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9 }}
              className="pointer-events-none absolute whitespace-nowrap text-sm font-bold text-money drop-shadow"
              style={{ left: f.x - 30, top: f.y - 20 }}
            >
              {f.text}
            </motion.span>
          ))}
        </AnimatePresence>
      </button>
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">
            {money(value, 1)} / clic
          </span>
          <span className={clsx('font-bold tabular-nums', combo >= 25 ? 'text-orange-400' : 'text-zinc-300')}>
            Combo {combo} · ×{comboMult(combo).toFixed(2)}
          </span>
        </div>
        <Bar value={combo / 50} color={combo >= 25 ? 'bg-orange-500' : 'bg-money'} className="mt-1" />
        <Bar value={comboTimer / 1.2} color="bg-zinc-500" className="mt-1 h-1" />
      </div>
    </Card>
  )
}

function Orders() {
  const orders = useGame((s) => s.game.orders)
  const next = useGame((s) => s.game.nextOrderIn)
  const g = useGame((s) => s.game)
  const ref = referenceIncome(g).mul(upgradeMult(g, 'orders'))
  const busy = orders.some((o) => o.delivering !== null && o.delivering > 0)

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GiSmartphone className="text-clean" size={22} />
          <span className="font-display text-2xl tracking-wide">Commandes</span>
        </div>
        <span className="text-xs text-zinc-500">prochain appel ~{Math.max(0, Math.ceil(next))}s</span>
      </div>
      {orders.length === 0 && <p className="py-6 text-center text-sm text-zinc-500">Le téléphone jetable est silencieux… pour l’instant.</p>}
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {orders.map((o) => {
            const reward = Decimal.max(50, ref.mul(o.rewardSec))
            const done = o.delivering === 0
            return (
              <motion.div
                key={o.uid}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="rounded-lg border border-line bg-panel-2 p-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 text-sm">
                    <span className="font-semibold text-zinc-100">{o.client}</span>
                    <span className="text-zinc-400"> veut {o.goods} {o.place}.</span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-money">{money(reward, 1)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {o.delivering === null && (
                    <>
                      <Bar value={o.expiresIn / 35} color="bg-orange-500" className="h-1.5" />
                      <Btn tone="clean" disabled={busy} onClick={() => play(act((s) => acceptOrder(s, o.uid)) ? 'click' : 'error')}>
                        <GiScooter className="mr-1 inline" />
                        Livrer ({o.deliverTime}s)
                      </Btn>
                    </>
                  )}
                  {o.delivering !== null && !done && (
                    <>
                      <Bar value={1 - o.delivering / o.deliverTime} color="bg-clean" striped className="h-3" />
                      <span className="w-10 text-right text-xs tabular-nums text-zinc-400">{Math.ceil(o.delivering)}s</span>
                    </>
                  )}
                  {done && (
                    <Btn
                      tone="money"
                      className="w-full animate-pulse"
                      onClick={() => {
                        const r = act((s) => claimOrder(s, o.uid))
                        if (r) {
                          play('coin')
                          toast.success(`${o.client} a payé ${money(r)}`)
                        }
                      }}
                    >
                      Encaisser
                    </Btn>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </Card>
  )
}

const ZONES = [0.24, 0.17, 0.11]
const SPEEDS = [0.9, 1.3, 1.8]

function SafeCracker() {
  const cooldown = useGame((s) => s.game.safeCooldown)
  const reward = safeReward(useGame((s) => s.game))
  const [playing, setPlaying] = useState(false)
  const [lock, setLock] = useState(0)
  const [zone, setZone] = useState(0.5)
  const [pos, setPos] = useState(0)
  const posRef = useRef(0)
  const startRef = useRef(0)

  useEffect(() => {
    if (!playing) return
    let raf = 0
    const loop = (t: number) => {
      // Aller-retour triangulaire 0→1→0
      const phase = ((t - startRef.current) / 1000) * SPEEDS[lock]
      const p = 1 - Math.abs(((phase % 2) + 2) % 2 - 1)
      posRef.current = p
      setPos(p)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, lock])

  const start = () => {
    setLock(0)
    setZone(0.15 + Math.random() * 0.7)
    startRef.current = performance.now() - Math.random() * 1000
    setPlaying(true)
    play('click')
  }

  const finish = (locks: number) => {
    setPlaying(false)
    const r = act((s) => crackSafe(s, locks))
    if (locks === 0) {
      play('fail')
      toast.error('Le crochet a cassé. L’alarme a sonné… chaleur +5.')
    } else {
      play(locks === 3 ? 'success' : 'coin')
      toast.success(locks === 3 ? `Coffre ouvert ! +${money(r)}` : `${locks}/3 serrures : tu ramasses ce que tu peux. +${money(r)}`)
    }
  }

  const tryPick = () => {
    const half = ZONES[lock] / 2
    if (Math.abs(posRef.current - zone) <= half) {
      play('unlock')
      if (lock === 2) return finish(3)
      setLock(lock + 1)
      setZone(0.15 + Math.random() * 0.7)
    } else {
      finish(lock)
    }
  }

  useEffect(() => {
    if (!playing) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        tryPick()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GiLockPicking className="text-respect" size={22} />
          <span className="font-display text-2xl tracking-wide">Crocheter un coffre</span>
        </div>
        <span className="text-xs text-zinc-400">jusqu’à {money(reward.mul(1.5), 1)}</span>
      </div>
      {!playing ? (
        <div className="flex flex-col items-center gap-2 py-3">
          <p className="text-center text-xs text-zinc-400">Arrête le crochet dans la zone verte. 3 serrures, de plus en plus rapides.</p>
          <Btn tone="respect" disabled={cooldown > 0} onClick={start}>
            {cooldown > 0 ? `Planque surveillée… ${Math.ceil(cooldown)}s` : 'Tenter le coup'}
          </Btn>
        </div>
      ) : (
        <div className="flex flex-col gap-3 py-2">
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className={clsx('size-3 rounded-full', i < lock ? 'bg-money' : i === lock ? 'animate-pulse bg-respect' : 'bg-zinc-700')} />
            ))}
          </div>
          <div className="relative h-8 w-full rounded-md border border-line bg-black/60">
            <div
              className="absolute top-0 h-full rounded-sm bg-money/40"
              style={{ left: `${(zone - ZONES[lock] / 2) * 100}%`, width: `${ZONES[lock] * 100}%` }}
            />
            <div className="absolute top-[-4px] h-[calc(100%+8px)] w-1 rounded bg-respect shadow-[0_0_8px_#f59e0b]" style={{ left: `calc(${pos * 100}% - 2px)` }} />
          </div>
          <Btn tone="respect" className="py-3 text-base" onPointerDown={tryPick}>
            CROCHETER (espace)
          </Btn>
        </div>
      )}
    </Card>
  )
}

export function Street() {
  return (
    <div>
      <SectionTitle sub="Le boulot à la main : ça rapporte, ça chauffe un peu, et ça forge la légende.">Le terrain</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <Clicker />
        <div className="flex flex-col gap-3">
          <Orders />
          <SafeCracker />
        </div>
      </div>
    </div>
  )
}
