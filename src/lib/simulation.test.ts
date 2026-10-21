import { describe, expect, it } from 'vitest'
import { ANIMALS, toEntrant } from '../data/animals'
import {
  effectiveStats,
  finishTime,
  formatTime,
  motionAt,
  simulate,
  validateStats,
} from './simulation'
import type { Entrant } from './types'
function runner(patch: Partial<Entrant['stats']> = {}): Entrant {
  const animal = toEntrant(ANIMALS[0])
  return {
    ...animal,
    stats: {
      mass: 50,
      topSpeed: 10,
      acceleration: 2,
      sprint: 5,
      sustainable: 2,
      fatigue: 0.2,
      delay: 0,
      ...patch,
    },
  }
}
describe('analytical race phases', () => {
  it('integrates standing-start acceleration instead of dividing distance by top speed', () => {
    const stats = effectiveStats(runner(), false)
    expect(finishTime(stats, 9)).toBeCloseTo(3, 10)
    expect(motionAt(stats, 3)).toEqual({ distance: 9, speed: 6 })
  })
  it('crosses a finish between sample times accurately', () => {
    const stats = effectiveStats(runner(), false)
    const t = finishTime(stats, 7)!
    expect(t).toBeCloseTo(Math.sqrt(7), 12)
    expect(motionAt(stats, t).distance).toBeCloseTo(7, 10)
  })
  it('integrates the sprint plateau', () => {
    const stats = effectiveStats(runner(), false)
    expect(finishTime(stats, 50)).toBeCloseTo(7.5, 12)
    expect(motionAt(stats, 7.5)).toEqual({ distance: 50, speed: 10 })
  })
  it('keeps distance and speed continuous at both transitions', () => {
    const stats = effectiveStats(runner(), false)
    for (const t of [stats.accelerationTime, stats.cruiseEnd]) {
      const before = motionAt(stats, t - 1e-8),
        after = motionAt(stats, t + 1e-8)
      expect(before.distance).toBeCloseTo(after.distance, 5)
      expect(before.speed).toBeCloseTo(after.speed, 5)
    }
  })
  it('approaches sustainable pace in long races', () => {
    const stats = effectiveStats(runner(), false)
    const t = finishTime(stats, 10000)!
    expect(motionAt(stats, t).speed).toBeCloseTo(2, 8)
    expect(motionAt(stats, t).distance).toBeCloseTo(10000, 7)
    expect(t).toBeGreaterThan(4900)
  })
  it('adds launch delay exactly and remains still before launch', () => {
    const original = effectiveStats(runner(), false),
      delayed = effectiveStats(runner({ delay: 7.3 }), false)
    expect(motionAt(delayed, 7)).toEqual({ distance: 0, speed: 0 })
    expect(finishTime(delayed, 100)! - finishTime(original, 100)!).toBeCloseTo(
      7.3,
      10,
    )
  })
  it('handles zero sprint reserve and zero fatigue', () => {
    const instant = effectiveStats(runner({ sprint: 0 }), false)
    expect(motionAt(instant, 6).speed).toBeLessThan(10)
    const tireless = effectiveStats(runner({ fatigue: 0 }), false)
    expect(finishTime(tireless, 10000)).toBeCloseTo(1002.5)
  })
  it('does not turn tiny fatigue into a distance discontinuity', () => {
    const stats = effectiveStats(runner({ fatigue: 1e-9 }), false)
    expect(motionAt(stats, 11).distance).toBeCloseTo(85, 6)
  })
  it('allows an experimental sustainable pace greater than sprint speed', () => {
    const stats = effectiveStats(runner({ sustainable: 100 }), false)
    const t = finishTime(stats, 10000)!
    expect(motionAt(stats, t).distance).toBeCloseTo(10000, 7)
    expect(motionAt(stats, t).speed).toBeGreaterThan(10)
  })
  it('retains tiny distances and speeds when a monster ramps toward a huge pace', () => {
    const stats = effectiveStats(
      runner({
        topSpeed: 1e-9,
        acceleration: 1,
        sprint: 0,
        sustainable: 1e9,
        fatigue: 1e-9,
      }),
      false,
    )
    const state = motionAt(stats, 2e-9)
    expect(state.distance / 2e-18).toBeCloseTo(1, 9)
    expect(state.speed / 2e-9).toBeCloseTo(1, 9)
    const finish = finishTime(stats, 10000)!
    expect(motionAt(stats, finish).distance).toBeCloseTo(10000, 6)
  })
})
describe('numerical and biological edge cases', () => {
  it.each([0, 1])(
    'returns DNF for a competitor unable to start (%s)',
    (field) => {
      const animal = runner(field ? { acceleration: 0 } : { topSpeed: 0 })
      const result = simulate([animal], 100)[0]
      expect(result.finish).toBeNull()
      expect(result.peak).toBe(0)
      expect(result.average).toBe(0)
    },
  )
  it('reports a competitor that asymptotically stops short as DNF', () => {
    const stats = effectiveStats(runner({ sustainable: 0 }), false)
    // 25 m launch + 50 m sprint + 50 m exponential tail = 125 m.
    expect(finishTime(stats, 126)).toBeNull()
    expect(finishTime(stats, 125)).toBeNull()
    expect(finishTime(stats, 124)).not.toBeNull()
  })
  it('preserves finite results for a rocket hippo and microscopic delays', () => {
    const a = runner({
      mass: 1e-6,
      acceleration: 1e9,
      topSpeed: 1e9,
      sustainable: 1e9,
      sprint: 1e9,
      delay: 1e-9,
    })
    const r = simulate([a], 10000)[0]
    expect(r.finish).toBeGreaterThan(0)
    expect(Number.isFinite(r.peak)).toBe(true)
    expect(motionAt(r.effective, r.finish!).distance).toBeCloseTo(10000, 5)
  })
  it('supports a very slow but finishing competitor', () => {
    const r = simulate(
      [runner({ topSpeed: 1e-9, acceleration: 1e-9, sustainable: 1e-9 })],
      10000,
      false,
    )[0]
    expect(r.finish).not.toBeNull()
    expect(motionAt(r.effective, r.finish!).distance).toBeCloseTo(10000, 5)
  })
  it('rejects non-finite, negative and numerically unstable parameters explicitly', () => {
    for (const patch of [
      { acceleration: NaN },
      { topSpeed: Infinity },
      { mass: 0 },
      { sprint: -1 },
      { topSpeed: 1e-300 },
      { delay: 1e10 },
    ])
      expect(validateStats(runner(patch).stats)).not.toBeNull()
  })
  it('distinguishes plausible guardrails from unrestricted parameters', () => {
    const stats = runner({ topSpeed: 80, acceleration: 15 }).stats
    expect(validateStats(stats, 'plausible')).not.toBeNull()
    expect(validateStats(stats, 'experimental')).toBeNull()
  })
  it.each([0, -1, Infinity, NaN])('rejects invalid distance %s', (distance) => {
    expect(() => finishTime(effectiveStats(runner()), distance)).toThrow()
  })
  it('only applies mass scaling when enabled and includes locomotion', () => {
    const normal = runner(),
      heavy = runner({ mass: 400 })
    expect(effectiveStats(heavy).acceleration).toBeCloseTo(
      effectiveStats(normal).acceleration / 2,
    )
    expect(effectiveStats(heavy, false).acceleration).toEqual(
      effectiveStats(normal, false).acceleration,
    )
    expect(effectiveStats(heavy, false).topSpeed).toEqual(
      effectiveStats(normal, false).topSpeed,
    )
    expect(finishTime(effectiveStats(heavy, false), 100)).toEqual(
      finishTime(effectiveStats(normal, false), 100),
    )
    expect(
      effectiveStats({ ...normal, locomotion: 'crawl' }, false).acceleration,
    ).toBe(1.1)
  })
})
describe('league-level guarantees', () => {
  it('contains at least 30 unique, fully specified species with valid presets', () => {
    expect(ANIMALS.length).toBeGreaterThanOrEqual(30)
    expect(new Set(ANIMALS.map((a) => a.id)).size).toBe(ANIMALS.length)
    ANIMALS.forEach((a) => {
      expect(validateStats(a.stats, 'plausible')).toBeNull()
      expect(a.biology.length).toBeGreaterThan(20)
    })
  })
  it('has deterministic ordering, stable ties and DNF last', () => {
    const a = runner(),
      b = { ...runner(), id: 'other' },
      c = { ...runner({ acceleration: 0 }), id: 'stuck' }
    const results = simulate([c, a, b], 100)
    expect(results.map((r) => r.animal.id)).toEqual([a.id, 'other', 'stuck'])
    expect(results).toEqual(simulate([c, a, b], 100))
  })
  it('lets a sprinter win short and an endurance competitor win long', () => {
    const cheetah = toEntrant(ANIMALS.find((a) => a.id === 'cheetah')!)
    const horse = toEntrant(ANIMALS.find((a) => a.id === 'horse')!)
    expect(simulate([cheetah, horse], 100)[0].animal.id).toBe('cheetah')
    expect(simulate([cheetah, horse], 10000)[0].animal.id).toBe('horse')
  })
  it('all preset animals finish every supported comparison distance accurately', () => {
    const entrants = ANIMALS.map(toEntrant)
    for (const distance of [25, 100, 400, 1000, 5000, 10000]) {
      const results = simulate(entrants, distance)
      for (const result of results) {
        expect(result.finish).not.toBeNull()
        expect(motionAt(result.effective, result.finish!).distance).toBeCloseTo(
          distance,
          5,
        )
        expect(Number.isFinite(result.average)).toBe(true)
        expect(result.peak).toBeGreaterThan(0)
      }
    }
  })
  it('formats very long and tiny finishes honestly', () => {
    expect(formatTime(null)).toBe('DNF')
    expect(formatTime(172800)).toBe('2.0 days')
    expect(formatTime(0.000001)).toContain('e-6')
  })
})
