import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  ArrowDownToLine,
  ArrowRight,
  Flag,
  Gauge,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Shuffle,
  SlidersHorizontal,
  Timer,
  Trophy,
  X,
  Zap,
} from 'lucide-react'
import { ANIMALS, toEntrant } from '../data/animals'
import {
  formatDistance,
  formatTime,
  motionAt,
  simulate,
  speedKmh,
} from '../lib/simulation'
import { clockPlan, smartTime } from '../lib/playback'
import type { RaceSettings } from '../lib/types'
import { AnimalAvatar } from './AnimalAvatar'
import { AnimalSprite } from './AnimalSprite'
import { PerformanceChart } from './PerformanceChart'

export function RaceDay({
  settings,
  update,
  onRoster,
  onEdit,
  notify,
}: {
  settings: RaceSettings
  update: (patch: Partial<RaceSettings>) => void
  onRoster: () => void
  onEdit: (id: string) => void
  notify: (message: string) => void
}) {
  const { entrants, distance, massEffects, playback } = settings
  const results = useMemo(
    () => simulate(entrants, distance, massEffects),
    [entrants, distance, massEffects],
  )
  const plan = useMemo(() => clockPlan(results.map((r) => r.finish)), [results])
  const [playing, setPlaying] = useState(false)
  const [smart, setSmart] = useState(true)
  const [playhead, setPlayhead] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [showForecast, setShowForecast] = useState(false)
  const [previousResults, setPreviousResults] = useState(results)
  const [distanceDraft, setDistanceDraft] = useState(String(distance))
  const [distanceError, setDistanceError] = useState('')
  if (previousResults !== results) {
    setPreviousResults(results)
    setPlayhead(0)
    setPlaying(false)
    setShowForecast(false)
    setDistanceDraft(String(distance))
    setDistanceError('')
  }
  const duration = smart ? plan.duration : plan.end
  const clock = smart ? smartTime(playhead, plan) : playhead
  const complete = playhead >= duration
  const winner = results.find((r) => r.finish !== null)
  const winnerFinished = !!winner && clock >= winner.finish!
  const lastFrame = useRef<number | null>(null)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const listener = () => setReduceMotion(query.matches)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }, [])
  useEffect(() => {
    if (!playing || complete) return
    let frame: number
    lastFrame.current = null
    const tick = (now: number) => {
      const dt =
        lastFrame.current === null
          ? 0
          : Math.min(0.1, (now - lastFrame.current) / 1000)
      lastFrame.current = now
      setPlayhead((p) => Math.min(duration, p + dt * playback))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, playback, duration, complete])
  const live = results
    .map((r) => ({
      ...r,
      ...motionAt(r.effective, Math.min(clock, r.finish ?? clock)),
    }))
    .sort(
      (a, b) =>
        b.distance - a.distance ||
        (a.finish ?? Infinity) - (b.finish ?? Infinity),
    )
  const liveRank = (id: string) => live.findIndex((r) => r.animal.id === id) + 1
  function reset() {
    setPlaying(false)
    setPlayhead(0)
    setShowForecast(false)
  }
  function play() {
    if (complete) setPlayhead(0)
    setPlaying((p) => (complete ? true : !p))
  }
  function changeClock() {
    setSmart((s) => !s)
    setPlayhead(0)
    setPlaying(false)
  }
  function applyDistance() {
    const value = Number(distanceDraft)
    if (value >= 25 && value <= 10000 && Number.isFinite(value)) {
      update({ distance: value })
      setDistanceError('')
    } else setDistanceError('Choose 25 to 10,000 metres.')
  }
  function shuffle() {
    const ids = [...ANIMALS].sort(() => Math.random() - 0.5).slice(0, 5)
    update({ entrants: ids.map(toEntrant) })
    notify('A fresh cast of questionable contenders has arrived.')
  }
  function download() {
    const content =
      'Position,Animal,Distance (m),Finish (s),Peak (m/s),Average (m/s)\n' +
      results
        .map((r, i) =>
          [
            r.finish === null ? 'DNF' : i + 1,
            `"${r.animal.name.replaceAll('"', '""')}"`,
            distance,
            r.finish ?? 'DNF',
            r.peak,
            r.average,
          ].join(','),
        )
        .join('\n')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `animal-racing-${distance}m.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <>
      <div className="race-layout">
        <aside className="panel setup-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">MAKE IT INTERESTING</span>
              <h2>The starting lineup</h2>
            </div>
            <span className="count-badge">{entrants.length}</span>
          </div>
          <label className="field-label" htmlFor="distance">
            Race distance <span>{formatDistance(distance)}</span>
          </label>
          <div className="distance-presets">
            {[25, 100, 400, 1000, 10000].map((d) => (
              <button
                key={d}
                className={distance === d ? 'selected' : ''}
                onClick={() => update({ distance: d })}
              >
                {formatDistance(d)}
              </button>
            ))}
          </div>
          <div className="distance-slider">
            <span>25 m</span>
            <input
              id="distance"
              type="range"
              min="25"
              max="10000"
              step="25"
              value={distance}
              onChange={(e) => update({ distance: Number(e.target.value) })}
            />
            <span>10 km</span>
          </div>
          <label className="custom-distance">
            Custom distance{' '}
            <span>
              <input
                aria-label="Custom distance in metres"
                aria-invalid={!!distanceError}
                aria-describedby={distanceError ? 'distance-error' : undefined}
                type="number"
                min="25"
                max="10000"
                value={distanceDraft}
                onChange={(e) => setDistanceDraft(e.target.value)}
                onBlur={applyDistance}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyDistance()
                }}
              />{' '}
              m
            </span>
          </label>
          {distanceError && (
            <p id="distance-error" className="form-error" role="alert">
              {distanceError}
            </p>
          )}
          <div className="lineup-heading">
            <span className="field-label">Competitors</span>
            <button className="text-button" onClick={shuffle}>
              <Shuffle size={13} /> Shuffle
            </button>
          </div>
          <div className="lineup">
            {entrants.map((animal) => (
              <div className="lineup-row" key={animal.id}>
                <AnimalAvatar animal={animal} small />
                <button
                  className="lineup-name"
                  onClick={() => onEdit(animal.id)}
                  title={`Edit ${animal.name}`}
                >
                  <strong>{animal.name}</strong>
                  <small>
                    {animal.custom
                      ? 'Custom contender'
                      : `${speedKmh(animal.stats.topSpeed)} km/h · ${animal.category === 'Heavyweights' ? 'Heavyweight' : animal.category === 'Distance stars' ? 'Distance star' : animal.category === 'Sprinters' ? 'Sprinter' : 'Wildcard'}`}
                  </small>
                </button>
                <button
                  className="icon-button edit-animal"
                  aria-label={`Edit ${animal.name}`}
                  onClick={() => onEdit(animal.id)}
                >
                  <SlidersHorizontal size={15} />
                </button>
                <button
                  className="icon-button remove-animal"
                  aria-label={`Remove ${animal.name}`}
                  disabled={entrants.length === 1}
                  onClick={() =>
                    update({
                      entrants: entrants.filter((a) => a.id !== animal.id),
                    })
                  }
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          <button className="button add-competitor" onClick={onRoster}>
            <Plus size={17} /> Add competitors{' '}
            <span>{ANIMALS.length} species</span>
          </button>
          <div className="setup-note">
            <Zap size={17} />
            <p>
              Short sprints favour explosive starts. Long races have a way of
              humbling a cheetah.
            </p>
          </div>
          <button className="button primary start-side" onClick={play}>
            {playing && !complete ? <Pause size={17} /> : <Flag size={17} />}{' '}
            {complete
              ? 'Race again'
              : playing
                ? 'Pause the action'
                : playhead
                  ? 'Resume race'
                  : 'Let them race'}
            <ArrowRight size={17} />
          </button>
        </aside>
        <section
          className={`panel arena ${complete ? 'race-complete' : ''} ${reduceMotion ? 'reduced-motion' : ''}`}
          aria-label="Animated racetrack"
        >
          <div className="arena-heading">
            <div>
              <span className="live-label">
                <i />{' '}
                {complete
                  ? 'FINAL WHISTLE'
                  : playing
                    ? 'LIVE FROM THE WILDS'
                    : 'WELCOME TO THE WILDS'}
              </span>
              <h2>
                {formatDistance(distance)} <span>·</span> The great species
                showdown
              </h2>
            </div>
            <span className="arena-badge">
              <Flag size={14} /> Flat land
            </span>
          </div>
          <div className="landscape" aria-hidden="true">
            <div className="sun" />
            <div className="hill hill-back" />
            <div className="hill hill-front" />
            <span className="tree tree-1">♠</span>
            <span className="tree tree-2">♠</span>
            <span className="tree tree-3">♠</span>
            <div className="landscape-caption">
              WILDWOOD NATIONAL RACEWAY <span>EST. 2026</span>
            </div>
            <div className="stadium-board">
              <span>
                {complete
                  ? 'THAT’S A WRAP'
                  : playing
                    ? 'PAWS ON THE TRACK'
                    : 'ALL SPECIES WELCOME'}
              </span>
              <b>{formatDistance(distance)}</b>
            </div>
          </div>
          <div className="track-ruler">
            <span className="lane-ruler-label">POSITION</span>
            <div>
              {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                <span key={f} style={{ left: `${f * 100}%` }}>
                  {formatDistance(distance * f)}
                </span>
              ))}
            </div>
          </div>
          <div
            className="track"
            aria-label={`Race at ${formatTime(clock)} of simulated time`}
          >
            {entrants.map((animal, i) => {
              const result = results.find((r) => r.animal.id === animal.id)!
              const state = motionAt(
                result.effective,
                Math.min(clock, result.finish ?? clock),
              )
              const done = result.finish !== null && clock >= result.finish
              const progress = Math.min(1, state.distance / distance)
              const rank = done
                ? results.findIndex((r) => r.animal.id === animal.id) + 1
                : liveRank(animal.id)
              return (
                <div
                  className={`track-lane ${done ? 'finished-lane' : ''}`}
                  key={animal.id}
                  style={{ '--animal-color': animal.color } as CSSProperties}
                >
                  <div className="lane-tag">
                    <span
                      title={clock > 0 ? 'Current position' : 'Starting lane'}
                    >
                      {String(clock > 0 ? rank : i + 1).padStart(2, '0')}
                    </span>
                    <strong>{animal.name}</strong>
                    <small>
                      {done
                        ? formatTime(result.finish)
                        : `${speedKmh(state.speed)} km/h`}
                    </small>
                  </div>
                  <div className="lane-course">
                    <div
                      className="track-progress"
                      style={{ width: `${progress * 100}%` }}
                    />
                    <div
                      className={`runner ${playing && !complete && !done && clock > result.effective.delay ? 'running' : ''} ${done ? 'arrived' : ''}`}
                      style={{ left: `${progress * 100}%` }}
                    >
                      <AnimalSprite
                        animal={animal}
                        size={64}
                        className="race-sprite"
                        decorative={false}
                        moving={playing && !complete && !done}
                        speed={state.speed}
                        priority
                      />
                      {done && (
                        <span
                          className={`finish-rank ${rank === 1 ? 'gold' : ''}`}
                        >
                          {rank === 1 ? '★' : rank}
                        </span>
                      )}
                    </div>
                    <span className="finish-line" />
                    {done && (
                      <span className="finish-stamp">
                        {rank === 1 ? 'WINNER' : `#${rank}`}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="race-ticker" role="status" aria-live="polite">
            <span className="ticker-icon">{winnerFinished ? '🏆' : '🎙️'}</span>
            <p>
              {winnerFinished
                ? `${winner.animal.name} takes it! ${winner.animal.description}`
                : playing
                  ? 'And they’re off! The tortoise has filed a formal request for patience.'
                  : 'Pick your favourites. Place absolutely no sensible expectations on them.'}
            </p>
            {winnerFinished && !complete && (
              <button
                className="text-button"
                onClick={() => {
                  setPlayhead(duration)
                  setPlaying(false)
                }}
              >
                All finishes <ArrowRight size={13} />
              </button>
            )}
          </div>
          <div className="playback">
            <button
              className="play-button"
              aria-label={
                complete ? 'Replay race' : playing ? 'Pause race' : 'Play race'
              }
              onClick={play}
            >
              {playing && !complete ? (
                <Pause size={20} fill="currentColor" />
              ) : complete ? (
                <RotateCcw size={20} />
              ) : (
                <Play size={20} fill="currentColor" />
              )}
            </button>
            <button
              className="icon-button"
              aria-label="Reset race"
              onClick={reset}
            >
              <RotateCcw size={17} />
            </button>
            <div className="scrubber">
              <label htmlFor="race-progress">
                <span>{formatTime(clock)}</span>
                <span>
                  {complete
                    ? 'Finished'
                    : smart
                      ? 'Smart race clock'
                      : 'Real-time clock'}
                </span>
              </label>
              <input
                id="race-progress"
                aria-label="Race playback position"
                type="range"
                min="0"
                max={duration}
                step={duration / 1000}
                value={playhead}
                onChange={(e) => {
                  setPlayhead(Number(e.target.value))
                  setPlaying(false)
                }}
              />
            </div>
            <label className="speed-select">
              <span className="sr-only">Playback speed</span>
              <select
                aria-label="Playback speed"
                value={playback}
                onChange={(e) => update({ playback: Number(e.target.value) })}
              >
                {[0.5, 1, 2, 5, 10].map((v) => (
                  <option key={v} value={v}>
                    {v}×
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="clock-note">
            <label>
              <input type="checkbox" checked={smart} onChange={changeClock} />{' '}
              Smart clock
            </label>
            <span>
              {smart
                ? 'Watch the winning sprint, then fast-forward the stragglers. A full race takes ~28s at 1×.'
                : 'One second of playback = one simulated second at 1×.'}
            </span>
          </div>
          {complete && !reduceMotion && winner && (
            <div className="confetti" aria-hidden="true">
              {Array.from({ length: 22 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    left: `${i * 4.7}%`,
                    animationDelay: `${(i % 7) * 0.11}s`,
                    background: ['#ed743e', '#ddb44d', '#759b74'][i % 3],
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
      <div className="results-layout">
        <section className="panel results-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">
                {complete
                  ? 'OFFICIAL LEAGUE BUSINESS'
                  : 'THE NUMBERS HAVE SPOKEN'}
              </span>
              <h2>{complete ? 'The finishing order' : 'The form guide'}</h2>
            </div>
            <button
              className="icon-button"
              aria-label="Download race results as CSV"
              onClick={download}
            >
              <ArrowDownToLine size={18} />
            </button>
          </div>
          {!complete && !showForecast ? (
            <div className="forecast-cover">
              <Trophy size={32} />
              <h3>Every underdog has its day.</h3>
              <p>
                Run the race to reveal the finishing order.
                <br />
                Or peek at the prediction. We won’t judge.
              </p>
              <button
                className="button secondary"
                onClick={() => setShowForecast(true)}
              >
                Show predicted results <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <>
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Race results table"
              >
                <table>
                  <caption className="sr-only">
                    {complete ? 'Final' : 'Predicted'} results for the{' '}
                    {formatDistance(distance)} race
                  </caption>
                  <thead>
                    <tr>
                      <th>Place / competitor</th>
                      <th>Finish</th>
                      <th>Avg. km/h</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr
                        key={r.animal.id}
                        className={
                          i === 0 && r.finish !== null ? 'winner-row' : ''
                        }
                      >
                        <td>
                          <span
                            className={`result-place ${i === 0 && r.finish !== null ? 'first' : ''}`}
                          >
                            {r.finish === null
                              ? '—'
                              : String(i + 1).padStart(2, '0')}
                          </span>
                          <AnimalSprite
                            animal={r.animal}
                            size={34}
                            className="result-sprite"
                          />
                          <strong>{r.animal.name}</strong>
                        </td>
                        <td>{formatTime(r.finish)}</td>
                        <td>{speedKmh(r.average)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="subtle">
                {complete
                  ? 'Same settings, same outcome. Every single time.'
                  : 'Prediction · complete deterministic results before playback.'}{' '}
                DNF = never reaches the finish within the model’s numerical
                horizon.
              </p>
            </>
          )}
        </section>
        <PerformanceChart results={results} distance={distance} />
      </div>
      <div
        className="insight-strip"
        tabIndex={0}
        role="region"
        aria-label="League features"
      >
        <div>
          <Timer size={21} />
          <span>
            <strong>Beyond top speed</strong>
            <small>Acceleration, stamina & the long game.</small>
          </span>
        </div>
        <div>
          <Gauge size={21} />
          <span>
            <strong>Your rules. Their problem.</strong>
            <small>Every parameter is yours to tinker with.</small>
          </span>
        </div>
        <div>
          <Trophy size={21} />
          <span>
            <strong>Science-ish. Fun, definitely.</strong>
            <small>Real biology, playfully estimated physics.</small>
          </span>
        </div>
      </div>
    </>
  )
}
