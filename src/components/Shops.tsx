import clsx from 'clsx'
import { GiCheckMark, GiUpgrade } from 'react-icons/gi'
import { buyCorruption, buyUpgrade } from '../game/actions'
import { ACHIEVEMENTS } from '../game/data/achievements'
import { CORRUPTION } from '../game/data/corruption'
import { UPGRADES } from '../game/data/upgrades'
import { ACHIEVEMENT_BONUS } from '../game/economy'
import { money, pct } from '../game/num'
import { act, useGame } from '../game/store'
import { CORRUPTION_ICONS } from '../ui/icons'
import { play } from '../ui/sound'
import { Btn, Card, IconBadge, SectionTitle } from './ui'

export function Corruption() {
  const g = useGame((s) => s.game)
  return (
    <div>
      <SectionTitle sub="Payé en argent propre. Chaque officiel réduit la chaleur générée et accélère son refroidissement.">Corruption</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        {CORRUPTION.map((c) => {
          const owned = g.corruption.includes(c.id)
          return (
            <Card key={c.id} className={clsx('flex gap-3', owned && 'border-clean/40')}>
              <IconBadge icon={CORRUPTION_ICONS[c.id]} className={clsx('size-14', owned ? 'text-clean' : 'text-zinc-300')} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-zinc-500">{c.desc}</div>
                <div className="mt-1 text-xs text-zinc-300">
                  Chaleur ×{c.heatMult} · refroidissement +{c.decayAdd}/s{c.raidLossMult < 1 && ` · saisies ×${c.raidLossMult}`}
                </div>
                {owned ? (
                  <div className="mt-2 text-sm font-semibold text-clean">
                    <GiCheckMark className="inline" /> Dans ta poche
                  </div>
                ) : (
                  <Btn className="mt-2" tone="clean" disabled={g.clean.lt(c.cost)} onClick={() => play(act((s) => buyCorruption(s, c.id)) ? 'unlock' : 'error')}>
                    Acheter · {money(c.cost, 1)}
                  </Btn>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export function Upgrades() {
  const g = useGame((s) => s.game)
  const available = UPGRADES.filter((u) => !g.upgrades.includes(u.id))
  const owned = UPGRADES.filter((u) => g.upgrades.includes(u.id))
  return (
    <div>
      <SectionTitle sub="Investissements payés en argent propre.">Améliorations</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {available.slice(0, 18).map((u) => (
          <Card key={u.id} className="flex items-center gap-3 p-2.5">
            <GiUpgrade className="shrink-0 text-clean" size={26} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{u.name}</div>
              <div className="truncate text-xs text-zinc-400">{u.desc}</div>
            </div>
            <Btn tone="clean" className="shrink-0 text-xs" disabled={g.clean.lt(u.cost)} onClick={() => play(act((s) => buyUpgrade(s, u.id)) ? 'buy' : 'error')}>
              {money(u.cost, 1)}
            </Btn>
          </Card>
        ))}
      </div>
      {owned.length > 0 && (
        <>
          <h3 className="mb-2 mt-4 font-display text-xl tracking-wide text-zinc-400">Acquises ({owned.length})</h3>
          <div className="flex flex-wrap gap-1.5">
            {owned.map((u) => (
              <span key={u.id} title={u.desc} className="rounded-md border border-clean/30 bg-clean/10 px-2 py-0.5 text-xs text-clean">
                {u.name}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function Achievements() {
  const g = useGame((s) => s.game)
  return (
    <div>
      <SectionTitle sub={`${g.achievements.length}/${ACHIEVEMENTS.length} débloqués · chacun donne +${pct(ACHIEVEMENT_BONUS)} de revenus.`}>Succès</SectionTitle>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {ACHIEVEMENTS.map((a) => {
          const got = g.achievements.includes(a.id)
          return (
            <Card key={a.id} className={clsx('p-2.5', got ? 'border-respect/50' : 'opacity-50')}>
              <div className={clsx('text-sm font-semibold', got ? 'text-respect' : 'text-zinc-400')}>{got ? '🏆 ' : '🔒 '}{a.name}</div>
              <div className="text-xs text-zinc-400">{a.desc}</div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
