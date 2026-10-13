import { useState } from 'react'
import { GiMoneyStack } from 'react-icons/gi'
import { buyFront, manualLaunder } from '../game/actions'
import { FRONTS } from '../game/data/fronts'
import { frontCost, launderCapacity, launderMult, manualLaunderAmount, resolveBuyAmount } from '../game/economy'
import { money, pct } from '../game/num'
import { act, useGame } from '../game/store'
import { FRONT_ICONS } from '../ui/icons'
import { play } from '../ui/sound'
import { BuyAmountPicker } from './Header'
import { Btn, Card, IconBadge, SectionTitle } from './ui'

export function Laundering() {
  const g = useGame((s) => s.game)
  const m = launderMult(g)
  const [count, setCount] = useState(0)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <SectionTitle sub="L’argent sale achète la rue. L’argent propre achète les gens importants.">Blanchiment</SectionTitle>
        <BuyAmountPicker />
      </div>

      <Card className="mb-3 flex flex-wrap items-center gap-4">
        <button
          onPointerDown={() => {
            const r = act(manualLaunder)
            if (r.gt(0)) {
              play('coin')
              setCount((c) => c + 1)
            } else play('error')
          }}
          disabled={g.cash.lte(0)}
          className="grid size-20 place-items-center rounded-xl border-2 border-clean/50 bg-clean/10 text-clean transition active:scale-90 disabled:opacity-40"
          aria-label="Compter les billets"
        >
          <GiMoneyStack size={44} style={{ transform: `rotate(${(count % 4) * 6 - 9}deg)` }} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-display text-2xl tracking-wide">Compter les billets</div>
          <div className="text-xs text-zinc-400">
            Blanchis à la main : {money(manualLaunderAmount(g), 1)} par clic à 90 % de rendement (mieux que les façades).
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="text-zinc-400">Capacité auto</div>
          <div className="font-semibold text-clean">{money(launderCapacity(g))}/s</div>
          <label className="mt-1 flex items-center justify-end gap-1 text-xs text-zinc-400">
            <input type="checkbox" checked={g.launderOn} onChange={() => act((s) => (s.launderOn = !s.launderOn))} />
            blanchiment auto
          </label>
        </div>
      </Card>

      <div className="grid gap-3 @2xl:grid-cols-2">
        {FRONTS.map((f) => {
          const lvl = g.fronts[f.id] ?? 0
          const n = resolveBuyAmount(g, f.baseCost, f.costMult, lvl, g.cash)
          const cost = frontCost(g, f.id, n)
          return (
            <Card key={f.id} className="flex gap-3">
              <IconBadge icon={FRONT_ICONS[f.id]} className="size-14 text-clean" />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="truncate font-semibold">{f.name}</span>
                  <span className="text-xs tabular-nums text-zinc-400">niv. {lvl}</span>
                </div>
                <div className="truncate text-xs text-zinc-500">{f.desc}</div>
                <div className="mt-1 text-xs text-zinc-300">
                  {money(f.capacity * m, 1)}/s par niveau · rendement {pct(f.efficiency)}
                </div>
                <Btn className="mt-2" tone="clean" disabled={g.cash.lt(cost)} onClick={() => play(act((s) => buyFront(s, f.id)) ? 'buy' : 'error')}>
                  ×{n} · {money(cost, 1)}
                </Btn>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
