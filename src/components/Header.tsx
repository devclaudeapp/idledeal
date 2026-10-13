import clsx from 'clsx'
import { GiCash, GiCrownedSkull, GiFist, GiSoap, GiSunglasses, GiThermometerHot, GiReceiveMoney } from 'react-icons/gi'
import { bribe } from '../game/actions'
import { bribeCost, heatNetPerSec, launderCapacity, passiveIncome } from '../game/economy'
import { fmt, money } from '../game/num'
import { act, useGame } from '../game/store'
import { play } from '../ui/sound'
import { Bar, Btn } from './ui'

function Stat({ icon: Icon, label, value, sub, color, className }: { icon: typeof GiCash; label: string; value: string; sub?: string; color: string; className?: string }) {
  return (
    <div className={clsx('flex min-w-0 items-center gap-2 rounded-lg border border-line bg-black/30 px-2 py-1 sm:px-2.5 sm:py-1.5', className)}>
      <Icon className={clsx('hidden shrink-0 sm:block', color)} size={22} />
      <div className="min-w-0 leading-tight">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
        <div className={clsx('truncate font-semibold tabular-nums', color)}>{value}</div>
        {sub && <div className="truncate text-[10px] tabular-nums text-zinc-500 sm:text-[11px]">{sub}</div>}
      </div>
    </div>
  )
}

export function Header() {
  const g = useGame((s) => s.game)
  const net = heatNetPerSec(g)
  const heatColor = g.heat > 80 ? 'bg-heat' : g.heat > 50 ? 'bg-orange-500' : 'bg-yellow-500'

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-1.5 px-3 py-1.5 sm:gap-2 sm:py-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="whitespace-nowrap font-display text-2xl leading-none tracking-wider sm:text-3xl">
            IDLE <span className="text-money">DEAL</span>
          </h1>
          <div className="flex items-center gap-1.5 whitespace-nowrap sm:gap-2 [&>button]:px-2 [&>button]:text-xs sm:[&>button]:px-3 sm:[&>button]:text-sm">
            <Btn
              tone={g.lowProfile ? 'clean' : 'neutral'}
              title="Profil bas : revenus ×0,25, la chaleur ne monte plus et redescend vite"
              onClick={() => {
                act((s) => (s.lowProfile = !s.lowProfile))
                play('click')
              }}
            >
              <GiSunglasses className="mr-1 inline" />
              {g.lowProfile ? 'Profil bas ✓' : 'Profil bas'}
            </Btn>
            <Btn
              tone="heat"
              disabled={g.bribeCooldown > 0 || g.cash.lt(bribeCost(g)) || !!g.raid}
              title="Arroser les flics : chaleur −30"
              onClick={() => play(act(bribe) ? 'buy' : 'error')}
            >
              <GiReceiveMoney className="mr-1 inline" />
              {g.bribeCooldown > 0 ? `${Math.ceil(g.bribeCooldown)}s` : `Arroser ${money(bribeCost(g), 1)}`}
            </Btn>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 sm:gap-2">
          <Stat icon={GiCash} label="Argent sale" value={money(g.cash)} sub={`+${money(passiveIncome(g))}/s`} color="text-money" />
          <Stat icon={GiSoap} label="Argent propre" value={money(g.clean)} sub={`lessive ${money(launderCapacity(g), 1)}/s`} color="text-clean" />
          <Stat icon={GiFist} label="Respect" value={fmt(g.respect, 0)} color="text-respect" />
          <Stat icon={GiCrownedSkull} label="Légende" value={fmt(g.legend, 0)} sub={`+${fmt(g.legend.mul(2), 0)} % revenus`} color="text-legend" className="hidden sm:flex" />
          <div className="col-span-3 flex items-center gap-2 rounded-lg border border-line bg-black/30 px-2 py-1 sm:col-span-1 sm:px-2.5 sm:py-1.5">
            <GiThermometerHot className={clsx('shrink-0', g.heat > 80 ? 'animate-pulse text-heat' : 'text-orange-400')} size={22} />
            <div className="w-full leading-tight">
              <div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-500">
                <span>
                  Chaleur <span className="font-semibold text-zinc-200 sm:hidden">{Math.floor(g.heat)}/100</span>
                </span>
                <span className={clsx('tabular-nums', net > 0 ? 'text-heat' : 'text-money')}>
                  {net > 0 ? '+' : ''}
                  {net.toFixed(2)}/s
                </span>
              </div>
              <div className="hidden font-semibold tabular-nums sm:block">{Math.floor(g.heat)} / 100</div>
              <Bar value={g.heat / 100} color={heatColor} className="mt-0.5 h-1.5" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export function BuyAmountPicker() {
  const amount = useGame((s) => s.game.buyAmount)
  return (
    <div className="flex items-center gap-1 rounded-lg border border-line bg-black/30 p-1 text-xs">
      <span className="px-1 text-zinc-500">Acheter</span>
      {([1, 10, 100, 'max'] as const).map((a) => (
        <button
          key={a}
          className={clsx('rounded-md px-2 py-1 font-semibold', amount === a ? 'bg-money/20 text-money' : 'text-zinc-400 hover:text-zinc-200')}
          onClick={() => act((s) => (s.buyAmount = a))}
        >
          {a === 'max' ? 'MAX' : `×${a}`}
        </button>
      ))}
    </div>
  )
}
