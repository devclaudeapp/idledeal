import { useState } from 'react'
import { toast } from 'sonner'
import { clearLocal, exportSave, importSave } from '../game/save'
import { newGameState } from '../game/state'
import { act, save, useGame } from '../game/store'
import { setMuted } from '../ui/sound'
import { useUi, type Quality } from '../ui/uiStore'
import { Btn, Card, SectionTitle } from './ui'

export const CREDITS: [string, string, string][] = [
  ['React', 'facebook/react', 'Interface'],
  ['Vite', 'vitejs/vite', 'Build & serveur de dev'],
  ['TypeScript', 'microsoft/TypeScript', 'Typage'],
  ['Zustand', 'pmndrs/zustand', 'État du jeu'],
  ['Immer', 'immerjs/immer', 'Mises à jour immuables'],
  ['break_eternity.js', 'Patashu/break_eternity.js', 'Très grands nombres'],
  ['lz-string', 'pieroxy/lz-string', 'Compression des sauvegardes'],
  ['mitt', 'developit/mitt', 'Bus d’événements'],
  ['Tailwind CSS', 'tailwindlabs/tailwindcss', 'Styles'],
  ['Motion', 'motiondivision/motion', 'Animations'],
  ['react-icons', 'react-icons/react-icons', 'Icônes'],
  ['game-icons.net', 'game-icons/icons', 'Icônes (CC BY 3.0, Lorc, Delapouite & co.)'],
  ['Sonner', 'emilkowalski/sonner', 'Notifications'],
  ['canvas-confetti', 'catdad/canvas-confetti', 'Confettis'],
  ['Recharts', 'recharts/recharts', 'Graphiques'],
  ['ZzFX', 'KilledByAPixel/ZzFX', 'Sons procéduraux'],
  ['Fontsource', 'fontsource/fontsource', 'Polices Bebas Neue & Inter'],
  ['clsx', 'lukeed/clsx', 'Classes CSS'],
  ['three.js', 'mrdoob/three.js', 'Moteur 3D'],
  ['React Three Fiber', 'pmndrs/react-three-fiber', 'Rendu 3D en React'],
  ['drei', 'pmndrs/drei', 'Caméra, textes 3D, étoiles, performances'],
  ['camera-controls', 'yomotsu/camera-controls', 'Caméra orbitale animée'],
  ['troika-three-text', 'protectwise/troika', 'Textes 3D'],
  ['postprocessing', 'pmndrs/postprocessing', 'Bloom, vignette, tone mapping'],
  ['react-postprocessing', 'pmndrs/react-postprocessing', 'Post-traitement en React'],
  ['maath', 'pmndrs/maath', 'Utilitaires mathématiques 3D'],
  ['vite-plugin-pwa', 'vite-pwa/vite-plugin-pwa', 'Installable / hors-ligne'],
  ['Vitest', 'vitest-dev/vitest', 'Tests'],
]

export function Options() {
  const muted = useGame((s) => s.game.muted)
  const quality = useUi((s) => s.quality)
  const enable3d = useUi((s) => s.enable3d)
  const [text, setText] = useState('')
  const [reset, setReset] = useState(false)

  return (
    <div>
      <SectionTitle>Options</SectionTitle>
      <div className="grid gap-3 @2xl:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!muted}
              onChange={() => {
                const m = act((s) => (s.muted = !s.muted))
                setMuted(m)
              }}
            />
            Sons
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enable3d} onChange={() => useUi.getState().setEnable3d(!enable3d)} />
            Ville en 3D
          </label>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-400">Graphismes</span>
            {(['low', 'medium', 'high'] as Quality[]).map((q) => (
              <Btn key={q} tone={quality === q ? 'money' : 'neutral'} disabled={!enable3d} onClick={() => useUi.getState().setQuality(q)}>
                {{ low: 'Bas', medium: 'Moyen', high: 'Élevé' }[q]}
              </Btn>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => (save(), toast('Partie sauvegardée.'))}>Sauvegarder</Btn>
            <Btn
              onClick={async () => {
                const code = exportSave(useGame.getState().game)
                setText(code)
                try {
                  await navigator.clipboard.writeText(code)
                  toast('Sauvegarde copiée dans le presse-papier.')
                } catch {
                  toast('Sauvegarde exportée dans le champ ci-dessous.')
                }
              }}
            >
              Exporter
            </Btn>
            <Btn
              onClick={() => {
                const s = importSave(text)
                if (!s) return toast.error('Code de sauvegarde invalide.')
                useGame.getState().replace(s)
                save()
                toast.success('Sauvegarde importée.')
              }}
            >
              Importer
            </Btn>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Colle ici un code de sauvegarde…"
            className="h-24 w-full rounded-lg border border-line bg-black/40 p-2 font-mono text-xs"
          />
          <div className="border-t border-line pt-3">
            {!reset ? (
              <Btn tone="heat" onClick={() => setReset(true)}>Effacer la partie</Btn>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                Tout effacer, légende comprise ?
                <Btn
                  tone="heat"
                  onClick={() => {
                    clearLocal()
                    useGame.getState().replace(newGameState())
                    setReset(false)
                  }}
                >
                  Oui
                </Btn>
                <Btn onClick={() => setReset(false)}>Non</Btn>
              </div>
            )}
          </div>
        </Card>
        <Card>
          <div className="mb-2 font-semibold">Construit avec des projets open source</div>
          <ul className="grid gap-1 text-sm @sm:grid-cols-2">
            {CREDITS.map(([name, repo, role]) => (
              <li key={repo}>
                <a className="text-clean hover:underline" href={`https://github.com/${repo}`} target="_blank" rel="noreferrer">
                  {name}
                </a>
                <span className="text-zinc-500"> — {role}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-500">
            Jeu de fiction. Aucune activité illégale n’est encouragée : le crime ne paie pas (sauf ici, en euros imaginaires).
          </p>
        </Card>
      </div>
    </div>
  )
}
