import { useMemo, useRef, useState } from 'react'
import { Check, Plus, Search, Trophy, X } from 'lucide-react'
import { ANIMALS, toEntrant } from '../data/animals'
import { BIOLOGICAL_GROUPS, groupLabel } from '../data/taxonomy'
import { DIVISIONS } from '../lib/divisions'
import { formatDistance, formatTime } from '../lib/simulation'
import {
  filterRoster,
  leagueDivisions,
  matchedLineup,
  matchingAnchor,
  ROSTER_PAGE_SIZE,
  rosterEntries,
  sameConfiguration,
  toggleCompetitor,
} from '../lib/roster'
import type { RosterFilters } from '../lib/roster'
import type { Entrant, SavedAnimal } from '../lib/types'
import { AnimalAvatar } from './AnimalAvatar'

const SPECIES = ANIMALS.map(toEntrant)
const INITIAL_FILTERS: RosterFilters = {
  search: '',
  group: 'all',
  division: 'all',
  source: 'species',
}
export function Roster({
  entrants,
  library,
  distance,
  massEffects,
  onDistance,
  onChange,
  onClose,
  onMatch,
}: {
  entrants: Entrant[]
  library: SavedAnimal[]
  distance: number
  massEffects: boolean
  onDistance: (distance: number) => void
  onChange: (entrants: Entrant[]) => void
  onClose: () => void
  onMatch: (entrants: Entrant[]) => void
}) {
  const [filters, setFilters] = useState<RosterFilters>(INITIAL_FILTERS)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  const [anchorKey, setAnchorKey] = useState('')
  const entries = useMemo(
    () => rosterEntries(SPECIES, entrants, library, distance, massEffects),
    [entrants, library, distance, massEffects],
  )
  const active = useMemo(
    () => new Map(entrants.map((a) => [a.id, a])),
    [entrants],
  )
  const groupCandidates = useMemo(
    () => filterRoster(entries, { ...filters, group: 'all', division: 'all' }),
    [entries, filters],
  )
  const candidates = useMemo(
    () => filterRoster(entries, { ...filters, division: 'all' }),
    [entries, filters],
  )
  const filtered = useMemo(
    () => filterRoster(entries, filters),
    [entries, filters],
  )
  const divisionCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const entry of candidates)
      counts.set(
        entry.prediction.division.id,
        (counts.get(entry.prediction.division.id) ?? 0) + 1,
      )
    return counts
  }, [candidates])
  const selectedDivision = DIVISIONS.find((d) => d.id === filters.division)
  const { finishers, anchor, match } = useMemo(() => {
    const finishers = filtered.filter(
      (entry) => entry.prediction.finish !== null,
    )
    const anchor = matchingAnchor(finishers, anchorKey)
    return {
      finishers,
      anchor,
      match: matchedLineup(filtered, anchor?.key),
    }
  }, [filtered, anchorKey])
  const pages = Math.max(1, Math.ceil(filtered.length / ROSTER_PAGE_SIZE))
  const currentPage = Math.min(page, pages - 1)
  const visible = filtered.slice(
    currentPage * ROSTER_PAGE_SIZE,
    (currentPage + 1) * ROSTER_PAGE_SIZE,
  )
  function changePage(next: number) {
    setPage(next)
    // Bring the fresh page into view and give keyboard users a useful starting point.
    requestAnimationFrame(() => {
      resultsRef.current?.focus({ preventScroll: true })
      resultsRef.current?.scrollIntoView({ block: 'start' })
    })
  }
  function changeFilters(patch: Partial<RosterFilters>) {
    setFilters((current) => ({ ...current, ...patch }))
    setPage(0)
    setAnchorKey('')
  }
  const benchmark = leagueDivisions.benchmark(distance)
  return (
    <div className="roster-content">
      <div className="modal-heading">
        <div>
          <span className="eyebrow">THE LEAGUE’S FINEST. AND A SNAIL.</span>
          <h2>Find your crowd.</h2>
          <p>{ANIMALS.length} species. All paces welcome.</p>
        </div>
        <button
          className="icon-button"
          aria-label="Close animal roster"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </div>
      <div className="roster-context">
        <div>
          <span className="eyebrow">PREDICTED DIVISIONS</span>
          <strong>{formatDistance(distance)} racing crowd</strong>
          <small>
            Current edits. Mass effects {massEffects ? 'on' : 'off'}.
          </small>
        </div>
        <label>
          Race distance
          <select
            aria-label="Roster race distance"
            value={distance}
            onChange={(e) => {
              onDistance(Number(e.target.value))
              setPage(0)
            }}
          >
            {[...new Set([25, 100, 250, 1000, 10000, distance])]
              .sort((a, b) => a - b)
              .map((d) => (
                <option key={d} value={d}>
                  {formatDistance(d)}
                </option>
              ))}
          </select>
        </label>
      </div>
      <div
        className="roster-source"
        role="group"
        aria-label="Competitor source"
      >
        <button
          className={`chip ${filters.source === 'species' ? 'selected' : ''}`}
          aria-pressed={filters.source === 'species'}
          onClick={() => changeFilters({ source: 'species' })}
        >
          Species roster ({ANIMALS.length})
        </button>
        <button
          className={`chip ${filters.source === 'saved' ? 'selected' : ''}`}
          aria-pressed={filters.source === 'saved'}
          onClick={() => changeFilters({ source: 'saved' })}
        >
          Saved stable ({library.length})
        </button>
      </div>
      <label className="search-box">
        <Search size={18} />
        <input
          autoFocus
          type="search"
          aria-label="Search animals"
          placeholder="Name, family, group, or scientific name…"
          value={filters.search}
          onChange={(e) => changeFilters({ search: e.target.value })}
        />
      </label>
      <div className="roster-filters">
        <label>
          Biological group
          <select
            aria-label="Biological group"
            value={filters.group}
            onChange={(e) =>
              changeFilters({ group: e.target.value as RosterFilters['group'] })
            }
          >
            <option value="all">
              All biological groups ({groupCandidates.length})
            </option>
            {BIOLOGICAL_GROUPS.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label} (
                {
                  filterRoster(groupCandidates, {
                    ...INITIAL_FILTERS,
                    source: filters.source,
                    group: group.id,
                  }).length
                }
                )
              </option>
            ))}
          </select>
        </label>
        <label>
          Competitive division
          <select
            aria-label="Competitive division"
            value={filters.division}
            onChange={(e) =>
              changeFilters({
                division: e.target.value as RosterFilters['division'],
              })
            }
          >
            <option value="all">All divisions ({candidates.length})</option>
            {DIVISIONS.map((division) => (
              <option key={division.id} value={division.id}>
                {division.label} ({divisionCounts.get(division.id) ?? 0})
              </option>
            ))}
          </select>
        </label>
      </div>
      <details className="division-explainer">
        <summary>
          How divisions work · benchmark {formatTime(benchmark)}
        </summary>
        <p>
          Predicted finish time ÷ the fastest default species at{' '}
          {formatDistance(distance)}. The full default roster sets the
          benchmark; filters and custom monsters never move it. These are game
          divisions, not biological rankings. DNF is separate from slow.
        </p>
        <ul>
          {DIVISIONS.map((division) => (
            <li key={division.id}>
              <strong>{division.label}</strong>
              <span>{division.range}</span>
            </li>
          ))}
        </ul>
        <p>
          “Big cats” is an informal browsing group including the cheetah.
          “Hoofed mammals” includes odd- and even-toed ungulates. Invertebrates
          is an umbrella group. Classification follows species identity, even
          for edited racers.
        </p>
      </details>
      <details className="matching-tools">
        <summary>
          <Trophy size={16} aria-hidden="true" /> Build a matched race
          <small>
            {match.length >= 2
              ? `${match.length} rivals in ${anchor?.prediction.division.label}`
              : 'Choose a crowd with similar predicted finishes'}
          </small>
        </summary>
        <div className="division-match">
          <Trophy size={23} aria-hidden="true" />
          <div>
            <strong>{selectedDivision?.label ?? 'Find a close contest'}</strong>
            <p>
              {selectedDivision?.description ??
                'Choose an anchor. We’ll find up to six nearby finishers in its division, within your filters.'}
            </p>
            <label className="match-anchor">
              Match pace with
              <select
                aria-label="Match pace with"
                value={anchor?.key ?? ''}
                disabled={!finishers.length}
                onChange={(e) => setAnchorKey(e.target.value)}
              >
                {!finishers.length && (
                  <option value="">No predicted finishers</option>
                )}
                {finishers.map((entry) => (
                  <option key={entry.key} value={entry.key}>
                    {entry.animal.name} · {formatTime(entry.prediction.finish)}
                  </option>
                ))}
              </select>
            </label>
            <small>
              {match.length >= 2
                ? `Replaces your lineup with ${match.length} competitors in ${anchor?.prediction.division.label}.`
                : 'At least two different species with predicted finishes are needed. Try another anchor or broader filters, or build a mixed race below.'}
            </small>
          </div>
          <button
            className="button dark"
            disabled={match.length < 2}
            onClick={() => onMatch(match)}
          >
            Race matched {match.length >= 2 ? match.length : 'crowd'}
          </button>
        </div>
      </details>
      <div className="roster-results-heading">
        <span role="status" aria-live="polite">
          {filtered.length}{' '}
          {filters.source === 'species' ? 'species' : 'saved configurations'}{' '}
          found
        </span>
        <button
          className="text-button"
          onClick={() => changeFilters(INITIAL_FILTERS)}
        >
          Clear filters
        </button>
      </div>
      <div
        className="roster-grid"
        ref={resultsRef}
        tabIndex={-1}
        role="group"
        aria-label="Species results"
        key={`${currentPage}:${filters.group}:${filters.division}:${filters.source}:${filters.search}`}
      >
        {visible.map((entry) => {
          const { animal, prediction } = entry
          const current = active.get(animal.id)
          const selected = !!current && sameConfiguration(current, animal)
          return (
            <button
              key={entry.key}
              className={`roster-card ${selected ? 'selected' : ''}`}
              aria-pressed={selected}
              disabled={selected && entrants.length === 1}
              onClick={() => onChange(toggleCompetitor(entrants, animal))}
            >
              <AnimalAvatar animal={animal} />
              <span className="roster-card-text">
                <strong>{animal.name}</strong>
                <small>
                  {groupLabel(animal.id)} ·{' '}
                  {entry.origin === 'saved'
                    ? 'Saved configuration'
                    : animal.custom
                      ? 'Current edit'
                      : 'Species preset'}
                </small>
                <span
                  className="division-badge"
                  data-division={prediction.division.id}
                >
                  {prediction.division.label} · {formatTime(prediction.finish)}
                </span>
                <span>{animal.description}</span>
              </span>
              <span className={`select-mark ${selected ? 'checked' : ''}`}>
                {selected ? <Check size={16} /> : <Plus size={16} />}
              </span>
            </button>
          )
        })}
      </div>
      {!filtered.length && (
        <div className="empty-state">
          {filters.source === 'saved' && !library.length
            ? 'Your stable is empty. Save a creation in the animal lab, then find its racing crowd here.'
            : 'No competitors match these filters. Broaden the group, division, or search. The snail is usually available.'}
        </div>
      )}
      {pages > 1 && (
        <nav className="roster-pagination" aria-label="Roster pages">
          <button
            className="button secondary"
            disabled={currentPage === 0}
            onClick={() => changePage(currentPage - 1)}
          >
            Previous page
          </button>
          <span>
            Page {currentPage + 1} of {pages}
          </span>
          <button
            className="button secondary"
            disabled={currentPage + 1 >= pages}
            onClick={() => changePage(currentPage + 1)}
          >
            Next page
          </button>
        </nav>
      )}
      <div className="modal-footer">
        <span>
          {entrants.length} competitor{entrants.length === 1 ? '' : 's'}{' '}
          selected<small>Any species. Any division. Mix freely.</small>
        </span>
        <button className="button primary" onClick={onClose}>
          Meet me at the start <Check size={17} />
        </button>
      </div>
    </div>
  )
}
