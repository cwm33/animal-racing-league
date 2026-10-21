import { useState } from 'react'
import { Check, Plus, Search, X } from 'lucide-react'
import { ANIMALS, toEntrant } from '../data/animals'
import type { Entrant } from '../lib/types'
import { AnimalAvatar } from './AnimalAvatar'
import { speedKmh } from '../lib/simulation'
export function Roster({
  entrants,
  onChange,
  onClose,
}: {
  entrants: Entrant[]
  onChange: (entrants: Entrant[]) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All animals')
  const filtered = ANIMALS.filter(
    (a) =>
      (category === 'All animals' || a.category === category) &&
      `${a.name} ${a.scientific} ${a.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  )
  return (
    <div className="roster-content">
      <div className="modal-heading">
        <div>
          <span className="eyebrow">THE LEAGUE’S FINEST. AND A SNAIL.</span>
          <h2>Choose your chaos.</h2>
          <p>{ANIMALS.length} species. Very different ideas of “fast”.</p>
        </div>
        <button
          className="icon-button"
          aria-label="Close animal roster"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </div>
      <label className="search-box">
        <Search size={18} />
        <input
          autoFocus
          type="search"
          placeholder="Search animals…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <div className="filter-row">
        {[
          'All animals',
          'Sprinters',
          'Distance stars',
          'Heavyweights',
          'Wildcards',
        ].map((c) => (
          <button
            key={c}
            className={`chip ${category === c ? 'selected' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="roster-grid">
        {filtered.map((animal) => {
          const selected = entrants.some((a) => a.id === animal.id)
          return (
            <button
              key={animal.id}
              className={`roster-card ${selected ? 'selected' : ''}`}
              aria-pressed={selected}
              disabled={selected && entrants.length === 1}
              onClick={() =>
                onChange(
                  selected
                    ? entrants.filter((a) => a.id !== animal.id)
                    : [...entrants, toEntrant(animal)],
                )
              }
            >
              <AnimalAvatar animal={animal} />
              <span className="roster-card-text">
                <strong>{animal.name}</strong>
                <small>
                  {animal.category} · {speedKmh(animal.stats.topSpeed)} km/h
                  preset
                </small>
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
          No athletes found. The committee suggests a different spelling.
        </div>
      )}
      <div className="modal-footer">
        <span>
          {entrants.length} competitor{entrants.length === 1 ? '' : 's'}{' '}
          selected
        </span>
        <button className="button primary" onClick={onClose}>
          Meet me at the start <Check size={17} />
        </button>
      </div>
    </div>
  )
}
