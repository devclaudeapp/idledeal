export interface BusinessDef {
  id: string
  name: string
  desc: string
  baseCost: number
  costMult: number
  baseRevenue: number
  /** Durée d'un cycle en secondes. */
  cycle: number
  /** Chaleur générée (par seconde, pondérée par log2(1+niveau)). */
  heat: number
  managerName: string
  managerCost: number
  /** Quartier requis pour débloquer ce business. */
  district?: string
}

export const BUSINESSES: BusinessDef[] = [
  { id: 'deal', name: 'Deal au coin de rue', desc: 'Barrettes et pochons au pied du bloc B.', baseCost: 4, costMult: 1.07, baseRevenue: 1, cycle: 0.6, heat: 0.01, managerName: 'Le Guetteur', managerCost: 1000 },
  { id: 'scooter', name: 'Vol de scooters', desc: 'Démontés, revendus en pièces détachées.', baseCost: 60, costMult: 1.15, baseRevenue: 60, cycle: 3, heat: 0.02, managerName: 'Kévin la Clé', managerCost: 15000 },
  { id: 'racket', name: 'Racket des commerces', desc: '« Belle vitrine… ce serait dommage qu’elle se casse. »', baseCost: 720, costMult: 1.14, baseRevenue: 540, cycle: 6, heat: 0.03, managerName: 'Gros Marcel', managerCost: 100000 },
  { id: 'paris', name: 'Paris clandestins', desc: 'Courses de chiens, combats, matchs arrangés.', baseCost: 8640, costMult: 1.13, baseRevenue: 4320, cycle: 12, heat: 0.025, managerName: 'Le Bookmaker', managerCost: 500000 },
  { id: 'labo', name: 'Labo de synthèse', desc: 'Un hangar, des bidons, et un chimiste viré de la fac.', baseCost: 103680, costMult: 1.12, baseRevenue: 51840, cycle: 24, heat: 0.05, managerName: 'Le Chimiste', managerCost: 1.2e6, district: 'zi' },
  { id: 'contrebande', name: 'Contrebande portuaire', desc: 'Cigarettes, alcool et contrefaçons en conteneurs.', baseCost: 1.24416e6, costMult: 1.11, baseRevenue: 622080, cycle: 96, heat: 0.045, managerName: 'Le Docker', managerCost: 1e7, district: 'docks' },
  { id: 'fauxbillets', name: 'Faux billets', desc: 'Des coupures de 50 plus vraies que nature.', baseCost: 1.492992e7, costMult: 1.1, baseRevenue: 7.46496e6, cycle: 384, heat: 0.06, managerName: 'L’Imprimeur', managerCost: 1.11e8, district: 'centre' },
  { id: 'casino', name: 'Casino clandestin', desc: 'Roulette truquée dans l’arrière-salle d’un restaurant chic.', baseCost: 1.79159e8, costMult: 1.09, baseRevenue: 8.95795e7, cycle: 1536, heat: 0.05, managerName: 'Madame Rose', managerCost: 5.55e8, district: 'corniche' },
  { id: 'cartel', name: 'Import du cartel', desc: 'Des tonnes qui arrivent par avion privé.', baseCost: 2.149908e9, costMult: 1.08, baseRevenue: 1.074954e9, cycle: 6144, heat: 0.09, managerName: 'El Patrón', managerCost: 1e10, district: 'aeroport' },
  { id: 'ransomware', name: 'Ransomware', desc: 'Chiffre les serveurs, encaisse en crypto.', baseCost: 2.5798894e10, costMult: 1.07, baseRevenue: 2.9668737e10, cycle: 36864, heat: 0.04, managerName: 'Zéro_Cool', managerCost: 1e11, district: 'affaires' },
]

export const BUSINESS_BY_ID = Object.fromEntries(BUSINESSES.map((b) => [b.id, b]))

/** Paliers de niveau : vitesse x2 puis revenus x3. */
export const SPEED_MILESTONES = [25, 50, 100, 200]
export const REVENUE_MILESTONES = [300, 400, 500, 600, 700, 800, 900, 1000]

export function nextMilestone(level: number): number | null {
  const all = [...SPEED_MILESTONES, ...REVENUE_MILESTONES]
  return all.find((m) => m > level) ?? null
}
