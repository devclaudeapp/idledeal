import clsx from 'clsx'
import { GiStopwatch } from 'react-icons/gi'
import { hireCrew, startHeist } from '../game/actions'
import { ROLE_BY_ID, ROLES } from '../game/data/crew'
import { HEISTS } from '../game/data/heists'
import { crewCost, heistChance, heistRequirementsMet, heistReward } from '../game/economy'
import { fmtTime, money, pct } from '../game/num'
import { act, useGame } from '../game/store'
import type { Role } from '../game/types'
import { HEIST_ICONS, ROLE_ICONS } from '../ui/icons'
import { play } from '../ui/sound'
import { Bar, Btn, Card, IconBadge, SectionTitle } from './ui'

export function Heists() {
  const g = useGame((s) => s.game)
  const run = g.heist
  const runDef = run ? HEISTS.find((h) => h.id === run.id) : null

  return (
    <div>
      <SectionTitle sub="Monte ton équipe, choisis ta cible. Pendant le coup, tu devras intervenir à la main.">Braquages</SectionTitle>

      {run && runDef && (
        <Card className="mb-3 border-respect/50">
          <div className="flex items-center gap-3">
            <IconBadge icon={HEIST_ICONS[run.id]} className="size-12 animate-pulse text-respect" />
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-display text-2xl tracking-wide">{runDef.name} en cours</span>
                <span className="text-sm tabular-nums text-zinc-300">{fmtTime(Math.max(0, run.remaining))}</span>
              </div>
              <Bar value={1 - run.remaining / run.duration} color="bg-respect" striped className="h-3" />
              <div className="mt-1 text-sm">
                Chances de réussite : <span className="font-bold text-respect">{pct(run.chance)}</span>
                <span className="text-zinc-500"> · interventions restantes : {run.qteAt.length + (g.qte ? 1 : 0)}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <h3 className="mb-2 font-display text-xl tracking-wide text-zinc-300">L’équipe</h3>
      <div className="mb-4 grid grid-cols-2 gap-2 @sm:grid-cols-3 @2xl:grid-cols-5">
        {ROLES.map((r) => {
          const lvl = g.crew[r.id]
          const cost = crewCost(g, r.id)
          const maxed = lvl >= r.maxLevel
          return (
            <Card key={r.id} className="flex flex-col gap-1 p-2.5">
              <div className="flex items-center gap-2">
                <IconBadge icon={ROLE_ICONS[r.id]} className="size-9" size={20} />
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-sm font-semibold">{r.name}</div>
                  <div className="text-xs text-zinc-400">niv. {lvl}</div>
                </div>
              </div>
              <div className="line-clamp-2 text-[11px] text-zinc-500">{r.desc}</div>
              <Btn
                tone="respect"
                className="mt-auto text-xs"
                disabled={maxed || g.cash.lt(cost) || !!run}
                onClick={() => play(act((s) => hireCrew(s, r.id)) ? 'buy' : 'error')}
              >
                {maxed ? 'MAX' : `${lvl === 0 ? 'Recruter' : 'Former'} · ${money(cost, 0)}`}
              </Btn>
            </Card>
          )
        })}
      </div>

      <h3 className="mb-2 font-display text-xl tracking-wide text-zinc-300">Les cibles</h3>
      <div className="grid gap-3 @2xl:grid-cols-2">
        {HEISTS.map((h) => {
          const ok = heistRequirementsMet(g, h)
          const cd = g.heistCooldowns[h.id] ?? 0
          return (
            <Card key={h.id} className={clsx('flex gap-3', !ok && 'opacity-60')}>
              <IconBadge icon={HEIST_ICONS[h.id]} className="size-14 text-respect" />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="font-semibold">{h.name}</span>
                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                    <GiStopwatch /> {fmtTime(h.duration)}
                  </span>
                </div>
                <div className="text-xs text-zinc-500">{h.desc}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(Object.entries(h.req) as [Role, number][]).map(([r, lvl]) => {
                    const Icon = ROLE_ICONS[r]
                    const met = g.crew[r] >= lvl
                    return (
                      <span
                        key={r}
                        title={ROLE_BY_ID[r].name}
                        className={clsx('flex items-center gap-0.5 rounded border px-1 text-[11px]', met ? 'border-money/40 text-money' : 'border-heat/40 text-heat')}
                      >
                        <Icon /> {lvl}
                      </span>
                    )
                  })}
                </div>
                <div className="mt-1 text-xs text-zinc-300">
                  Butin <span className="text-money">{money(heistReward(g, h.id), 1)}</span> · +{h.respect} respect · chaleur +{h.heat}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Btn tone="respect" disabled={!ok || !!run || cd > 0} onClick={() => play(act((s) => startHeist(s, h.id)) ? 'alert' : 'error')}>
                    {cd > 0 ? `Planque ${fmtTime(cd)}` : 'Lancer le coup'}
                  </Btn>
                  {ok && <span className="text-sm">Chances : <b className="text-respect">{pct(heistChance(g, h))}</b></span>}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
