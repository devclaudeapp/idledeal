import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { GiPoliceCar } from 'react-icons/gi'
import { toast } from 'sonner'
import { qteClick, raidClick, resolveEvent } from '../game/actions'
import { EVENT_BY_ID } from '../game/data/events'
import { QTE_BY_KIND } from '../game/data/heists'
import { raidLossFraction } from '../game/economy'
import { RAID_SAVE_CAP } from '../game/engine'
import { fmtTime, money, pct } from '../game/num'
import { act, useGame } from '../game/store'
import { play } from '../ui/sound'
import { Bar, Btn } from './ui'

function useSpace(handler: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        handler()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
}

function Backdrop({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm ${className}`}
    >
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} className="w-full max-w-md">
        {children}
      </motion.div>
    </motion.div>
  )
}

/** Descente de police : spammer le bouton pour planquer la marchandise. */
export function RaidOverlay() {
  const raid = useGame((s) => s.game.raid)
  const g = useGame((s) => s.game)
  const click = () => {
    act(raidClick)
    play('click')
  }
  useSpace(click, !!raid)
  return (
    <AnimatePresence>
      {raid && (
        <Backdrop className="siren">
          <div className="rounded-2xl border-2 border-heat bg-panel p-5 text-center">
            <GiPoliceCar size={64} className="mx-auto animate-bounce text-heat" />
            <div className="font-display text-5xl tracking-wider text-heat">DESCENTE !</div>
            <p className="text-sm text-zinc-300">
              Les stups enfoncent la porte. Planque un max de cash avant qu’ils arrivent à l’étage !
              <br />
              Saisie prévue : <b className="text-heat">{money(g.cash.mul(raidLossFraction(g) * (1 - raid.saved)))}</b>
            </p>
            <Bar value={raid.remaining / raid.total} color="bg-heat" className="my-3 h-3" />
            <button
              onPointerDown={click}
              className="w-full rounded-xl border-2 border-respect bg-respect/20 py-5 font-display text-3xl tracking-wide text-respect transition active:scale-95"
            >
              PLANQUER ! (espace)
            </button>
            <div className="mt-2 text-sm text-zinc-400">
              Planqué : <b className="text-money">{pct(raid.saved)}</b> / {pct(RAID_SAVE_CAP)}
            </div>
          </div>
        </Backdrop>
      )}
    </AnimatePresence>
  )
}

/** Intervention manuelle pendant un braquage. */
export function QteOverlay() {
  const qte = useGame((s) => s.game.qte)
  const def = qte ? QTE_BY_KIND[qte.kind] : null
  const click = () => {
    if (!def) return
    const done = act((s) => qteClick(s, def.bonus))
    play(done ? 'success' : 'click')
    if (done) toast.success(`${def.action} : réussi ! +${pct(def.bonus)} de chances`)
  }
  useSpace(click, !!qte)
  return (
    <AnimatePresence>
      {qte && def && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          className="fixed inset-x-0 bottom-20 z-40 mx-auto w-[min(92vw,420px)] rounded-2xl border-2 border-respect bg-panel p-4 shadow-2xl shadow-black md:bottom-6"
        >
          <div className="text-center font-display text-2xl tracking-wide text-respect">{def.title}</div>
          <Bar value={qte.remaining / qte.total} color="bg-heat" className="my-2 h-2" />
          <button
            onPointerDown={click}
            className="w-full rounded-xl border-2 border-respect bg-respect/20 py-4 font-display text-2xl tracking-wide text-respect active:scale-95"
          >
            {def.action.toUpperCase()} ({qte.clicks}/{qte.needed})
          </button>
          <div className="mt-1 text-center text-xs text-zinc-400">
            Spamme le bouton ou la barre espace · échec : −{pct(def.malus)} de chances
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function EventModal() {
  const id = useGame((s) => s.game.pendingEvent)
  const ev = id ? EVENT_BY_ID[id] : null
  return (
    <AnimatePresence>
      {ev && (
        <Backdrop>
          <div className="rounded-2xl border border-line bg-panel p-5">
            <div className="font-display text-3xl tracking-wide text-respect">{ev.title}</div>
            <p className="mt-1 text-sm text-zinc-300">{ev.text}</p>
            <div className="mt-4 flex flex-col gap-2">
              {ev.choices.map((c, i) => (
                <Btn
                  key={c.label}
                  className="py-2 text-left"
                  onClick={() => {
                    const msg = act((s) => resolveEvent(s, i))
                    if (msg) {
                      play('click')
                      toast(msg)
                    }
                  }}
                >
                  <div>{c.label}</div>
                  {c.hint && <div className="text-xs font-normal text-zinc-400">{c.hint}</div>}
                </Btn>
              ))}
            </div>
          </div>
        </Backdrop>
      )}
    </AnimatePresence>
  )
}

export function OfflineModal() {
  const report = useGame((s) => s.offline)
  const dismiss = useGame((s) => s.dismissOffline)
  return (
    <AnimatePresence>
      {report && (
        <Backdrop>
          <div className="rounded-2xl border border-line bg-panel p-5 text-center">
            <div className="font-display text-3xl tracking-wide">Pendant ton absence…</div>
            <p className="text-sm text-zinc-400">{fmtTime(report.seconds)} se sont écoulées. Tes lieutenants ont bossé.</p>
            <div className="my-4 text-3xl font-bold text-money">+{money(report.earned)}</div>
            {report.laundered.gt(0) && <div className="mb-3 text-sm text-clean">{money(report.laundered)} passés à la lessive</div>}
            <Btn tone="money" onClick={dismiss}>Récupérer</Btn>
          </div>
        </Backdrop>
      )}
    </AnimatePresence>
  )
}
