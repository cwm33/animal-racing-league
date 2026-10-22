import { describe, expect, it } from 'vitest'
import { ANIMALS, toEntrant } from '../data/animals'
import {
  BIOLOGICAL_GROUPS,
  belongsToGroup,
  classificationFor,
  SPECIES_CLASSIFICATION,
} from '../data/taxonomy'
import {
  filterRoster,
  matchedLineup,
  matchingAnchor,
  ROSTER_PAGE_SIZE,
  rosterEntries,
  toggleCompetitor,
} from './roster'
import type { RosterFilters } from './roster'
const species = ANIMALS.map(toEntrant)
const filters: RosterFilters = {
  search: '',
  group: 'all',
  division: 'all',
  source: 'species',
}
const hippo = species.find((a) => a.id === 'hippo')!
describe('explicit biological metadata and roster operations', () => {
  it('covers exactly the canonical 100 species, using valid explicit groups', () => {
    expect(Object.keys(SPECIES_CLASSIFICATION).sort()).toEqual(
      ANIMALS.map((a) => a.id).sort(),
    )
    for (const a of ANIMALS) {
      const metadata = classificationFor(a.id)!
      expect(
        BIOLOGICAL_GROUPS.some((group) => group.id === metadata.groupId),
      ).toBe(true)
      if (a.id === 'velvet-worm') expect(metadata.order).toBeNull()
      else expect(metadata.order).toBeTruthy()
      expect(metadata.family).toBeTruthy()
    }
    expect(belongsToGroup('hippo', 'hoofed-mammals')).toBe(true)
    expect(belongsToGroup('hippo', 'mammals')).toBe(true)
    expect(belongsToGroup('hyena', 'canines')).toBe(false)
    expect(belongsToGroup('rabbit', 'rodents')).toBe(false)
    expect(belongsToGroup('platypus', 'birds')).toBe(false)
    expect(classificationFor('unknown')).toBeUndefined()
    expect(classificationFor('__proto__')).toBeUndefined()
  })
  it('combines category, multi-term search, division, and source filters', () => {
    const entries = rosterEntries(species, [], [], 250, true)
    expect(
      filterRoster(entries, { ...filters, group: 'big-cats' }),
    ).toHaveLength(3)
    expect(
      filterRoster(entries, { ...filters, search: 'canidae' }),
    ).toHaveLength(3)
    expect(
      filterRoster(entries, { ...filters, search: '  VULPES carnivora ' }).map(
        (e) => e.animal.id,
      ),
    ).toEqual(['fox'])
    expect(filterRoster(entries, { ...filters, group: 'birds' })).toHaveLength(
      16,
    )
    expect(
      filterRoster(entries, { ...filters, group: 'amphibians' }),
    ).toHaveLength(6)
    expect(
      filterRoster(entries, {
        ...filters,
        group: 'birds',
        division: 'geological',
      }),
    ).toEqual([])
    expect(
      filterRoster(entries, { ...filters, search: 'no such athlete' }),
    ).toEqual([])
  })
  it('classifies edited names by species and preserves saved variants', () => {
    const monster = {
      ...hippo,
      name: 'Bird Rocket',
      custom: true,
      stats: {
        ...hippo.stats,
        topSpeed: 40,
        acceleration: 15,
        sustainable: 30,
      },
    }
    const library = [{ id: 'saved-monster', savedAt: 'today', animal: monster }]
    const entries = rosterEntries(species, [monster], library, 10000, true)
    const current = filterRoster(entries, {
      ...filters,
      search: 'hippo',
      group: 'hoofed-mammals',
      division: 'elite',
    })
    expect(current).toHaveLength(1)
    expect(current[0].animal).toBe(monster)
    expect(
      filterRoster(entries, { ...filters, source: 'saved' })[0].animal,
    ).toBe(monster)
    expect(
      filterRoster(entries, { ...filters, search: 'rocket', group: 'birds' }),
    ).toEqual([])
    const saved = filterRoster(entries, { ...filters, source: 'saved' })[0]
    expect(toggleCompetitor([hippo], saved.animal)).toEqual([monster])
    expect(toggleCompetitor([monster], monster)).toEqual([monster])
    expect(toggleCompetitor([monster, species[0]], monster)).toEqual([
      species[0],
    ])
    expect(toggleCompetitor([species[0]], monster)).toEqual([
      species[0],
      monster,
    ])
  })
  it('matches the closest finishers deterministically, with unique species and no DNF', () => {
    const entries = rosterEntries(species, [], [], 1000, true)
    const anchor = entries.find((e) => e.animal.id === 'human')!
    const sameDivision = entries.filter(
      (e) => e.prediction.division.id === anchor.prediction.division.id,
    )
    const lineup = matchedLineup(sameDivision, anchor.key)
    expect(lineup[0].id).toBe('human')
    expect(lineup.length).toBeGreaterThanOrEqual(2)
    expect(lineup.length).toBeLessThanOrEqual(6)
    expect(new Set(lineup.map((a) => a.id)).size).toBe(lineup.length)
    expect(
      matchedLineup([...sameDivision, ...sameDivision], anchor.key),
    ).toEqual(lineup)
    expect(matchedLineup([], anchor.key)).toEqual([])
    const stopped = { ...hippo, stats: { ...hippo.stats, acceleration: 0 } }
    expect(matchedLineup(rosterEntries([stopped], [], [], 100, true))).toEqual(
      [],
    )
    const sorted = sameDivision
      .map((e) => e.prediction.finish!)
      .sort(
        (a, b) =>
          Math.abs(Math.log(a / anchor.prediction.finish!)) -
          Math.abs(Math.log(b / anchor.prediction.finish!)),
      )
    expect(
      lineup.map(
        (a) =>
          sameDivision.find((e) => e.animal.id === a.id)!.prediction.finish,
      ),
    ).toEqual(sorted.slice(0, 6))
  })
  it('keeps a chosen saved anchor even when another variant has the same finish time', () => {
    const entries = rosterEntries(species, [], [], 100, true)
    const original = entries[0]
    const variant = {
      ...original,
      key: 'saved:stage-name',
      animal: { ...original.animal, name: 'Cheetah in a Dinner Jacket' },
    }
    const lineup = matchedLineup([...entries, variant], variant.key)
    expect(lineup[0]).toBe(variant.animal)
    expect(lineup.filter((a) => a.id === original.animal.id)).toHaveLength(1)
    expect(
      lineup.every(
        (a) =>
          entries.find((e) => e.animal.id === a.id)!.prediction.division.id ===
          variant.prediction.division.id,
      ),
    ).toBe(true)
  })
  it('defaults matching to a division with at least two distinct species', () => {
    const entries = rosterEntries(species, [], [], 100, true)
    const birds = filterRoster(entries, { ...filters, group: 'birds' })
    const anchor = matchingAnchor(birds)!
    expect(anchor.prediction.finish).not.toBeNull()
    expect(matchedLineup(birds, anchor.key).length).toBeGreaterThanOrEqual(2)
    expect(matchingAnchor(birds, 'species:ostrich')?.animal.id).toBe('ostrich')
    expect(matchingAnchor([birds[0], birds[0]])).toBe(birds[0])
    expect(matchingAnchor([])).toBeUndefined()
  })
  it('filters a 1,000-entry roster and limits each asset page', () => {
    const thousand = Array.from({ length: 1000 }, (_, i) => ({
      ...hippo,
      id: `fixture-${i}`,
      name: `Racer ${i}`,
    }))
    const entries = rosterEntries(thousand, [], [], 250, true)
    expect(entries).toHaveLength(1000)
    expect(
      filterRoster(entries, { ...filters, search: 'racer 999' }).map(
        (e) => e.animal.name,
      ),
    ).toEqual(['Racer 999'])
    expect(
      filterRoster(entries, filters).slice(0, ROSTER_PAGE_SIZE),
    ).toHaveLength(36)
  })
})
