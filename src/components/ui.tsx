import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { IconType } from 'react-icons'

type Tone = 'money' | 'clean' | 'respect' | 'legend' | 'heat' | 'neutral'

const TONES: Record<Tone, string> = {
  money: 'bg-money/15 text-money border-money/40 hover:bg-money/25',
  clean: 'bg-clean/15 text-clean border-clean/40 hover:bg-clean/25',
  respect: 'bg-respect/15 text-respect border-respect/40 hover:bg-respect/25',
  legend: 'bg-legend/15 text-legend border-legend/40 hover:bg-legend/25',
  heat: 'bg-heat/15 text-heat border-heat/40 hover:bg-heat/25',
  neutral: 'bg-white/5 text-zinc-200 border-line hover:bg-white/10',
}

export function Btn({
  tone = 'neutral',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return (
    <button
      className={clsx(
        'rounded-lg border px-3 py-1.5 text-sm font-semibold transition active:scale-[0.97]',
        'disabled:opacity-35 disabled:hover:bg-transparent disabled:active:scale-100',
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('rounded-xl border border-line bg-panel/90 p-3 shadow-lg shadow-black/30', className)}>{children}</div>
}

export function Bar({ value, className, color = 'bg-money', striped }: { value: number; className?: string; color?: string; striped?: boolean }) {
  return (
    <div className={clsx('h-2 w-full overflow-hidden rounded-full bg-black/50', className)}>
      <div
        className={clsx('h-full rounded-full transition-[width] duration-100 ease-linear', color, striped && 'stripes')}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  )
}

export function IconBadge({ icon: Icon, className, size = 28 }: { icon: IconType; className?: string; size?: number }) {
  return (
    <div className={clsx('grid shrink-0 place-items-center rounded-lg border border-line bg-black/40', className)}>
      <Icon size={size} />
    </div>
  )
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="font-display text-3xl tracking-wide text-zinc-100">{children}</h2>
      {sub && <p className="text-sm text-zinc-400">{sub}</p>}
    </div>
  )
}
