import { LOCOMOTION } from './types'
import type {
  EffectiveStats,
  Entrant,
  Mode,
  RaceResult,
  RacingStats,
} from './types'

export const MAX_NUMBER = 1e9
export const MIN_MASS = 1e-6
export const MIN_POSITIVE = 1e-9
export const fields: {
  key: keyof RacingStats
  label: string
  unit: string
  step: number
  min: number
}[] = [
  { key: 'mass', label: 'Body mass', unit: 'kg', step: 1, min: MIN_MASS },
  { key: 'topSpeed', label: 'Sprint speed', unit: 'm/s', step: 0.5, min: 0 },
  {
    key: 'acceleration',
    label: 'Launch acceleration',
    unit: 'm/s²',
    step: 0.5,
    min: 0,
  },
  {
    key: 'sprint',
    label: 'Sprint reserve',
    unit: 's at top speed',
    step: 1,
    min: 0,
  },
  {
    key: 'sustainable',
    label: 'Sustainable pace',
    unit: 'm/s',
    step: 0.1,
    min: 0,
  },
  { key: 'fatigue', label: 'Fatigue rate', unit: '1/s', step: 0.01, min: 0 },
  { key: 'delay', label: 'Launch delay', unit: 's', step: 0.1, min: 0 },
]
export function validateStats(
  stats: RacingStats,
  mode: Mode = 'experimental',
): string | null {
  for (const f of fields) {
    if (
      !Number.isFinite(stats[f.key]) ||
      stats[f.key] < f.min ||
      stats[f.key] > MAX_NUMBER
    )
      return `${f.label} must be between ${f.min} and ${MAX_NUMBER.toLocaleString()}.`
    if (stats[f.key] > 0 && stats[f.key] < MIN_POSITIVE)
      return `${f.label} must be zero or at least ${MIN_POSITIVE} for numerical stability.`
  }
  if (mode === 'plausible') {
    if (
      stats.topSpeed > 40 ||
      stats.acceleration > 15 ||
      stats.sprint > 600 ||
      stats.sustainable > stats.topSpeed ||
      stats.fatigue > 2 ||
      stats.delay > 60
    )
      return 'Plausible mode uses speed ≤ 40 m/s, acceleration ≤ 15 m/s², reserve ≤ 600 s, sustainable pace ≤ sprint speed, fatigue ≤ 2/s and delay ≤ 60 s. Switch to Unrestricted for more.'
  }
  return null
}
export function effectiveStats(
  animal: Entrant,
  massEffects = true,
): EffectiveStats {
  const stats = animal.stats
  const ratio = massEffects ? animal.referenceMass / stats.mass : 1
  const profile = LOCOMOTION[animal.locomotion]
  const acceleration = stats.acceleration * Math.cbrt(ratio) * profile.launch
  const scale = Math.pow(ratio, 1 / 12)
  const topSpeed = stats.topSpeed * scale
  const accelerationTime = acceleration > 0 ? topSpeed / acceleration : Infinity
  return {
    ...stats,
    acceleration,
    topSpeed,
    sustainable: stats.sustainable * scale,
    fatigue: stats.fatigue * profile.fatigue,
    accelerationTime,
    cruiseEnd: accelerationTime + stats.sprint,
  }
}

/** Exact phase integrals: constant launch acceleration, sprint, exponential fade. */
export function motionAt(
  stats: EffectiveStats,
  clock: number,
): { distance: number; speed: number } {
  const t = Math.max(0, clock - stats.delay)
  if (t === 0 || stats.topSpeed === 0 || stats.acceleration === 0)
    return { distance: 0, speed: 0 }
  if (t <= stats.accelerationTime)
    return {
      distance: 0.5 * stats.acceleration * t * t,
      speed: stats.acceleration * t,
    }
  const launchDistance = 0.5 * stats.topSpeed * stats.accelerationTime
  if (t <= stats.cruiseEnd)
    return {
      distance: launchDistance + stats.topSpeed * (t - stats.accelerationTime),
      speed: stats.topSpeed,
    }
  const u = t - stats.cruiseEnd
  const initialDistance = launchDistance + stats.topSpeed * stats.sprint
  if (stats.fatigue === 0)
    return {
      distance: initialDistance + stats.topSpeed * u,
      speed: stats.topSpeed,
    }
  const z = stats.fatigue * u
  const faded = -Math.expm1(-z)
  if (stats.sustainable > stats.topSpeed) {
    // Experimental acceleration toward a higher sustainable speed. This series
    // avoids subtracting nearly equal, huge distances at very small z.
    const rampIntegral =
      z < 1e-4
        ? u * z * (0.5 - z / 6 + (z * z) / 24 - (z * z * z) / 120)
        : u - faded / stats.fatigue
    return {
      distance:
        initialDistance +
        stats.topSpeed * u +
        (stats.sustainable - stats.topSpeed) * rampIntegral,
      speed: stats.topSpeed + (stats.sustainable - stats.topSpeed) * faded,
    }
  }
  const remaining = Math.exp(-z)
  // expm1 prevents catastrophic cancellation for tiny fatigue * elapsed time.
  return {
    distance:
      initialDistance +
      stats.sustainable * u +
      ((stats.topSpeed - stats.sustainable) * faded) / stats.fatigue,
    speed: stats.sustainable + (stats.topSpeed - stats.sustainable) * remaining,
  }
}

export function finishTime(
  stats: EffectiveStats,
  distance: number,
): number | null {
  if (!(distance > 0) || !Number.isFinite(distance))
    throw new Error('Race distance must be finite and positive.')
  if (stats.topSpeed === 0 || stats.acceleration === 0) return null
  const launchDistance = 0.5 * stats.topSpeed * stats.accelerationTime
  if (distance <= launchDistance) {
    const finish = stats.delay + Math.sqrt((2 * distance) / stats.acceleration)
    return finish <= 1e15 ? finish : null
  }
  const cruiseDistance = launchDistance + stats.topSpeed * stats.sprint
  if (distance <= cruiseDistance || stats.fatigue === 0) {
    const finish =
      stats.delay +
      stats.accelerationTime +
      (distance - launchDistance) / stats.topSpeed
    return finish <= 1e15 ? finish : null
  }
  if (
    stats.sustainable === 0 &&
    distance >= cruiseDistance + stats.topSpeed / stats.fatigue
  )
    return null
  let low = stats.delay + stats.cruiseEnd
  let high =
    low +
    Math.max(
      1,
      (distance - cruiseDistance) / (stats.sustainable || stats.topSpeed),
    )
  // Supported numerical horizon: 10^15 seconds (over 30 million years).
  while (motionAt(stats, high).distance < distance && high < 1e15)
    high = Math.min(1e15, stats.delay + (high - stats.delay) * 2 + 1)
  if (motionAt(stats, high).distance < distance) return null
  for (let i = 0; i < 80; i++) {
    const middle = (low + high) / 2
    if (motionAt(stats, middle).distance < distance) low = middle
    else high = middle
  }
  return (low + high) / 2
}
export function simulate(
  entrants: Entrant[],
  distance: number,
  massEffects = true,
): RaceResult[] {
  return entrants
    .map((animal) => {
      const error = validateStats(animal.stats)
      if (error) throw new Error(`${animal.name}: ${error}`)
      const effective = effectiveStats(animal, massEffects)
      const finish = finishTime(effective, distance)
      const launchPeak =
        effective.acceleration === 0 || effective.topSpeed === 0
          ? 0
          : finish === null
            ? effective.topSpeed
            : Math.min(
                effective.topSpeed,
                effective.acceleration * Math.max(0, finish - effective.delay),
              )
      const peak = Math.max(
        launchPeak,
        finish === null ? 0 : motionAt(effective, finish).speed,
      )
      return {
        animal,
        effective,
        finish,
        average: finish ? distance / finish : 0,
        peak,
      }
    })
    .sort((a, b) => (a.finish ?? Infinity) - (b.finish ?? Infinity))
}
export function formatTime(seconds: number | null, precise = true): string {
  if (seconds === null || !Number.isFinite(seconds)) return 'DNF'
  if (seconds < 0.01 && seconds > 0) return `${seconds.toExponential(2)} s`
  if (seconds < 60) return `${seconds.toFixed(precise ? 2 : 1)} s`
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(precise ? 1 : 0)}s`
  if (seconds < 86400)
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  return `${(seconds / 86400).toFixed(1)} days`
}
export const formatDistance = (distance: number) =>
  distance >= 1000 ? `${distance / 1000} km` : `${distance} m`
export const speedKmh = (speed: number) =>
  (speed * 3.6).toLocaleString(undefined, { maximumFractionDigits: 1 })
