export interface DistrictDef {
  id: string
  name: string
  desc: string
  respect: number
  cost: number
  globalMult?: number
  launderMult?: number
  heatMult?: number
  /** Position sur la carte (grille 4×2). */
  x: number
  y: number
}

export const DISTRICTS: DistrictDef[] = [
  { id: 'lilas', name: 'Cité des Lilas', desc: 'Là où tout a commencé. Tes tours, tes règles.', respect: 0, cost: 0, x: 0, y: 1 },
  { id: 'zi', name: 'Zone industrielle', desc: 'Hangars discrets. Débloque le labo.', respect: 5, cost: 5e4, globalMult: 1.1, x: 1, y: 1 },
  { id: 'docks', name: 'Les Docks', desc: 'Conteneurs et dockers arrangeants. Débloque la contrebande.', respect: 15, cost: 1e6, launderMult: 1.5, x: 2, y: 1 },
  { id: 'centre', name: 'Centre-ville', desc: 'Commerces, bureaux, imprimeries. Débloque les faux billets.', respect: 40, cost: 2e7, globalMult: 1.25, x: 1, y: 0 },
  { id: 'corniche', name: 'La Corniche', desc: 'Villas et restaurants chics. Débloque le casino.', respect: 100, cost: 5e8, heatMult: 0.85, x: 3, y: 1 },
  { id: 'aeroport', name: 'Aéroport', desc: 'Pistes privées, douaniers fatigués. Débloque le cartel.', respect: 250, cost: 2e10, globalMult: 1.5, x: 0, y: 0 },
  { id: 'affaires', name: 'Quartier d’affaires', desc: 'Tours de verre et serveurs. Débloque le ransomware.', respect: 600, cost: 1e12, launderMult: 2, x: 2, y: 0 },
  { id: 'mairie', name: 'Hôtel de ville', desc: 'La ville t’appartient.', respect: 1500, cost: 1e14, globalMult: 2, heatMult: 0.75, x: 3, y: 0 },
]

export const DISTRICT_BY_ID = Object.fromEntries(DISTRICTS.map((d) => [d.id, d]))
