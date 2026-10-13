import mitt from 'mitt'
import type { GameEvent } from './types'

type Events = { game: GameEvent }

/** Bus d'événements moteur → UI (toasts, sons, confettis). */
export const bus = mitt<Events>()
