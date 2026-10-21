import { useId, useState } from 'react'
import {
  formatDistance,
  formatTime,
  motionAt,
  speedKmh,
} from '../lib/simulation'
import { clockPlan, smartTime } from '../lib/playback'
import type { RaceResult } from '../lib/types'
export function PerformanceChart({
  results,
  distance,
}: {
  results: RaceResult[]
  distance: number
}) {
  const [kind, setKind] = useState<'speed' | 'distance'>('speed')
  const id = useId()
  const [visible, setVisible] = useState<string[]>([])
  const filtered = visible.length
    ? results.filter((r) => visible.includes(r.animal.id))
    : results
  const selected = filtered.length ? filtered : results
  const plan = clockPlan(selected.map((r) => r.finish))
  const end = plan.end
  const ymax =
    kind === 'distance'
      ? distance
      : Math.max(1e-6, ...selected.map((r) => r.peak * 3.6))
  const fraction = (t: number) =>
    !plan.hasTail
      ? t / end
      : t <= plan.first
        ? (0.5 * t) / plan.first
        : 0.5 + (0.5 * Math.log(t / plan.first)) / Math.log(end / plan.first)
  const x = (t: number) => 54 + fraction(t) * 654
  const y = (v: number) => 204 - (v / ymax) * 170
  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">THE STORY BEHIND THE SPRINT</span>
          <h2>Every stride, plotted.</h2>
        </div>
        <div className="segmented small-segment" aria-label="Graph metric">
          <button
            aria-pressed={kind === 'speed'}
            className={kind === 'speed' ? 'active' : ''}
            onClick={() => setKind('speed')}
          >
            Speed
          </button>
          <button
            aria-pressed={kind === 'distance'}
            className={kind === 'distance' ? 'active' : ''}
            onClick={() => setKind('distance')}
          >
            Distance
          </button>
        </div>
      </div>
      <svg
        className="performance-chart"
        viewBox="0 0 740 246"
        role="img"
        aria-labelledby={id}
      >
        <title id={id}>
          {kind === 'speed'
            ? 'Speed in kilometres per hour'
            : 'Distance in metres'}{' '}
          over elapsed race time, from zero to {formatTime(end)}. Use the result
          table for exact finishing times.
        </title>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const tick = plan.hasTail
            ? smartTime(f * plan.duration, plan)
            : f * end
          return (
            <g key={f}>
              <line
                x1="54"
                x2="708"
                y1={y(f * ymax)}
                y2={y(f * ymax)}
                stroke="#e4e5dc"
                strokeDasharray={f ? '3 4' : ''}
              />
              <text x="44" y={y(f * ymax) + 4} textAnchor="end">
                {(f * ymax).toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })}
              </text>
              <text x={x(tick)} y="225" textAnchor="middle">
                {formatTime(tick, false)}
              </text>
            </g>
          )
        })}
        <text x="54" y="18">
          {kind === 'speed' ? 'km/h' : 'metres'}
        </text>
        {selected.map((r) => {
          const until = Math.min(end, r.finish ?? end)
          const times = new Set(
            Array.from({ length: 201 }, (_, i) => (until * i) / 200),
          )
          if (plan.hasTail)
            for (let i = 0; i <= 200; i++) {
              const t = smartTime((i / 200) * plan.duration, plan)
              if (t <= until) times.add(t)
            }
          for (const t of [
            r.effective.delay,
            r.effective.delay + r.effective.accelerationTime,
            r.effective.delay + r.effective.cruiseEnd,
          ])
            if (t >= 0 && t < until) times.add(t)
          const points = [...times]
            .sort((a, b) => a - b)
            .map((t) => {
              const state = motionAt(r.effective, t)
              return `${x(t)},${y(kind === 'speed' ? state.speed * 3.6 : Math.min(distance, state.distance))}`
            })
            .join(' ')
          return (
            <polyline
              key={r.animal.id}
              points={points}
              fill="none"
              stroke={r.animal.color}
              strokeWidth="2.7"
              strokeLinejoin="round"
            >
              <title>
                {r.animal.name}: {formatTime(r.finish)}, peak {speedKmh(r.peak)}{' '}
                km/h
              </title>
            </polyline>
          )
        })}
      </svg>
      <div className="chart-legend">
        {results.map((r) => (
          <button
            key={r.animal.id}
            className={
              visible.length && !visible.includes(r.animal.id) ? 'muted' : ''
            }
            aria-pressed={!visible.length || visible.includes(r.animal.id)}
            onClick={() =>
              setVisible((current) =>
                !current.length
                  ? [r.animal.id]
                  : current.includes(r.animal.id)
                    ? current.filter((id) => id !== r.animal.id)
                    : [...current, r.animal.id],
              )
            }
          >
            <i style={{ background: r.animal.color }} />
            {r.animal.name}
          </button>
        ))}
        {visible.length > 0 && (
          <button onClick={() => setVisible([])}>Show all</button>
        )}
      </div>
      <p className="subtle chart-caption">
        {plan.hasTail
          ? 'Smart time axis: linear to the first finish, then logarithmic to show the stragglers. '
          : ''}
        {kind === 'speed'
          ? 'Curves stop at each finish. '
          : `First to ${formatDistance(distance)} wins. `}
        Click a name to isolate its curve.
      </p>
    </section>
  )
}
