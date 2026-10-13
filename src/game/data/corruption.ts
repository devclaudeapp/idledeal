export interface CorruptionDef {
  id: string
  name: string
  desc: string
  /** Coût en argent propre. */
  cost: number
  heatMult: number
  decayAdd: number
  raidLossMult: number
}

export const CORRUPTION: CorruptionDef[] = [
  { id: 'agent', name: 'Agent de quartier', desc: 'Il regarde ailleurs pendant ses rondes.', cost: 2000, heatMult: 0.9, decayAdd: 0.05, raidLossMult: 1 },
  { id: 'indic', name: 'Indic à la BAC', desc: 'Tu sais où ils vont frapper avant eux.', cost: 50000, heatMult: 0.9, decayAdd: 0.08, raidLossMult: 0.8 },
  { id: 'commissaire', name: 'Commissaire', desc: 'Des dossiers qui se perdent mystérieusement.', cost: 2e6, heatMult: 0.85, decayAdd: 0.1, raidLossMult: 0.9 },
  { id: 'juge', name: 'Juge d’instruction', desc: 'Vice de procédure, encore.', cost: 1e8, heatMult: 0.85, decayAdd: 0.1, raidLossMult: 0.7 },
  { id: 'prefet', name: 'Préfet', desc: 'Les priorités de la police changent.', cost: 5e9, heatMult: 0.8, decayAdd: 0.15, raidLossMult: 0.9 },
  { id: 'depute', name: 'Député', desc: 'Il vote les lois, toi tu les écris.', cost: 3e11, heatMult: 0.8, decayAdd: 0.2, raidLossMult: 0.8 },
  { id: 'ministre', name: 'Ministre de l’Intérieur', desc: 'Intouchable.', cost: 2e13, heatMult: 0.7, decayAdd: 0.3, raidLossMult: 0.5 },
]

export const CORRUPTION_BY_ID = Object.fromEntries(CORRUPTION.map((c) => [c.id, c]))
