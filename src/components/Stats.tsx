import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fmt, fmtTime, money } from '../game/num'
import { useGame } from '../game/store'
import { useHistory } from '../ui/history'
import { Card, SectionTitle } from './ui'

const tooltipStyle = { background: '#15151c', border: '1px solid #2a2a38', borderRadius: 8, fontSize: 12 }

export function Stats() {
  const st = useGame((s) => s.game.stats)
  const samples = useHistory((s) => s.samples)
  const t0 = samples[0]?.t ?? 0
  const data = samples.map((s) => ({ ...s, x: Math.round((s.t - t0) / 1000) }))

  const rows: [string, string][] = [
    ['Gains totaux', money(st.totalEarned)],
    ['Gains de cette vie', money(st.runEarned)],
    ['Total blanchi', money(st.totalLaundered)],
    ['Braquages réussis / ratés', `${st.heists} / ${st.heistsFailed}`],
    ['Descentes subies', `${st.raids}`],
    ['Commandes livrées', `${st.orders}`],
    ['Coffres crochetés', `${st.safesCracked}`],
    ['Clics (charbonner)', fmt(st.clicks, 0)],
    ['Meilleur combo', `${st.bestCombo}`],
    ['Nouvelles identités', `${st.prestiges}`],
    ['Temps de jeu', fmtTime(st.playTime)],
  ]

  return (
    <div>
      <SectionTitle sub="Graphiques de la session en cours (un point toutes les 5 s).">Statistiques</SectionTitle>
      <div className="grid gap-3 @2xl:grid-cols-2">
        <Card>
          <div className="mb-1 text-sm font-semibold text-money">Revenu passif (€/s)</div>
          <div className="h-48">
            <ResponsiveContainer>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2a2a38" strokeDasharray="3 3" />
                <XAxis dataKey="x" tickFormatter={(v) => fmtTime(v)} stroke="#71717a" fontSize={11} />
                <YAxis tickFormatter={(v) => fmt(v, 1)} stroke="#71717a" fontSize={11} width={50} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => money(Number(v))} labelFormatter={(v) => fmtTime(Number(v))} />
                <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#inc)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="mb-1 text-sm font-semibold text-heat">Chaleur</div>
          <div className="h-48">
            <ResponsiveContainer>
              <LineChart data={data}>
                <CartesianGrid stroke="#2a2a38" strokeDasharray="3 3" />
                <XAxis dataKey="x" tickFormatter={(v) => fmtTime(v)} stroke="#71717a" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#71717a" fontSize={11} width={30} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => fmtTime(Number(v))} formatter={(v) => Number(v).toFixed(0)} />
                <Line type="monotone" dataKey="heat" stroke="#ef4444" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="@2xl:col-span-2">
          <dl className="grid gap-x-6 gap-y-1 text-sm @sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-line/60 py-1">
                <dt className="text-zinc-400">{k}</dt>
                <dd className="font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  )
}
