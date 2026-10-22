import { describe, expect, it, vi } from 'vitest'
import { ANIMALS, toEntrant } from '../data/animals'
import {
  createDivisionClassifier,
  DIVISIONS,
  divisionForTime,
} from './divisions'
import { simulate } from './simulation'
const species = ANIMALS.map(toEntrant)
const animal = (id: string) => toEntrant(ANIMALS.find((a) => a.id === id)!)
describe('predicted performance divisions', () => {
  it.each(DIVISIONS.slice(0, -2))(
    'uses an inclusive upper boundary for $label',
    (division) => {
      const boundary = division.maxRatio! * 10
      expect(divisionForTime(boundary, 10).id).toBe(division.id)
      expect(divisionForTime(boundary + 1e-7, 10).id).not.toBe(division.id)
    },
  )
  it('separates extremely slow finishes and DNFs; rejects invalid benchmarks', () => {
    expect(divisionForTime(3001, 10).id).toBe('geological')
    for (const time of [null, Infinity, NaN, 0, -1])
      expect(divisionForTime(time, 10).id).toBe('dnf')
    for (const base of [0, -1, Infinity, NaN])
      expect(() => divisionForTime(1, base)).toThrow()
    expect(() => createDivisionClassifier([])).toThrow()
  })
  it('uses actual simulation finishes and sensible distance-specific groups', () => {
    const classifier = createDivisionClassifier(species)
    for (const distance of [25, 250, 1000, 10000]) {
      const expected = simulate(species, distance)
      expect(classifier.benchmark(distance)).toBe(expected[0].finish)
      const predictions = species.map((a) =>
        classifier.classify(a, distance, true),
      )
      expect(
        new Set(predictions.map((p) => p.division.id)).size,
      ).toBeGreaterThanOrEqual(4)
      for (const result of expected)
        expect(classifier.classify(result.animal, distance, true).finish).toBe(
          result.finish,
        )
      expect(
        classifier.classify(animal('snail'), distance, true).division.id,
      ).toBe('geological')
    }
    expect(classifier.classify(animal('cheetah'), 25, true).division.id).toBe(
      'elite',
    )
    expect(
      classifier.classify(animal('cheetah'), 10000, true).division.id,
    ).toBe('club')
    expect(classifier.classify(animal('human'), 25, true).division.id).not.toBe(
      classifier.classify(animal('human'), 10000, true).division.id,
    )
  })
  it('recalculates for every physics input, without moving the benchmark', () => {
    const predictor = vi.fn((a, d, mass) => simulate([a], d, mass)[0].finish)
    const classifier = createDivisionClassifier(species, predictor)
    const hippo = animal('hippo')
    const benchmark = classifier.benchmark(10000)
    const before = classifier.classify(hippo, 10000, true)
    hippo.stats = {
      ...hippo.stats,
      acceleration: 15,
      topSpeed: 40,
      sustainable: 30,
      sprint: 600,
    }
    expect(classifier.classify(hippo, 10000, true).division.id).toBe('elite')
    expect(classifier.classify(hippo, 10000, true).finish).toBeLessThan(
      before.finish!,
    )
    expect(classifier.benchmark(10000)).toBe(benchmark)
    for (const field of [
      'mass',
      'topSpeed',
      'acceleration',
      'sprint',
      'sustainable',
      'fatigue',
      'delay',
    ] as const) {
      const changed = {
        ...hippo,
        stats: { ...hippo.stats, [field]: hippo.stats[field] + 0.25 },
      }
      const calls = predictor.mock.calls.length
      expect(classifier.classify(changed, 10000, true).finish).toBe(
        simulate([changed], 10000, true)[0].finish,
      )
      expect(predictor.mock.calls.length).toBe(calls + 1)
    }
    for (const changed of [
      { ...hippo, referenceMass: hippo.referenceMass * 2 },
      { ...hippo, locomotion: 'crawl' as const },
    ]) {
      const calls = predictor.mock.calls.length
      classifier.classify(changed, 10000, true)
      expect(predictor.mock.calls.length).toBe(calls + 1)
    }
    const heavy = { ...hippo, stats: { ...hippo.stats, mass: 1e8 } }
    expect(classifier.classify(heavy, 10000, true).finish).not.toBe(
      classifier.classify(heavy, 10000, false).finish,
    )
    const stopped = { ...hippo, stats: { ...hippo.stats, acceleration: 0 } }
    expect(classifier.classify(stopped, 10000, true).division.id).toBe('dnf')
    expect(
      classifier.classify(
        { ...hippo, stats: { ...hippo.stats, delay: 10000 } },
        25,
        false,
      ).division.id,
    ).toBe('geological')
  })
  it('handles the model’s numerical range and invalid distances', () => {
    const classifier = createDivisionClassifier(species)
    const monster = animal('hippo')
    monster.stats = {
      mass: 1e-6,
      topSpeed: 1e9,
      acceleration: 1e9,
      sustainable: 1e9,
      sprint: 1e9,
      fatigue: 0,
      delay: 0,
    }
    expect(classifier.classify(monster, 10000, true).division.id).toBe('elite')
    for (const distance of [0, -1, Infinity, NaN])
      expect(() => classifier.classify(monster, distance, true)).toThrow()
    expect(() =>
      createDivisionClassifier([
        { ...monster, stats: { ...monster.stats, acceleration: 0 } },
      ]).benchmark(25),
    ).toThrow()
  })
  it('captures the default benchmark independently of later edits', () => {
    const cheetah = animal('cheetah')
    const classifier = createDivisionClassifier([cheetah])
    const original = simulate([cheetah], 250)[0].finish
    cheetah.stats.topSpeed = 0
    expect(classifier.benchmark(250)).toBe(original)
    expect(classifier.classify(cheetah, 250, true).division.id).toBe('dnf')
  })
  it('reuses cached physics for 1,000 competitors and presentation-only edits', () => {
    const predictor = vi.fn((a, d, mass) => simulate([a], d, mass)[0].finish)
    const classifier = createDivisionClassifier(species, predictor)
    const racers = Array.from({ length: 1000 }, (_, i) => ({
      ...animal('horse'),
      id: `fixture-${i}`,
      stats: { ...animal('horse').stats, delay: i / 100 },
    }))
    const first = racers.map((a) => classifier.classify(a, 250, true))
    const calls = predictor.mock.calls.length
    const second = racers.map((a) =>
      classifier.classify(
        { ...a, name: 'New stage name', stats: { ...a.stats } },
        250,
        true,
      ),
    )
    expect(second).toEqual(first)
    expect(predictor.mock.calls.length).toBe(calls)
    expect(calls).toBeLessThanOrEqual(1036)
    classifier.classify(
      { ...racers[0], stats: { ...racers[0].stats, delay: 2000 } },
      250,
      true,
    )
    expect(predictor.mock.calls.length).toBe(calls + 1)
  })
  it('evicts bounded caches safely rather than accumulating every experiment', () => {
    const predictor = vi.fn(() => 10)
    const classifier = createDivisionClassifier([animal('horse')], predictor)
    for (let i = 1; i <= 4200; i++)
      classifier.classify(
        { ...animal('hippo'), stats: { ...animal('hippo').stats, delay: i } },
        25,
        true,
      )
    const calls = predictor.mock.calls.length
    classifier.classify(animal('horse'), 25, true)
    expect(predictor.mock.calls.length).toBe(calls + 1)
    for (let d = 26; d <= 90; d++) classifier.benchmark(d)
    const count = predictor.mock.calls.length
    classifier.benchmark(25)
    // Recomputed benchmark reuses its cached numerical forecast.
    expect(predictor.mock.calls.length).toBe(count)
  })
})
