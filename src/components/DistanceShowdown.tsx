import { useMemo } from 'react'
import { ArrowRight, Medal, Route, Trophy } from 'lucide-react'
import { formatDistance, formatTime, simulate } from '../lib/simulation'
import type { RaceSettings } from '../lib/types'
import { AnimalAvatar } from './AnimalAvatar'
const DISTANCES = [25, 100, 400, 1000, 5000, 10000]
export function DistanceShowdown({
  settings,
  raceAt,
}: {
  settings: RaceSettings
  raceAt: (distance: number) => void
}) {
  const races = useMemo(
    () =>
      DISTANCES.map((distance) => ({
        distance,
        results: simulate(settings.entrants, distance, settings.massEffects),
      })),
    [settings.entrants, settings.massEffects],
  )
  const wins = settings.entrants
    .map((a) => ({
      animal: a,
      wins: races.filter(
        (r) => r.results[0].animal.id === a.id && r.results[0].finish !== null,
      ).length,
    }))
    .sort((a, b) => b.wins - a.wins)
  return (
    <div className="showdown-page">
      <div className="section-intro">
        <span className="eyebrow">CHANGE THE DISTANCE. CHANGE THE STORY.</span>
        <h2>Sprinter or survivor?</h2>
        <p>
          The same lineup, six very different races. Discover where the balance
          shifts.
        </p>
      </div>
      <div className="comparison-cards">
        {races.map((race) => {
          const winner = race.results.find((r) => r.finish !== null)
          return (
            <section className="panel comparison-card" key={race.distance}>
              <div className="comparison-heading">
                <span>{formatDistance(race.distance)}</span>
                <Route size={18} />
              </div>
              {winner ? (
                <>
                  <AnimalAvatar animal={winner.animal} />
                  <span className="eyebrow">TAKES THE WIN</span>
                  <h3>{winner.animal.name}</h3>
                  <strong className="comparison-time">
                    {formatTime(winner.finish)}
                  </strong>
                </>
              ) : (
                <div className="empty-state">
                  Nobody finishes.
                  <br />A bold experiment.
                </div>
              )}
              <div className="mini-podium">
                {race.results.slice(0, 3).map((r, i) => (
                  <div key={r.animal.id}>
                    <span>
                      {i + 1}. {r.animal.emoji} {r.animal.name}
                    </span>
                    <b>{formatTime(r.finish)}</b>
                  </div>
                ))}
              </div>
              <button
                className="text-button"
                onClick={() => raceAt(race.distance)}
              >
                Race this distance <ArrowRight size={14} />
              </button>
            </section>
          )
        })}
      </div>
      <section className="panel comparison-table-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">THE FULL PICTURE</span>
            <h2>Every animal. Every distance.</h2>
          </div>
          <Trophy size={22} />
        </div>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Race results table"
        >
          <table className="comparison-table">
            <caption className="sr-only">
              Finishing times across six race distances
            </caption>
            <thead>
              <tr>
                <th>Competitor</th>
                {DISTANCES.map((d) => (
                  <th key={d}>{formatDistance(d)}</th>
                ))}
                <th>Wins</th>
              </tr>
            </thead>
            <tbody>
              {wins.map(({ animal, wins }) => (
                <tr key={animal.id}>
                  <td>
                    <span className="result-emoji">{animal.emoji}</span>
                    <strong>{animal.name}</strong>
                  </td>
                  {races.map((race) => {
                    const result = race.results.find(
                      (r) => r.animal.id === animal.id,
                    )!
                    const isWinner =
                      race.results[0].animal.id === animal.id &&
                      result.finish !== null
                    return (
                      <td
                        className={isWinner ? 'best-time' : ''}
                        key={race.distance}
                      >
                        {isWinner && <Medal size={13} />}{' '}
                        {formatTime(result.finish)}
                      </td>
                    )
                  })}
                  <td>
                    <span className="wins-count">{wins}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="subtle">
          Uses your current custom statistics and mass settings. Winning cells
          are highlighted. A tie is resolved by lineup order for presentation;
          the recorded times are unchanged.
        </p>
      </section>
    </div>
  )
}
