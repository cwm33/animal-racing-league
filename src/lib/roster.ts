import { ANIMALS, toEntrant } from '../data/animals'
import { belongsToGroup, classificationFor, groupLabel } from '../data/taxonomy'
import type { BiologicalGroup } from '../data/taxonomy'
import { createDivisionClassifier, racingSignature } from './divisions'
import type { DivisionId, DivisionPrediction } from './divisions'
import type { Entrant, SavedAnimal } from './types'

export const leagueDivisions = createDivisionClassifier(ANIMALS.map(toEntrant))
export const ROSTER_PAGE_SIZE = 36
export interface RosterEntry {
  key: string
  animal: Entrant
  origin: 'species' | 'saved'
  searchText: string
  prediction: DivisionPrediction
}
export function sameConfiguration(a: Entrant, b: Entrant): boolean {
  return (
    a.id === b.id &&
    a.name === b.name &&
    racingSignature(a) === racingSignature(b)
  )
}
export function rosterEntries(
  species: readonly Entrant[],
  entrants: readonly Entrant[],
  library: readonly SavedAnimal[],
  distance: number,
  massEffects: boolean,
  classifier = leagueDivisions,
): RosterEntry[] {
  const active = new Map(entrants.map((a) => [a.id, a]))
  const originals = new Map(species.map((a) => [a.id, a]))
  function entry(
    key: string,
    animal: Entrant,
    origin: RosterEntry['origin'],
  ): RosterEntry {
    const metadata = classificationFor(animal.id)
    return {
      key,
      animal,
      origin,
      searchText: [
        animal.name,
        originals.get(animal.id)?.name,
        animal.scientific,
        animal.description,
        groupLabel(animal.id),
        metadata?.classId,
        metadata?.order,
        metadata?.family,
      ]
        .join(' ')
        .normalize('NFKC')
        .toLowerCase(),
      prediction: classifier.classify(animal, distance, massEffects),
    }
  }
  return [
    ...species.map((a) =>
      entry(`species:${a.id}`, active.get(a.id) ?? a, 'species'),
    ),
    ...library.map((item) => entry(`saved:${item.id}`, item.animal, 'saved')),
  ]
}
export interface RosterFilters {
  search: string
  group: BiologicalGroup | 'all'
  division: DivisionId | 'all'
  source: 'species' | 'saved'
}
export function filterRoster(
  entries: readonly RosterEntry[],
  filters: RosterFilters,
): RosterEntry[] {
  const terms = filters.search
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  return entries.filter(
    (entry) =>
      entry.origin === filters.source &&
      (filters.group === 'all' ||
        belongsToGroup(entry.animal.id, filters.group)) &&
      (filters.division === 'all' ||
        entry.prediction.division.id === filters.division) &&
      terms.every((term) => entry.searchText.includes(term)),
  )
}
/** Prefer a crowd that can actually race, rather than an isolated fast outlier. */
export function matchingAnchor(
  entries: readonly RosterEntry[],
  preferredKey?: string,
): RosterEntry | undefined {
  const finishers = entries.filter((entry) => entry.prediction.finish !== null)
  const speciesByDivision = new Map<DivisionId, Set<string>>()
  for (const entry of finishers) {
    const id = entry.prediction.division.id
    if (!speciesByDivision.has(id)) speciesByDivision.set(id, new Set())
    speciesByDivision.get(id)!.add(entry.animal.id)
  }
  return (
    finishers.find((entry) => entry.key === preferredKey) ??
    finishers.find(
      (entry) => speciesByDivision.get(entry.prediction.division.id)!.size >= 2,
    ) ??
    finishers[0]
  )
}
/** Closest predicted finishing times on a log scale; no top-speed shortcut. */
export function matchedLineup(
  entries: readonly RosterEntry[],
  anchorKey?: string,
  count = 6,
): Entrant[] {
  const finishers = entries.filter((entry) => entry.prediction.finish !== null)
  const anchor =
    finishers.find((entry) => entry.key === anchorKey) ?? finishers[0]
  if (!anchor) return []
  const time = anchor.prediction.finish!
  const sorted = finishers
    .filter(
      (entry) => entry.prediction.division.id === anchor.prediction.division.id,
    )
    .map((entry, index) => ({
      entry,
      index,
      gap: Math.abs(Math.log(entry.prediction.finish! / time)),
    }))
    .sort(
      (a, b) =>
        a.gap - b.gap ||
        Number(b.entry.key === anchor.key) -
          Number(a.entry.key === anchor.key) ||
        a.index - b.index,
    )
  const chosen = new Map<string, Entrant>()
  for (const { entry } of sorted) {
    if (chosen.size >= count) break
    if (!chosen.has(entry.animal.id)) chosen.set(entry.animal.id, entry.animal)
  }
  return [...chosen.values()]
}
export function toggleCompetitor(
  entrants: Entrant[],
  animal: Entrant,
): Entrant[] {
  const existing = entrants.find((a) => a.id === animal.id)
  if (existing && sameConfiguration(existing, animal))
    return entrants.length > 1
      ? entrants.filter((a) => a.id !== animal.id)
      : entrants
  return existing
    ? entrants.map((a) => (a.id === animal.id ? animal : a))
    : [...entrants, animal]
}
