import { lazy, Suspense, useState } from 'react'
import {
  ArrowRight,
  Beaker,
  Check,
  FlaskConical,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { ANIMALS, SOURCES, toEntrant } from '../data/animals'
import {
  effectiveStats,
  fields,
  speedKmh,
  validateStats,
} from '../lib/simulation'
import { LOCOMOTION } from '../lib/types'
import type {
  Entrant,
  Locomotion,
  Mode,
  RaceSettings,
  SavedAnimal,
} from '../lib/types'
import expansionMetadata from '../data/expansion-metadata.json'
import { AnimalAvatar } from './AnimalAvatar'

const SpeciesEvidence = lazy(() => import('./SpeciesEvidence'))

export function AnimalEditor({
  animal,
  mode,
  massEffects,
  onApply,
  onSave,
  onClose,
  notify,
}: {
  animal: Entrant
  mode: Mode
  massEffects: boolean
  onApply: (animal: Entrant, mode?: Mode) => void
  onSave: (animal: Entrant) => void
  onClose?: () => void
  notify: (message: string) => void
}) {
  const [draft, setDraft] = useState<Entrant>(() => ({
    ...animal,
    stats: { ...animal.stats },
  }))
  const [showEvidence, setShowEvidence] = useState(false)
  const hasEvidence = Object.hasOwn(expansionMetadata, animal.id)
  const [draftMode, setDraftMode] = useState(mode)
  const [error, setError] = useState<string | null>(null)
  const effective = validateStats(draft.stats)
    ? null
    : effectiveStats(draft, massEffects)
  function apply(save: boolean) {
    const issue = validateStats(draft.stats, draftMode)
    if (issue || !draft.name.trim()) {
      setError(issue || 'Your creation needs a name.')
      return
    }
    const creation = { ...draft, name: draft.name.trim(), custom: true }
    onApply(creation, draftMode)
    if (save) onSave(creation)
    notify(
      save
        ? `${creation.name} saved to your stable. The committee is intrigued.`
        : `${creation.name} is ready for the starting line.`,
    )
    onClose?.()
  }
  function reset() {
    const original = ANIMALS.find((a) => a.id === animal.id)!
    setDraft(toEntrant(original))
    setError(null)
  }
  function monster() {
    setDraftMode('experimental')
    setDraft((d) => ({
      ...d,
      name: `${ANIMALS.find((a) => a.id === d.id)!.name} GT`,
      stats: {
        ...d.stats,
        acceleration: 15,
        topSpeed: 80,
        sprint: 60,
        sustainable: 35,
        fatigue: 0.02,
      },
    }))
    setError(null)
  }
  const source = SOURCES[animal.source]
  return (
    <form
      className="animal-editor"
      onSubmit={(e) => {
        e.preventDefault()
        apply(false)
      }}
    >
      <div className="modal-heading">
        <div className="editor-title">
          <AnimalAvatar animal={draft} />
          <div>
            <span className="eyebrow">
              {draftMode === 'experimental'
                ? 'THE RULEBOOK IS ON FIRE'
                : 'A LITTLE FRIENDLY TINKERING'}
            </span>
            <h2>{animal.name}</h2>
            <p>{animal.scientific}</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className="icon-button"
            aria-label="Close animal editor"
            onClick={onClose}
          >
            <X size={22} />
          </button>
        )}
      </div>
      <p className="animal-description">“{animal.description}”</p>
      <div className="editor-mode">
        <div>
          <FlaskConical size={19} />
          <span>
            <strong>
              {draftMode === 'experimental'
                ? 'Unrestricted nonsense'
                : 'Biologically plausible'}
            </strong>
            <small>
              {draftMode === 'experimental'
                ? 'Your imagination is now the limiting factor.'
                : 'Broad biological guardrails. Still an estimate.'}
            </small>
          </span>
        </div>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setDraftMode((m) =>
              m === 'plausible' ? 'experimental' : 'plausible',
            )
            setError(null)
          }}
        >
          Switch mode
        </button>
      </div>
      <div className="editor-fields">
        <label className="input-field full-width">
          Competitor name
          <input
            maxLength={60}
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </label>
        {fields.map((f) => (
          <label className="input-field" key={f.key}>
            {f.label}
            <span className="number-with-unit">
              <input
                type="number"
                required
                min={f.min}
                max="1000000000"
                step="any"
                value={
                  Number.isNaN(draft.stats[f.key]) ? '' : draft.stats[f.key]
                }
                onChange={(e) => {
                  const value =
                    e.target.value === '' ? NaN : Number(e.target.value)
                  setDraft((d) => ({
                    ...d,
                    stats: { ...d.stats, [f.key]: value },
                  }))
                  setError(null)
                }}
              />
              <span>{f.unit}</span>
            </span>
          </label>
        ))}
        <label className="input-field">
          Locomotion profile
          <select
            value={draft.locomotion}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                locomotion: e.target.value as Locomotion,
              }))
            }
          >
            {Object.entries(LOCOMOTION).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mass-explainer">
        <Beaker size={20} />
        <div>
          <strong>
            {massEffects
              ? 'Mass effects are enabled'
              : 'Mass effects are disabled'}
          </strong>
          <p>
            {effective
              ? `Effective launch: ${effective.acceleration.toLocaleString(undefined, { maximumFractionDigits: 3 })} m/s² · sprint: ${speedKmh(effective.topSpeed)} km/h.`
              : 'Enter valid values to preview effective performance.'}{' '}
            {massEffects
              ? 'Mass scales power using an invented geometric model, relative to the original species preset. Locomotion also adjusts launch and fatigue.'
              : 'Body mass is descriptive only. Locomotion still adjusts launch and fatigue.'}
          </p>
        </div>
      </div>
      <details
        className="biology-note"
        onToggle={(e) => setShowEvidence(e.currentTarget.open)}
      >
        <summary>Biological context & preset honesty</summary>
        <p>{animal.biology}</p>
        <p>
          Every racing number here, including body mass, is a rounded simulation
          preset. Acceleration, sprint reserve, fatigue, and sustainable pace
          are invented estimates. Plausible mode uses broad limits; it does not
          certify species-specific realism.
        </p>
        {hasEvidence ? (
          showEvidence && (
            <Suspense fallback={<p role="status">Loading species evidence…</p>}>
              <SpeciesEvidence id={animal.id} />
            </Suspense>
          )
        ) : (
          <a href={source.url} target="_blank" rel="noreferrer">
            {source.label} ↗
          </a>
        )}
      </details>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="editor-tools">
        <button type="button" className="text-button" onClick={reset}>
          <RotateCcw size={14} /> Species defaults
        </button>
        <button
          type="button"
          className="text-button monster-button"
          onClick={monster}
        >
          <FlaskConical size={14} /> Make a monster
        </button>
      </div>
      <div className="editor-actions">
        <button
          type="button"
          className="button secondary"
          onClick={() => apply(true)}
        >
          <Save size={16} /> Save to stable
        </button>
        <button type="submit" className="button primary">
          <Check size={16} /> Apply to lineup
        </button>
      </div>
    </form>
  )
}

export function AnimalLab({
  settings,
  update,
  library,
  save,
  remove,
  onRoster,
  notify,
}: {
  settings: RaceSettings
  update: (patch: Partial<RaceSettings>) => void
  library: SavedAnimal[]
  save: (a: Entrant) => void
  remove: (id: string) => void
  onRoster: () => void
  notify: (message: string) => void
}) {
  const [selected, setSelected] = useState(settings.entrants[0].id)
  const animal =
    settings.entrants.find((a) => a.id === selected) ?? settings.entrants[0]
  function apply(a: Entrant, mode?: Mode) {
    update({
      entrants: settings.entrants.map((item) => (item.id === a.id ? a : item)),
      mode: mode ?? settings.mode,
    })
  }
  function load(saved: SavedAnimal) {
    const a = saved.animal
    const exists = settings.entrants.some((item) => item.id === a.id)
    update({
      entrants: exists
        ? settings.entrants.map((item) => (item.id === a.id ? a : item))
        : [...settings.entrants, a],
      mode: validateStats(a.stats, settings.mode)
        ? 'experimental'
        : settings.mode,
    })
    setSelected(a.id)
    notify(`${a.name} loaded into the lineup.`)
  }
  return (
    <div className="lab-layout">
      <aside className="lab-sidebar">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">YOUR TEST SUBJECTS</span>
              <h2>The animal lab</h2>
            </div>
            <FlaskConical size={22} />
          </div>
          <p className="subtle">
            One small tweak for a hippo. One giant headache for the laws of
            nature.
          </p>
          <div className="lab-animal-list">
            {settings.entrants.map((a) => (
              <button
                key={a.id}
                className={a.id === animal.id ? 'selected' : ''}
                onClick={() => setSelected(a.id)}
              >
                <AnimalAvatar animal={a} small />
                <span>
                  {a.name}
                  <small>
                    {a.custom ? 'Custom configuration' : 'Species preset'}
                  </small>
                </span>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
          <button className="button add-competitor" onClick={onRoster}>
            <Plus size={16} /> Add an animal
          </button>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.massEffects}
              onChange={(e) => update({ massEffects: e.target.checked })}
            />
            <span>
              <strong>Estimated mass effects</strong>
              <small>Explore a lighter elephant or a heavier rabbit.</small>
            </span>
          </label>
        </section>
        <section className="panel stable-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">LOCALLY GROWN NONSENSE</span>
              <h2>Your saved stable</h2>
            </div>
            <Save size={20} />
          </div>
          {library.length === 0 ? (
            <div className="empty-stable">
              <span>🧪</span>
              <p>
                No creations yet.
                <br />
                Save a configuration to keep it here.
              </p>
            </div>
          ) : (
            library.map((s) => (
              <div className="saved-animal" key={s.id}>
                <AnimalAvatar animal={s.animal} small />
                <button onClick={() => load(s)}>
                  <strong>{s.animal.name}</strong>
                  <small>
                    {speedKmh(s.animal.stats.topSpeed)} km/h · load
                    configuration
                  </small>
                </button>
                <button
                  className="icon-button"
                  aria-label={`Delete saved ${s.animal.name}`}
                  onClick={() => remove(s.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
          <p className="subtle">
            Saved in this browser. No account, no cloud, no judgment.
          </p>
        </section>
      </aside>
      <section className="panel editor-panel">
        <AnimalEditor
          key={`${animal.id}-${JSON.stringify(animal.stats)}-${animal.name}`}
          animal={animal}
          mode={settings.mode}
          massEffects={settings.massEffects}
          onApply={apply}
          onSave={save}
          notify={notify}
        />
      </section>
    </div>
  )
}
