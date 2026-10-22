import { simulate } from './simulation'
import type { Entrant } from './types'

// Inclusive upper bounds, relative to the fastest unedited league preset at
// this distance. A filter, lineup edit, or monster never moves the benchmark.
export const DIVISIONS = [
  {
    id: 'elite',
    label: 'Elite pace',
    maxRatio: 1.5,
    range: '≤ 1.5× benchmark',
    description: 'Sprint royalty. Endurance heroes. Distance decides.',
  },
  {
    id: 'contenders',
    label: 'Contenders',
    maxRatio: 3,
    range: '> 1.5–3× benchmark',
    description: 'Fast company. Bring your competitive face.',
  },
  {
    id: 'club',
    label: 'Club racers',
    maxRatio: 8,
    range: '> 3–8× benchmark',
    description: 'A respectable hustle with room for snacks.',
  },
  {
    id: 'leisure',
    label: 'Leisure league',
    maxRatio: 30,
    range: '> 8–30× benchmark',
    description: 'The finish line is more of a suggestion about timing.',
  },
  {
    id: 'scenic',
    label: 'Scenic route',
    maxRatio: 300,
    range: '> 30–300× benchmark',
    description: 'Every metre deserves to be appreciated.',
  },
  {
    id: 'geological',
    label: 'Geological time',
    maxRatio: Infinity,
    range: '> 300× benchmark',
    description: 'The calendar has entered the chat.',
  },
  {
    id: 'dnf',
    label: 'No predicted finish',
    maxRatio: null,
    range: 'DNF under the model',
    description: 'Not a slow finish: no finish within the model’s horizon.',
  },
] as const
export type DivisionId = (typeof DIVISIONS)[number]['id']
export interface DivisionPrediction {
  finish: number | null
  ratio: number | null
  division: (typeof DIVISIONS)[number]
}
export function divisionForTime(finish: number | null, benchmark: number) {
  if (!Number.isFinite(benchmark) || benchmark <= 0)
    throw new Error('Division benchmark must be finite and positive.')
  if (finish === null || !Number.isFinite(finish) || finish <= 0)
    return DIVISIONS[DIVISIONS.length - 1]
  return DIVISIONS.find(
    (division) =>
      division.maxRatio !== null && finish / benchmark <= division.maxRatio,
  )!
}
export type FinishPredictor = (
  animal: Entrant,
  distance: number,
  massEffects: boolean,
) => number | null
const predictFinish: FinishPredictor = (animal, distance, massEffects) =>
  simulate([animal], distance, massEffects)[0].finish

/** Complete physics signature; excludes names, colors, and mutable object identity. */
export function racingSignature(animal: Entrant): string {
  const s = animal.stats
  return [
    animal.locomotion,
    animal.referenceMass,
    s.mass,
    s.topSpeed,
    s.acceleration,
    s.sprint,
    s.sustainable,
    s.fatigue,
    s.delay,
  ].join('|')
}
function cached<K, V>(
  cache: Map<K, V>,
  key: K,
  calculate: () => V,
  limit: number,
): V {
  if (cache.has(key)) {
    const value = cache.get(key)!
    cache.delete(key)
    cache.set(key, value)
    return value
  }
  const value = calculate()
  cache.set(key, value)
  if (cache.size > limit) cache.delete(cache.keys().next().value!)
  return value
}
export function createDivisionClassifier(
  reference: readonly Entrant[],
  predict: FinishPredictor = predictFinish,
) {
  if (!reference.length) throw new Error('Divisions need a reference roster.')
  // Capture a stable baseline even if a caller later edits its input objects.
  const defaults = reference.map((a) => ({ ...a, stats: { ...a.stats } }))
  const finishes = new Map<string, number | null>()
  const benchmarks = new Map<number, number>()
  function finish(animal: Entrant, distance: number, massEffects: boolean) {
    if (!Number.isFinite(distance) || distance <= 0)
      throw new Error('Division distance must be finite and positive.')
    return cached(
      finishes,
      `${distance}|${massEffects}|${racingSignature(animal)}`,
      () => predict(animal, distance, massEffects),
      4096,
    )
  }
  function benchmark(distance: number): number {
    return cached(
      benchmarks,
      distance,
      () => {
        let fastest = Infinity
        for (const animal of defaults) {
          const time = finish(animal, distance, true)
          if (time !== null && time > 0) fastest = Math.min(fastest, time)
        }
        if (!Number.isFinite(fastest))
          throw new Error('The reference roster has no predicted finish.')
        return fastest
      },
      64,
    )
  }
  return {
    benchmark,
    classify(
      animal: Entrant,
      distance: number,
      massEffects: boolean,
    ): DivisionPrediction {
      const base = benchmark(distance)
      const time = finish(animal, distance, massEffects)
      return {
        finish: time,
        ratio: time !== null ? time / base : null,
        division: divisionForTime(time, base),
      }
    },
  }
}
