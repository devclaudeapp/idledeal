import Decimal, { type DecimalSource } from 'break_eternity.js'

export { Decimal }
export type { DecimalSource }

export const D = (v: DecimalSource): Decimal => new Decimal(v)
export const ZERO = (): Decimal => new Decimal(0)

// Suffixes « à la française » : k, M, Md (milliard), Bn (billion), Bd (billiard)…
const SUFFIXES = ['', 'k', 'M', 'Md', 'Bn', 'Bd', 'Tn', 'Td', 'Qn', 'Qd', 'Sx', 'Sd', 'Sp', 'Oc', 'No', 'Dc']

export function fmt(value: DecimalSource, digits = 2): string {
  const d = Decimal.fromValue(value)
  if (d.isNan()) return '?'
  if (d.lt(0)) return '-' + fmt(d.neg(), digits)
  if (d.lt(1000)) {
    const n = d.toNumber()
    if (Number.isInteger(n) || n >= 100) return Math.floor(n).toString()
    return n.toFixed(n < 10 ? digits : 1)
  }
  if (d.layer === 0 || (d.layer === 1 && d.mag < 1e6)) {
    const exp = Math.floor(d.log10().toNumber() + 1e-9)
    const tier = Math.floor(exp / 3)
    if (tier < SUFFIXES.length) {
      const mantissa = d.div(Decimal.pow(10, tier * 3)).toNumber()
      return `${mantissa.toFixed(mantissa >= 100 ? Math.min(1, digits) : digits)} ${SUFFIXES[tier]}`
    }
    const mantissa = d.div(Decimal.pow(10, exp)).toNumber()
    return `${mantissa.toFixed(digits)}e${exp}`
  }
  return d.toString()
}

export const money = (v: DecimalSource, digits = 2): string => `${fmt(v, digits)} €`

export function fmtTime(seconds: number): string {
  if (!isFinite(seconds)) return '∞'
  if (seconds < 1) return `${seconds.toFixed(2)}s`
  if (seconds < 60) return `${seconds < 10 ? seconds.toFixed(1) : Math.ceil(seconds)}s`
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`
  return `${m}m ${sec.toString().padStart(2, '0')}s`
}

export const pct = (v: number, digits = 0): string => `${(v * 100).toFixed(digits)} %`

/** Coût total de n niveaux d'une progression géométrique. */
export function geomCost(base: DecimalSource, mult: number, owned: number, n: number): Decimal {
  const first = Decimal.fromValue(base).mul(Decimal.pow(mult, owned))
  return first.mul(Decimal.pow(mult, n).sub(1)).div(mult - 1)
}

/** Nombre max de niveaux achetables avec `budget`. */
export function geomMax(base: DecimalSource, mult: number, owned: number, budget: DecimalSource): number {
  const first = Decimal.fromValue(base).mul(Decimal.pow(mult, owned))
  const b = Decimal.fromValue(budget)
  if (b.lt(first)) return 0
  const n = b.mul(mult - 1).div(first).add(1).log10().div(Math.log10(mult)).add(1e-9).floor().toNumber()
  return Math.max(0, Math.min(n, 100000))
}
