import clsx from 'clsx'
import { conquerDistrict } from '../game/actions'
import { BUSINESSES } from '../game/data/businesses'
import { DISTRICTS, DISTRICT_BY_ID } from '../game/data/districts'
import { fmt, money } from '../game/num'
import { act, useGame } from '../game/store'
import { DISTRICT_ICONS } from '../ui/icons'
import { play } from '../ui/sound'
import { useUi } from '../ui/uiStore'
import { Btn, Card, SectionTitle } from './ui'

function bonuses(id: string): string[] {
  const d = DISTRICT_BY_ID[id]
  const out: string[] = []
  if (d.globalMult) out.push(`Revenus ×${d.globalMult}`)
  if (d.launderMult) out.push(`Blanchiment ×${d.launderMult}`)
  if (d.heatMult) out.push(`Chaleur ×${d.heatMult}`)
  const unlocks = BUSINESSES.filter((b) => b.district === id).map((b) => b.name)
  if (unlocks.length) out.push(`Débloque : ${unlocks.join(', ')}`)
  return out
}

export function Territory() {
  const g = useGame((s) => s.game)
  const selected = useUi((s) => s.selectedDistrict)
  const sel = selected ?? DISTRICTS.find((d) => !g.districts.includes(d.id))?.id ?? 'lilas'
  const setSel = (id: string) => {
    useUi.getState().selectDistrict(id)
    useUi.getState().setFocus(`district:${id}`)
  }
  const d = DISTRICT_BY_ID[sel]
  const owned = g.districts.includes(sel)

  return (
    <div>
      <SectionTitle sub="Gagne du respect en braquant, livrant et en gérant les crises, puis prends la ville quartier par quartier.">Port-Sombre</SectionTitle>
      <div className="grid gap-3 @2xl:grid-cols-[1fr_320px]">
        <div
          className="relative grid grid-cols-4 grid-rows-2 gap-2 rounded-xl border border-line p-2"
          style={{
            background:
              'linear-gradient(#0f0f15,#0f0f15) padding-box, repeating-linear-gradient(90deg,#1a1a24 0 2px,transparent 2px 60px), repeating-linear-gradient(0deg,#1a1a24 0 2px,transparent 2px 60px)',
          }}
        >
          {DISTRICTS.map((dd) => {
            const Icon = DISTRICT_ICONS[dd.id]
            const mine = g.districts.includes(dd.id)
            const affordable = !mine && g.respect >= dd.respect && g.cash.gte(dd.cost)
            return (
              <button
                key={dd.id}
                onClick={() => setSel(dd.id)}
                style={{ gridColumn: dd.x + 1, gridRow: dd.y + 1 }}
                className={clsx(
                  'flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border-2 p-1 text-center transition',
                  mine ? 'border-money/60 bg-money/10 text-money' : affordable ? 'animate-pulse border-respect/70 bg-respect/10 text-respect' : 'border-line bg-black/40 text-zinc-500',
                  sel === dd.id && 'ring-2 ring-white/60',
                )}
              >
                <Icon size={30} />
                <span className="text-[11px] font-semibold leading-tight sm:text-xs">{dd.name}</span>
              </button>
            )
          })}
        </div>
        <Card>
          <div className="font-display text-3xl tracking-wide">{d.name}</div>
          <p className="text-sm text-zinc-400">{d.desc}</p>
          <ul className="mt-2 list-inside list-disc text-sm text-zinc-200">
            {bonuses(sel).map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          {owned ? (
            <div className="mt-3 rounded-lg bg-money/10 p-2 text-center font-semibold text-money">Sous ton contrôle</div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <div className="text-sm">
                Respect : <span className={g.respect >= d.respect ? 'text-money' : 'text-heat'}>{fmt(g.respect, 0)} / {d.respect}</span>
                <br />
                Mise : <span className={g.cash.gte(d.cost) ? 'text-money' : 'text-heat'}>{money(d.cost, 1)}</span>
              </div>
              <Btn tone="respect" disabled={g.respect < d.respect || g.cash.lt(d.cost)} onClick={() => play(act((s) => conquerDistrict(s, sel)) ? 'success' : 'error')}>
                Prendre le quartier
              </Btn>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
