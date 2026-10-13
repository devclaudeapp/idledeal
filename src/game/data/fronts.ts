export interface FrontDef {
  id: string
  name: string
  desc: string
  baseCost: number
  costMult: number
  /** Argent sale blanchi par seconde et par niveau. */
  capacity: number
  /** Part récupérée en argent propre. */
  efficiency: number
}

export const FRONTS: FrontDef[] = [
  { id: 'laverie', name: 'Laverie automatique', desc: 'Littéralement de l’argent qui passe à la machine.', baseCost: 500, costMult: 1.12, capacity: 5, efficiency: 0.7 },
  { id: 'kebab', name: 'Kebab « Chez Momo »', desc: '300 couverts déclarés par jour. 12 clients réels.', baseCost: 7500, costMult: 1.12, capacity: 60, efficiency: 0.72 },
  { id: 'carwash', name: 'Station de lavage', desc: 'Jamais vu autant de voitures propres.', baseCost: 1e5, costMult: 1.12, capacity: 700, efficiency: 0.75 },
  { id: 'onglerie', name: 'Onglerie', desc: 'Manucure au prix d’une Rolex.', baseCost: 1.5e6, costMult: 1.12, capacity: 9000, efficiency: 0.78 },
  { id: 'boite', name: 'Boîte de nuit', desc: 'Les bouteilles à 2000 € ne se vendent jamais. Officiellement si.', baseCost: 2.5e7, costMult: 1.12, capacity: 1.2e5, efficiency: 0.8 },
  { id: 'immo', name: 'Agence immobilière', desc: 'Achat cash, revente à prix d’or à soi-même.', baseCost: 4e8, costMult: 1.12, capacity: 1.6e6, efficiency: 0.85 },
  { id: 'offshore', name: 'Société écran aux Caïmans', desc: 'Une boîte aux lettres, 400 millions de chiffre.', baseCost: 8e9, costMult: 1.12, capacity: 2.5e7, efficiency: 0.9 },
  { id: 'mixer', name: 'Mixeur de cryptos', desc: 'Les jetons entrent sales, ressortent anonymes.', baseCost: 2e11, costMult: 1.12, capacity: 4e8, efficiency: 0.92 },
]

export const FRONT_BY_ID = Object.fromEntries(FRONTS.map((f) => [f.id, f]))
