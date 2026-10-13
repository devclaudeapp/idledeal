import { BUSINESSES } from './businesses'
import { DISTRICTS } from './districts'
import type { GameState } from '../types'

export interface AchievementDef {
  id: string
  name: string
  desc: string
  check: (s: GameState) => boolean
}

const earned = (n: number) => (s: GameState) => s.stats.totalEarned.gte(n)
const maxLevel = (s: GameState) => Math.max(0, ...Object.values(s.businesses).map((b) => b.level))

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_k', name: 'Argent de poche', desc: 'Gagner 1 000 € au total', check: earned(1e3) },
  { id: 'first_m', name: 'Millionnaire du bloc', desc: 'Gagner 1 M€ au total', check: earned(1e6) },
  { id: 'first_md', name: 'Baron', desc: 'Gagner 1 Md€ au total', check: earned(1e9) },
  { id: 'first_bn', name: 'Empereur', desc: 'Gagner 1 Bn€ au total', check: earned(1e12) },
  { id: 'first_bd', name: 'Au-dessus des lois', desc: 'Gagner 1 Bd€ au total', check: earned(1e15) },
  { id: 'lvl25', name: 'Ça tourne', desc: 'Un business niveau 25', check: (s) => maxLevel(s) >= 25 },
  { id: 'lvl100', name: 'Industriel', desc: 'Un business niveau 100', check: (s) => maxLevel(s) >= 100 },
  { id: 'lvl300', name: 'Monopole', desc: 'Un business niveau 300', check: (s) => maxLevel(s) >= 300 },
  { id: 'manager', name: 'Délégation', desc: 'Engager un lieutenant', check: (s) => Object.values(s.businesses).some((b) => b.manager) },
  { id: 'all_managers', name: 'Organigramme complet', desc: 'Un lieutenant sur chaque business', check: (s) => BUSINESSES.every((b) => s.businesses[b.id]?.manager) },
  { id: 'clicks100', name: 'Charbonneur', desc: 'Charbonner 100 fois', check: (s) => s.stats.clicks >= 100 },
  { id: 'clicks1000', name: 'Infatigable', desc: 'Charbonner 1 000 fois', check: (s) => s.stats.clicks >= 1000 },
  { id: 'combo50', name: 'En feu', desc: 'Atteindre un combo de 50', check: (s) => s.stats.bestCombo >= 50 },
  { id: 'orders10', name: 'Livreur', desc: 'Livrer 10 commandes', check: (s) => s.stats.orders >= 10 },
  { id: 'orders100', name: 'Uber du crime', desc: 'Livrer 100 commandes', check: (s) => s.stats.orders >= 100 },
  { id: 'safe1', name: 'Doigts de fée', desc: 'Crocheter un coffre', check: (s) => s.stats.safesCracked >= 1 },
  { id: 'safe25', name: 'Arsène', desc: 'Crocheter 25 coffres', check: (s) => s.stats.safesCracked >= 25 },
  { id: 'heist1', name: 'Premier coup', desc: 'Réussir un braquage', check: (s) => s.stats.heists >= 1 },
  { id: 'heist25', name: 'Professionnel', desc: 'Réussir 25 braquages', check: (s) => s.stats.heists >= 25 },
  { id: 'raid1', name: 'Garde à vue', desc: 'Subir une descente', check: (s) => s.stats.raids >= 1 },
  { id: 'launder', name: 'Lessive', desc: 'Blanchir 1 M€', check: (s) => s.stats.totalLaundered.gte(1e6) },
  { id: 'launder_bn', name: 'Paradis fiscal', desc: 'Blanchir 1 Bn€', check: (s) => s.stats.totalLaundered.gte(1e12) },
  { id: 'corrupt', name: 'Bras long', desc: 'Corrompre 3 officiels', check: (s) => s.corruption.length >= 3 },
  { id: 'district3', name: 'Expansion', desc: 'Contrôler 3 quartiers', check: (s) => s.districts.length >= 3 },
  { id: 'city', name: 'Parrain de la ville', desc: 'Contrôler tous les quartiers', check: (s) => s.districts.length >= DISTRICTS.length },
  { id: 'prestige', name: 'Nouvelle identité', desc: 'Effectuer un prestige', check: (s) => s.stats.prestiges >= 1 },
]

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))
