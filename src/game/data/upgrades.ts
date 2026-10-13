import { BUSINESSES } from './businesses'

export type UpgradeTarget = 'all' | 'launder' | 'click' | 'heat' | 'orders' | 'safe' | 'heist' | string

export interface UpgradeDef {
  id: string
  name: string
  desc: string
  /** Coût en argent propre. */
  cost: number
  target: UpgradeTarget
  mult: number
}

const FLAVOR: Record<string, [string, string, string]> = {
  deal: ['Coupe au lactose', 'Livraison à domicile', 'Appli de commande chiffrée'],
  scooter: ['Passe-partout', 'Atelier de démontage', 'Filière d’export vers l’Est'],
  racket: ['Batte cloutée', 'Contrats d’« assurance »', 'Syndicat des commerçants'],
  paris: ['Chiens dopés', 'Arbitres achetés', 'Plateforme de paris en ligne'],
  labo: ['Verrerie volée', 'La recette du Chimiste', 'Usine clandestine'],
  contrebande: ['Conteneurs à double fond', 'Douanier dans la poche', 'Cargo affrété'],
  fauxbillets: ['Papier fiduciaire', 'Hologrammes parfaits', 'Planches officielles volées'],
  casino: ['Dés pipés', 'Croupiers complices', 'Clientèle de nababs'],
  cartel: ['Réseau de mules', 'Sous-marin artisanal', 'Avion cargo'],
  ransomware: ['Phishing ciblé', 'Faille zero-day', 'Ransomware-as-a-Service'],
}

const TIERS = [
  { costMul: 25, mult: 3 },
  { costMul: 2500, mult: 3 },
  { costMul: 250000, mult: 5 },
]

const bizUpgrades: UpgradeDef[] = BUSINESSES.flatMap((b) =>
  TIERS.map((t, i) => ({
    id: `${b.id}_${i + 1}`,
    name: FLAVOR[b.id][i],
    desc: `${b.name} : revenus ×${t.mult}`,
    cost: b.baseCost * t.costMul,
    target: b.id,
    mult: t.mult,
  })),
)

const globalUpgrades: UpgradeDef[] = [
  { id: 'click_1', name: 'Sacoche banane', desc: 'Charbonner rapporte ×2', cost: 300, target: 'click', mult: 2 },
  { id: 'orders_1', name: 'Téléphone jetable', desc: 'Commandes clients ×2', cost: 3000, target: 'orders', mult: 2 },
  { id: 'launder_1', name: 'Comptable discret', desc: 'Capacité de blanchiment ×2', cost: 1e4, target: 'launder', mult: 2 },
  { id: 'safe_1', name: 'Stéthoscope', desc: 'Coffres crochetés ×2', cost: 2e4, target: 'safe', mult: 2 },
  { id: 'all_1', name: 'Réseau de guetteurs', desc: 'Tous les business ×2', cost: 5e4, target: 'all', mult: 2 },
  { id: 'heat_1', name: 'Avocat commis d’office', desc: 'Chaleur générée ×0,9', cost: 1e5, target: 'heat', mult: 0.9 },
  { id: 'heist_1', name: 'Plans volés au cadastre', desc: 'Butin des braquages ×2', cost: 5e5, target: 'heist', mult: 2 },
  { id: 'click_2', name: 'Scooter de livraison', desc: 'Charbonner rapporte ×3', cost: 1e6, target: 'click', mult: 3 },
  { id: 'launder_2', name: 'Expert-comptable véreux', desc: 'Capacité de blanchiment ×3', cost: 1e7, target: 'launder', mult: 3 },
  { id: 'all_2', name: 'Talkies cryptés', desc: 'Tous les business ×2', cost: 5e7, target: 'all', mult: 2 },
  { id: 'orders_2', name: 'Carnet de clients VIP', desc: 'Commandes clients ×3', cost: 5e8, target: 'orders', mult: 3 },
  { id: 'heat_2', name: 'Ténor du barreau', desc: 'Chaleur générée ×0,8', cost: 1e9, target: 'heat', mult: 0.8 },
  { id: 'safe_2', name: 'Perceuse diamant', desc: 'Coffres crochetés ×5', cost: 5e9, target: 'safe', mult: 5 },
  { id: 'launder_3', name: 'Banquier suisse', desc: 'Capacité de blanchiment ×5', cost: 1e10, target: 'launder', mult: 5 },
  { id: 'all_3', name: 'Téléphones EncroChat', desc: 'Tous les business ×3', cost: 5e10, target: 'all', mult: 3 },
  { id: 'heist_2', name: 'Ex-agent du GIGN', desc: 'Butin des braquages ×5', cost: 1e11, target: 'heist', mult: 5 },
  { id: 'click_3', name: 'Armée de charbonneurs', desc: 'Charbonner rapporte ×5', cost: 1e12, target: 'click', mult: 5 },
  { id: 'all_4', name: 'IA de planification', desc: 'Tous les business ×3', cost: 5e13, target: 'all', mult: 3 },
]

export const UPGRADES: UpgradeDef[] = [...globalUpgrades, ...bizUpgrades].sort((a, b) => a.cost - b.cost)

export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]))
