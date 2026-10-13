# Idle Deal — Empire du crime

Jeu **idle / tycoon** dans le navigateur, sur le thème du crime organisé : deal de rue, racket, paris clandestins, labo, contrebande, faux billets, casino, cartel, ransomware… et braquages, blanchiment, corruption, guerre de territoire — le tout dans une **ville en 3D**, Port-Sombre, qui se transforme au fil de ta progression.

> Jeu de fiction. Les euros sont imaginaires, le crime ne paie pas.

## Lancer le jeu

```bash
npm install
npm run dev        # serveur de dev sur http://localhost:5173
npm test           # tests du moteur (Vitest)
npm run build      # build de production dans dist/
```

Le workflow `.github/workflows/deploy.yml` lance les tests puis publie le jeu sur **GitHub Pages** à chaque push sur `main` (activer *Settings → Pages → Source : GitHub Actions*). Le jeu est aussi une **PWA** installable qui fonctionne hors-ligne.

## La ville en 3D

Port-Sombre est générée de façon procédurale (aucun modèle à télécharger) et réagit en temps réel à la partie :

| Dans la ville | Lié à |
| --- | --- |
| 8 quartiers au style propre (cité, zone industrielle, docks, centre, corniche, aéroport, tours d’affaires, hôtel de ville) | Les quartiers non contrôlés restent éteints ; ceux que tu prends s’illuminent et sont cerclés de vert |
| Un bâtiment par business, qui grandit avec son niveau (dealers, garage à scooters, boutiques rackettées, PMU, labo fumant, conteneurs, imprimerie à faux billets, casino néon, jet du cartel, tour de serveurs) | Business et lieutenants |
| Façades de blanchiment (laverie, kebab, boîte de nuit avec faisceaux, yacht…) | Blanchiment |
| « +X € » qui s’envolent à chaque cycle terminé | Revenus |
| Ton QG grandit avec ton territoire, son enseigne vire au violet quand tu as de la légende | Territoire, prestige |
| Patrouilles de police plus nombreuses, hélico avec projecteur au-dessus de 65 de chaleur | Chaleur |
| Convoi de police qui fonce sur ton QG, caméra qui tremble | Descente |
| Voiture de l’équipe qui part vers la cible, anneau pulsant, pluie de billets à la réussite | Braquages |
| Scooters de livraison qui traversent la ville | Commandes clients |
| Clic sur le coin de deal = charbonner directement dans la ville | Partie manuelle |

Clique sur un bâtiment pour ouvrir l’onglet correspondant et y zoomer ; glisser pour tourner, molette pour zoomer. Sur ordinateur, le panneau de jeu se masque pour profiter de la vue. Options → Graphismes : *Bas* (sans post-traitement), *Moyen* (bloom), *Élevé* (ombres, antialiasing) ; la 3D peut aussi être désactivée.

## Le jeu

### La partie idle (ça tourne tout seul)

| Système | Principe |
| --- | --- |
| **Business** (10) | Achète des niveaux (×1 / ×10 / ×100 / MAX), coûts exponentiels. Paliers 25/50/100/200 : vitesse ×2 ; 300, 400… : revenus ×3. Un **lieutenant** automatise chaque business. |
| **Blanchiment** (8 façades) | Laverie, kebab, onglerie, boîte de nuit, société écran… convertissent l’argent **sale** en argent **propre** avec un rendement de 70 à 92 %. |
| **Chaleur** | Chaque business attire la police. À 100 : **descente**, une partie du cash est saisie. Le refroidissement est fixe + proportionnel à la chaleur. |
| **Corruption** (7 officiels) | Payés en argent propre : moins de chaleur, refroidissement plus rapide, saisies réduites. |
| **Améliorations** | Multiplicateurs payés en argent propre (business, blanchiment, clic, commandes, coffres, braquages, chaleur). |
| **Territoire** (8 quartiers de Port-Sombre) | Conquis avec respect + cash ; bonus globaux et déblocage des business avancés. |
| **Nouvelle identité** (prestige) | Repartir de zéro contre des points de **légende** (+2 % de revenus chacun, permanents). |
| **Hors-ligne** | Les lieutenants et les façades continuent de bosser jusqu’à 8 h pendant ton absence. |

### La partie manuelle (à faire soi-même)

| Action | Principe |
| --- | --- |
| **Charbonner** | Clicker : chaque vente rapporte 4 % du revenu/s (+1). Clique vite pour un **combo** jusqu’à ×3. |
| **Commandes clients** | Le téléphone jetable sonne : accepte la livraison, attends le trajet, puis **encaisse**. Les commandes expirent si tu traînes. |
| **Crocheter un coffre** | Mini-jeu de timing : arrête le crochet dans la zone verte, 3 serrures de plus en plus rapides (clic ou barre espace). |
| **Lancer un cycle** | Sans lieutenant, chaque cycle de business se lance à la main. |
| **Interventions de braquage** | Pendant un braquage surgissent des imprévus (alarme, vigile, caméra, sirènes…) : spamme le bouton à temps pour augmenter tes chances, sinon elles baissent. |
| **Descente de police** | 5 secondes pour spammer « Planquer ! » et sauver jusqu’à 80 % du cash menacé. |
| **Compter les billets** | Blanchiment à la main, à 90 % de rendement. |
| **Arroser / Profil bas** | Pot-de-vin ponctuel (chaleur −30) ou mise en sommeil (revenus ×0,25, la chaleur chute). |
| **Événements** | Indic, gang rival, camion « tombé », journaliste, contrôle fiscal, go-fast… des choix à faire, avec des risques. |
| **Équipe de braqueurs** | Recrute et forme gros bras, chauffeur, perceur, hacker et cerveau ; 7 cibles de la supérette à la Banque centrale. |

Plus : 26 succès (+1 % de revenus chacun), statistiques et graphiques, sauvegarde automatique, export/import de sauvegarde.

## Dépôts GitHub utilisés

| Projet | Dépôt | Rôle dans le jeu |
| --- | --- | --- |
| React | [facebook/react](https://github.com/facebook/react) | Interface |
| Vite | [vitejs/vite](https://github.com/vitejs/vite) | Serveur de dev et build |
| TypeScript | [microsoft/TypeScript](https://github.com/microsoft/TypeScript) | Typage |
| Zustand | [pmndrs/zustand](https://github.com/pmndrs/zustand) | Store du jeu |
| Immer | [immerjs/immer](https://github.com/immerjs/immer) | Mutations immuables du state (middleware Zustand) |
| break_eternity.js | [Patashu/break_eternity.js](https://github.com/Patashu/break_eternity.js) | Nombres gigantesques (standard des jeux incrémentaux) |
| lz-string | [pieroxy/lz-string](https://github.com/pieroxy/lz-string) | Compression des sauvegardes (localStorage + export) |
| mitt | [developit/mitt](https://github.com/developit/mitt) | Bus d’événements moteur → UI |
| Tailwind CSS | [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) | Styles |
| Motion | [motiondivision/motion](https://github.com/motiondivision/motion) | Animations (gains flottants, modales, transitions) |
| react-icons | [react-icons/react-icons](https://github.com/react-icons/react-icons) | Composants d’icônes |
| game-icons.net | [game-icons/icons](https://github.com/game-icons/icons) | Les icônes du jeu (CC BY 3.0) |
| Sonner | [emilkowalski/sonner](https://github.com/emilkowalski/sonner) | Notifications |
| canvas-confetti | [catdad/canvas-confetti](https://github.com/catdad/canvas-confetti) | Confettis (braquage réussi, prestige) |
| Recharts | [recharts/recharts](https://github.com/recharts/recharts) | Graphiques de revenus et de chaleur |
| ZzFX | [KilledByAPixel/ZzFX](https://github.com/KilledByAPixel/ZzFX) | Effets sonores procéduraux, sans fichier audio |
| Fontsource | [fontsource/fontsource](https://github.com/fontsource/fontsource) | Polices Bebas Neue et Inter auto-hébergées |
| clsx | [lukeed/clsx](https://github.com/lukeed/clsx) | Classes CSS conditionnelles |
| vite-plugin-pwa | [vite-pwa/vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa) | Installable + hors-ligne (Workbox) |
| three.js | [mrdoob/three.js](https://github.com/mrdoob/three.js) | Moteur 3D |
| React Three Fiber | [pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber) | Scène 3D déclarative en React |
| drei | [pmndrs/drei](https://github.com/pmndrs/drei) | Caméra, textes 3D, ciel étoilé, monitoring des performances |
| camera-controls | [yomotsu/camera-controls](https://github.com/yomotsu/camera-controls) | Caméra orbitale et vols animés vers les bâtiments |
| troika-three-text | [protectwise/troika](https://github.com/protectwise/troika) | Textes 3D (noms de quartiers, gains flottants) |
| postprocessing | [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) | Bloom des néons, vignette, tone mapping |
| react-postprocessing | [pmndrs/react-postprocessing](https://github.com/pmndrs/react-postprocessing) | Post-traitement en React |
| maath | [pmndrs/maath](https://github.com/pmndrs/maath) | Amortissement des mouvements des véhicules |
| Vitest | [vitest-dev/vitest](https://github.com/vitest-dev/vitest) | Tests du moteur |
| GitHub Actions | [actions/checkout](https://github.com/actions/checkout), [actions/setup-node](https://github.com/actions/setup-node), [actions/upload-pages-artifact](https://github.com/actions/upload-pages-artifact), [actions/deploy-pages](https://github.com/actions/deploy-pages) | CI et déploiement |

Icônes : [game-icons.net](https://game-icons.net) par Lorc, Delapouite et contributeurs, licence [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).

## Architecture

```
src/
  game/                 moteur pur, sans React (testé avec Vitest)
    data/               contenu : business, façades, braquages, équipe, quartiers,
                        corruption, améliorations, événements, succès, commandes
    economy.ts          formules dérivées (revenus, coûts, chaleur, chances…)
    engine.ts           tick(state, dt) et simulation hors-ligne
    actions.ts          actions du joueur (acheter, braquer, charbonner, livrer…)
    save.ts             sérialisation des Decimal + compression lz-string
    store.ts            store Zustand + Immer
  three/                la ville 3D
    layout.ts           plan de la ville : quartiers, routes, emplacements, génération procédurale
    materials.ts        shader de façades (fenêtres calculées sur GPU), matériaux partagés
    Districts.tsx       sol, immeubles instanciés, routes, mer, décors de quartier
    Landmarks.tsx       bâtiments liés au jeu (business, façades, cibles, QG)
    Actors.tsx          circulation, police, hélico, voiture de braquage, livraisons
    fx.tsx              gains flottants, pluie de billets, anneaux
    City.tsx            canvas, caméra, lumières, post-traitement
  components/           onglets et fenêtres (descente, intervention, événement…)
  ui/                   icônes, sons, historique des graphiques, état d’interface
```

Le moteur avance par pas de 100 ms. Toute la logique de jeu est dans `src/game/` et se teste sans navigateur. Pour ajouter du contenu, il suffit en général d’ajouter une entrée dans `src/game/data/`.
