import clsx from 'clsx'
import { GiPadlock } from 'react-icons/gi'
import { buyBusiness, buyManager, runBusiness } from '../game/actions'
import { BUSINESSES, nextMilestone } from '../game/data/businesses'
import { DISTRICT_BY_ID } from '../game/data/districts'
import {
  businessCost, cycleTime, globalMult, isBusinessUnlocked, resolveBuyAmount, revenuePerCycle, revenuePerSec,
} from '../game/economy'
import { fmtTime, money } from '../game/num'
import { act, useGame } from '../game/store'
import { BUSINESS_ICONS } from '../ui/icons'
import { play } from '../ui/sound'
import { BuyAmountPicker } from './Header'
import { Bar, Btn, Card, SectionTitle } from './ui'

export function Businesses() {
  const g = useGame((s) => s.game)
  const gm = globalMult(g)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <SectionTitle sub="Clique sur l’icône pour lancer un cycle. Engage un lieutenant pour que ça tourne tout seul.">Business</SectionTitle>
        <BuyAmountPicker />
      </div>
      <div className="grid gap-3 @2xl:grid-cols-2">
        {BUSINESSES.map((def) => {
          const b = g.businesses[def.id]
          const Icon = BUSINESS_ICONS[def.id]
          if (!isBusinessUnlocked(g, def)) {
            return (
              <Card key={def.id} className="flex items-center gap-3 opacity-50">
                <div className="grid size-16 place-items-center rounded-lg border border-line bg-black/40">
                  <GiPadlock size={28} />
                </div>
                <div>
                  <div className="font-semibold">{def.name}</div>
                  <div className="text-xs text-zinc-400">Contrôle le quartier « {DISTRICT_BY_ID[def.district!].name} » pour débloquer.</div>
                </div>
              </Card>
            )
          }
          const n = resolveBuyAmount(g, def.baseCost, def.costMult, b.level, g.cash)
          const cost = businessCost(g, def.id, n)
          const cyc = cycleTime(def, b.level || 1)
          const fast = cyc < 0.3
          const ms = nextMilestone(b.level)
          const canRun = b.level > 0 && !b.running && !b.manager
          return (
            <Card key={def.id} className="flex gap-3">
              <button
                onClick={() => act((s) => runBusiness(s, def.id)) && play('click')}
                disabled={!canRun}
                className={clsx(
                  'relative grid size-16 shrink-0 place-items-center rounded-lg border bg-black/40 transition',
                  canRun ? 'animate-pulse border-money text-money hover:bg-money/10' : 'border-line text-zinc-200',
                  b.level === 0 && 'opacity-40',
                )}
                title={canRun ? 'Lancer le cycle' : undefined}
              >
                <Icon size={34} />
                <span className="absolute -bottom-2 rounded-full border border-line bg-panel-2 px-1.5 text-[11px] font-bold tabular-nums">{b.level}</span>
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="truncate font-semibold">{def.name}</div>
                  <div className="shrink-0 text-xs tabular-nums text-zinc-400">{fmtTime(cyc)}</div>
                </div>
                <div className="truncate text-xs text-zinc-500">{def.desc}</div>
                <div className="relative mt-1.5">
                  <Bar value={fast && b.running ? 1 : b.progress} striped={fast && b.running} className="h-4" />
                  <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold tabular-nums text-white drop-shadow">
                    {b.level > 0 ? (fast ? `${money(revenuePerSec(g, def.id, gm), 1)}/s` : money(revenuePerCycle(g, def.id, gm), 1)) : '—'}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Btn tone="money" disabled={g.cash.lt(cost)} onClick={() => play(act((s) => buyBusiness(s, def.id)) ? 'buy' : 'error')}>
                    ×{n} · {money(cost, 1)}
                  </Btn>
                  {!b.manager ? (
                    <Btn
                      disabled={b.level === 0 || g.cash.lt(def.managerCost)}
                      onClick={() => play(act((s) => buyManager(s, def.id)) ? 'unlock' : 'error')}
                      title="Automatise ce business"
                    >
                      {def.managerName} · {money(def.managerCost, 0)}
                    </Btn>
                  ) : (
                    <span className="text-xs text-zinc-400">👤 {def.managerName} gère</span>
                  )}
                  {ms && <span className="ml-auto text-[11px] text-zinc-500">palier {ms}</span>}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
