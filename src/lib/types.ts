export type Locomotion = 'gallop' | 'bound' | 'biped' | 'waddle' | 'crawl'
export type Mode = 'plausible' | 'experimental'
export interface RacingStats {
  mass: number
  topSpeed: number
  acceleration: number
  sprint: number
  sustainable: number
  fatigue: number
  delay: number
}
export interface Animal {
  id: string
  name: string
  scientific: string
  emoji: string
  color: string
  category: 'Sprinters' | 'Distance stars' | 'Heavyweights' | 'Wildcards'
  locomotion: Locomotion
  description: string
  biology: string
  source: 'adw' | 'cheetah' | 'human'
  stats: RacingStats
}
export interface Entrant extends Animal {
  referenceMass: number
  custom?: boolean
}
export interface EffectiveStats extends RacingStats {
  accelerationTime: number
  cruiseEnd: number
}
export interface RaceResult {
  animal: Entrant
  finish: number | null
  peak: number
  average: number
  effective: EffectiveStats
}
export interface RaceSettings {
  distance: number
  mode: Mode
  massEffects: boolean
  entrants: Entrant[]
  playback: number
}
export interface SavedAnimal {
  id: string
  savedAt: string
  animal: Entrant
}
export const LOCOMOTION: Record<
  Locomotion,
  { label: string; launch: number; fatigue: number }
> = {
  gallop: { label: 'Gallop / run', launch: 1, fatigue: 1 },
  bound: { label: 'Hop / bound', launch: 0.9, fatigue: 0.9 },
  biped: { label: 'Bipedal run', launch: 0.85, fatigue: 0.85 },
  waddle: { label: 'Waddle / shuffle', launch: 0.65, fatigue: 1.15 },
  crawl: { label: 'Crawl / haul', launch: 0.55, fatigue: 1.2 },
}
