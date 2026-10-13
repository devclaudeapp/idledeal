import confetti from 'canvas-confetti'
import { useState } from 'react'
import { GiCrownedSkull } from 'react-icons/gi'
import { toast } from 'sonner'
import { prestige } from '../game/actions'
import { legendGain, LEGEND_BONUS } from '../game/economy'
import { fmt, money } from '../game/num'
import { act, save, useGame } from '../game/store'
import { play } from '../ui/sound'
import { Btn, Card, SectionTitle } from './ui'

export function Prestige() {
  const g = useGame((s) => s.game)
  const gain = legendGain(g)
  const [confirm, setConfirm] = useState(false)

  const go = () => {
    const r = act(prestige)
    setConfirm(false)
    if (!r) return
    save()
    play('success')
    confetti({ particleCount: 200, spread: 100, colors: ['#c084fc', '#22c55e', '#f59e0b'] })
    toast(`Nouvelle identité. +${fmt(r, 0)} points de légende.`)
  }

  return (
    <div>
      <SectionTitle sub="Disparaître pour mieux revenir.">Nouvelle identité</SectionTitle>
      <Card className="flex flex-col items-center gap-3 py-6 text-center">
        <GiCrownedSkull size={72} className="text-legend" />
        <p className="max-w-lg text-sm text-zinc-300">
          Brûle tout : business, cash, équipe, quartiers, corruption. Tu repars de zéro sous un nouveau nom, mais ta <b className="text-legend">légende</b> te suit : chaque point donne{' '}
          <b>+{LEGEND_BONUS * 100} %</b> de revenus pour toujours. Les succès sont conservés.
        </p>
        <div className="text-sm text-zinc-400">
          Gagné dans cette vie : <span className="text-money">{money(g.stats.runEarned)}</span> (1 Md€ minimum)
        </div>
        <div className="font-display text-4xl text-legend">+{fmt(gain, 0)} légende</div>
        {!confirm ? (
          <Btn tone="legend" disabled={gain.lt(1)} onClick={() => setConfirm(true)}>
            Changer d’identité
          </Btn>
        ) : (
          <div className="flex gap-2">
            <Btn tone="legend" onClick={go}>Oui, tout brûler</Btn>
            <Btn onClick={() => setConfirm(false)}>Annuler</Btn>
          </div>
        )}
      </Card>
    </div>
  )
}
