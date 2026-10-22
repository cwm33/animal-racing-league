import { ANIMALS, defaultEntrants } from '../data/animals'
import { validateStats } from './simulation'
import { LOCOMOTION } from './types'
import type { Entrant, RaceSettings, SavedAnimal } from './types'
const SETTINGS_KEY = 'arl:settings:v1'
const LIBRARY_KEY = 'arl:library:v1'
export const defaultSettings = (): RaceSettings => ({
  distance: 100,
  mode: 'plausible',
  massEffects: true,
  entrants: defaultEntrants(),
  playback: 1,
})
export function isEntrant(value: unknown): value is Entrant {
  if (!value || typeof value !== 'object') return false
  const a = value as Entrant
  return (
    ANIMALS.some((item) => item.id === a.id) &&
    typeof a.name === 'string' &&
    a.name.length > 0 &&
    a.name.length <= 60 &&
    typeof a.emoji === 'string' &&
    typeof a.color === 'string' &&
    typeof a.description === 'string' &&
    typeof a.scientific === 'string' &&
    typeof a.biology === 'string' &&
    ['adw', 'cheetah', 'human'].includes(a.source) &&
    Object.hasOwn(LOCOMOTION, a.locomotion) &&
    !!a.stats &&
    !validateStats(a.stats) &&
    Number.isFinite(a.referenceMass) &&
    a.referenceMass >= 1e-6 &&
    a.referenceMass <= 1e9
  )
}
export function loadSettings(): RaceSettings {
  try {
    const data = JSON.parse(
      localStorage.getItem(SETTINGS_KEY) || 'null',
    ) as RaceSettings | null
    if (
      !data ||
      !Array.isArray(data.entrants) ||
      data.entrants.length === 0 ||
      data.entrants.length > ANIMALS.length ||
      !data.entrants.every(isEntrant) ||
      new Set(data.entrants.map((a) => a.id)).size !== data.entrants.length ||
      !Number.isFinite(data.distance) ||
      data.distance < 25 ||
      data.distance > 10000 ||
      !['plausible', 'experimental'].includes(data.mode) ||
      typeof data.massEffects !== 'boolean' ||
      ![0.5, 1, 2, 5, 10].includes(data.playback)
    )
      return defaultSettings()
    if (
      data.mode === 'plausible' &&
      data.entrants.some((a) => validateStats(a.stats, 'plausible'))
    )
      data.mode = 'experimental'
    return data
  } catch {
    return defaultSettings()
  }
}
export function loadLibrary(): SavedAnimal[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(LIBRARY_KEY) || '[]')
    if (!Array.isArray(data)) return []
    return data
      .filter(
        (item): item is SavedAnimal =>
          !!item &&
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          typeof item.savedAt === 'string' &&
          isEntrant(item.animal),
      )
      .slice(0, 100)
  } catch {
    return []
  }
}
export function persist(
  key: 'settings' | 'library',
  value: RaceSettings | SavedAnimal[],
): boolean {
  try {
    localStorage.setItem(
      key === 'settings' ? SETTINGS_KEY : LIBRARY_KEY,
      JSON.stringify(value),
    )
    return true
  } catch {
    return false
  }
}
