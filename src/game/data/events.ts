import { referenceIncome } from '../economy'
import { Decimal, money } from '../num'
import { random } from '../random'
import type { GameState } from '../types'

export interface EventChoice {
  label: string
  hint?: string
  apply: (s: GameState) => string
}

export interface EventDef {
  id: string
  title: string
  text: string
  choices: EventChoice[]
}

const chunk = (s: GameState, sec: number): Decimal => Decimal.max(100, referenceIncome(s).mul(sec))
const addHeat = (s: GameState, n: number) => {
  s.heat = Math.max(0, Math.min(99, s.heat + n))
}

export const EVENTS: EventDef[] = [
  {
    id: 'indic',
    title: 'Un indic’ te contacte',
    text: 'Un type de la BAC propose de te refiler le planning des patrouilles. Contre une enveloppe, évidemment.',
    choices: [
      {
        label: 'Payer (10 % du cash)',
        hint: 'Chaleur −40',
        apply: (s) => {
          s.cash = s.cash.mul(0.9)
          addHeat(s, -40)
          return 'Tu sais où ils passent. La pression retombe.'
        },
      },
      { label: 'Refuser', apply: () => 'Tu n’as confiance en personne. Sage, peut-être.' },
    ],
  },
  {
    id: 'rival',
    title: 'Le gang des Mimosas débarque',
    text: 'Des rivaux squattent ton hall et vendent sur ton terrain.',
    choices: [
      {
        label: 'Les dégager',
        hint: '60 % : +5 respect · sinon chaleur +25',
        apply: (s) => {
          if (random() < 0.6) {
            s.respect += 5
            return 'Ils sont partis en courant. Le quartier a vu qui commande. +5 respect.'
          }
          addHeat(s, 25)
          s.cash = s.cash.mul(0.9)
          return 'Ça a dégénéré, les flics sont arrivés. Chaleur +25, 10 % du cash perdu.'
        },
      },
      {
        label: 'Négocier un partage (15 % du cash)',
        apply: (s) => {
          s.cash = s.cash.mul(0.85)
          return 'Paix armée. Pour l’instant.'
        },
      },
    ],
  },
  {
    id: 'camion',
    title: 'Tombé du camion',
    text: 'Un semi plein d’écrans plats « égarés ». Le chauffeur veut du cash, tout de suite.',
    choices: [
      {
        label: 'Investir 20 % du cash',
        hint: '70 % : ×2,5 · 30 % : tout perdre',
        apply: (s) => {
          const stake = s.cash.mul(0.2)
          s.cash = s.cash.sub(stake)
          if (random() < 0.7) {
            const gain = stake.mul(2.5)
            s.cash = s.cash.add(gain)
            s.stats.totalEarned = s.stats.totalEarned.add(gain)
            s.stats.runEarned = s.stats.runEarned.add(gain)
            return `Revendus en 2 heures. +${money(gain)}`
          }
          return 'Le camion était suivi. Marchandise saisie, mise perdue.'
        },
      },
      { label: 'Passer ton tour', apply: () => 'Trop beau pour être vrai.' },
    ],
  },
  {
    id: 'journaliste',
    title: 'Journaliste fouineur',
    text: 'Un pigiste de La Provence pose des questions sur ta laverie.',
    choices: [
      {
        label: 'L’acheter (15 % de l’argent propre)',
        apply: (s) => {
          s.clean = s.clean.mul(0.85)
          return 'Son article parlera finalement des pigeons du Vieux-Port.'
        },
      },
      {
        label: 'L’ignorer',
        hint: 'Chaleur +30',
        apply: (s) => {
          addHeat(s, 30)
          return 'L’article sort en une. Chaleur +30.'
        },
      },
    ],
  },
  {
    id: 'fete',
    title: 'Fête de quartier',
    text: 'L’asso du quartier cherche un sponsor pour le barbecue de l’été.',
    choices: [
      {
        label: 'Sponsoriser (5 % du cash)',
        hint: '+3 respect · chaleur −10',
        apply: (s) => {
          s.cash = s.cash.mul(0.95)
          s.respect += 3
          addHeat(s, -10)
          return 'Merguez offertes, le quartier t’adore. +3 respect.'
        },
      },
      { label: 'Pas le temps', apply: () => 'Les mamies du bloc C s’en souviendront.' },
    ],
  },
  {
    id: 'penurie',
    title: 'Pénurie chez les rivaux',
    text: 'Un gros coup de filet a frappé la concurrence. Toute la ville vient acheter chez toi.',
    choices: [
      {
        label: 'Augmenter les prix',
        hint: 'Revenus ×3 pendant 60 s · chaleur +15',
        apply: (s) => {
          s.buffs.push({ id: 'penurie', label: 'Pénurie ×3', mult: 3, remaining: 60 })
          addHeat(s, 15)
          return 'Les clients font la queue. Revenus ×3 pendant 60 s.'
        },
      },
      {
        label: 'Rester discret',
        hint: 'Revenus ×1,5 pendant 120 s',
        apply: (s) => {
          s.buffs.push({ id: 'penurie', label: 'Pénurie ×1,5', mult: 1.5, remaining: 120 })
          return 'Profil bas, mais caisse pleine. Revenus ×1,5 pendant 2 min.'
        },
      },
    ],
  },
  {
    id: 'fisc',
    title: 'Contrôle fiscal',
    text: 'Le fisc s’intéresse au chiffre d’affaires très impressionnant de ton kebab.',
    choices: [
      {
        label: 'Payer un redressement (20 % propre)',
        apply: (s) => {
          s.clean = s.clean.mul(0.8)
          return 'Dossier clos. Ça pique.'
        },
      },
      {
        label: 'Bidouiller les comptes',
        hint: '50 % : rien · 50 % : chaleur +35',
        apply: (s) => {
          if (random() < 0.5) return 'Les inspecteurs n’y ont vu que du feu.'
          addHeat(s, 35)
          return 'Faux grossier repéré. Chaleur +35.'
        },
      },
    ],
  },
  {
    id: 'cargaison',
    title: 'Cargaison à récupérer',
    text: 'Un go-fast arrive cette nuit sur l’autoroute. Il faut un convoi.',
    choices: [
      {
        label: 'Organiser le convoi',
        hint: '75 % : 3 min de revenus · chaleur +20',
        apply: (s) => {
          addHeat(s, 20)
          if (random() < 0.75) {
            const gain = chunk(s, 180)
            s.cash = s.cash.add(gain)
            s.stats.totalEarned = s.stats.totalEarned.add(gain)
            s.stats.runEarned = s.stats.runEarned.add(gain)
            return `Livraison réussie. +${money(gain)}`
          }
          return 'Barrage de gendarmerie. Tout est perdu.'
        },
      },
      { label: 'Trop risqué', apply: () => 'Quelqu’un d’autre prendra le risque.' },
    ],
  },
]

export const EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]))
