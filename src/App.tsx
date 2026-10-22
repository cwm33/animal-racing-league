import { Component, useCallback, useEffect, useRef, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Flag,
  FlaskConical,
  Github,
  Menu,
  PawPrint,
  RotateCcw,
  Route,
  Sparkles,
  X,
} from 'lucide-react'
import { AnimalEditor, AnimalLab } from './components/AnimalLab'
import { DistanceShowdown } from './components/DistanceShowdown'
import { FieldNotes } from './components/FieldNotes'
import { Modal } from './components/Modal'
import { RaceDay } from './components/RaceDay'
import { Roster } from './components/Roster'
import { AnimalSprite } from './components/AnimalSprite'
import { ANIMALS, defaultEntrants, toEntrant } from './data/animals'
import {
  defaultSettings,
  loadLibrary,
  loadSettings,
  persist,
} from './lib/storage'
import { validateStats } from './lib/simulation'
import type { Entrant, RaceSettings, SavedAnimal } from './lib/types'

type Page = 'race' | 'lab' | 'compare' | 'notes'
const pages = [
  { id: 'race', label: 'Race day', icon: Flag },
  { id: 'lab', label: 'Animal lab', icon: FlaskConical },
  { id: 'compare', label: 'Distance showdown', icon: Route },
  { id: 'notes', label: 'Field notes', icon: BookOpen },
] as const
export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [library, setLibrary] = useState<SavedAnimal[]>(loadLibrary)
  const [page, setPage] = useState<Page>('race')
  const [rosterOpen, setRosterOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState('')
  const [storageFailed, setStorageFailed] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  // A failed external storage write needs one render to show the recovery notice.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!persist('settings', settings)) setStorageFailed(true)
  }, [settings])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!persist('library', library)) setStorageFailed(true)
  }, [library])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 4500)
    return () => clearTimeout(timer)
  }, [toast])
  const update = useCallback(
    (patch: Partial<RaceSettings>) => setSettings((s) => ({ ...s, ...patch })),
    [],
  )
  const notify = useCallback((message: string) => setToast(message), [])
  function navigate(next: Page) {
    setPage(next)
    setMobileNav(false)
    requestAnimationFrame(() => {
      mainRef.current?.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
  }
  function saveAnimal(animal: Entrant) {
    setLibrary((items) =>
      [
        {
          id: crypto.randomUUID(),
          savedAt: new Date().toISOString(),
          animal: { ...animal, stats: { ...animal.stats } },
        },
        ...items,
      ].slice(0, 100),
    )
  }
  function selectRoster(entrants: Entrant[]) {
    update({
      entrants,
      mode: entrants.some((a) => validateStats(a.stats, settings.mode))
        ? 'experimental'
        : settings.mode,
    })
  }
  function toggleMode() {
    if (settings.mode === 'experimental') {
      const invalid = settings.entrants.find((a) =>
        validateStats(a.stats, 'plausible'),
      )
      if (invalid) {
        notify(
          `${invalid.name} is outside plausible limits. Reset or edit its stats before switching modes.`,
        )
        return
      }
    }
    update({
      mode: settings.mode === 'plausible' ? 'experimental' : 'plausible',
    })
  }
  function featuredLineup(kind: 'classic' | 'endurance' | 'chaos') {
    const ids =
      kind === 'endurance'
        ? ['cheetah', 'pronghorn', 'horse', 'human', 'wolf']
        : kind === 'chaos'
          ? ['hippo', 'platypus', 'penguin', 'squirrel', 'seal']
          : []
    update({
      entrants:
        kind === 'classic'
          ? defaultEntrants()
          : ids.map((id) => toEntrant(ANIMALS.find((a) => a.id === id)!)),
      distance: kind === 'endurance' ? 5000 : 100,
    })
    notify(
      kind === 'endurance'
        ? 'Endurance club assembled. The cheetah looks concerned.'
        : kind === 'chaos'
          ? 'Chaos crew reporting for questionable athletic duty.'
          : 'The classic lineup is back on the grid.',
    )
  }
  const editingAnimal = settings.entrants.find((a) => a.id === editing)
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <button
            className="brand"
            onClick={() => navigate('race')}
            aria-label="Animal Racing League home"
          >
            <span className="brand-mark">
              <PawPrint size={27} fill="currentColor" />
            </span>
            <span>
              ANIMAL RACING
              <span>
                LEAGUE<span className="brand-dot">®</span>
              </span>
            </span>
          </button>
          <nav
            className={mobileNav ? 'main-nav open' : 'main-nav'}
            aria-label="Main navigation"
          >
            {pages.map((p) => (
              <button
                key={p.id}
                className={page === p.id ? 'active' : ''}
                aria-current={page === p.id ? 'page' : undefined}
                onClick={() => navigate(p.id)}
              >
                <p.icon size={16} />
                {p.label}
              </button>
            ))}
          </nav>
          <a
            className="github-link"
            href="https://github.com/cwm33/animal-racing-league"
            target="_blank"
            rel="noreferrer"
            aria-label="View project on GitHub"
          >
            <Github size={21} />
          </a>
          <button
            className="icon-button mobile-menu"
            aria-label={mobileNav ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileNav}
            onClick={() => setMobileNav((v) => !v)}
          >
            {mobileNav ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main" ref={mainRef} tabIndex={-1}>
        {page === 'race' ? (
          <>
            <section className="hero">
              <div>
                <div className="hero-kicker">
                  <span className="pill-dot" /> FAST PAWS. WILD SCIENCE.
                </div>
                <h1>
                  Nature’s fastest.
                  <br />
                  <span>And everyone else.</span>
                </h1>
                <p>
                  Cheetah vs. hippo. Rabbit vs. very determined tortoise.
                  <br className="desktop-break" /> Pick your lineup. Tinker with
                  biology. Let the wild times roll.
                </p>
                <div className="hero-tags">
                  <span>
                    <Check size={13} /> {ANIMALS.length} curious competitors
                  </span>
                  <span>
                    <Check size={13} /> 25 m to 10 km
                  </span>
                  <span>
                    <Check size={13} /> Endless “what if?”
                  </span>
                </div>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <span className="art-star star-one">✳</span>
                <span className="art-star star-two">✧</span>
                <span className="art-label">
                  A VERY SERIOUS
                  <br />
                  SPORTING INSTITUTION.
                </span>
                <div className="art-blob" />
                <AnimalSprite
                  animal={ANIMALS.find((a) => a.id === 'cheetah')!}
                  size={220}
                  className="art-cheetah"
                  priority
                />
                <AnimalSprite
                  animal={ANIMALS.find((a) => a.id === 'hippo')!}
                  size={220}
                  className="art-hippo"
                  priority
                />
                <span className="art-dust">···</span>
                <span className="art-seal">
                  <span>100% WILD</span>
                  <PawPrint size={23} />
                  <span>0% SENSIBLE</span>
                </span>
              </div>
            </section>
            <div className="race-toolbar">
              <div className="race-heading">
                <span className="section-index">01 /</span>
                <h2>Let’s make a race.</h2>
              </div>
              <div className="toolbar-actions">
                <label className="quick-picks">
                  <span>Quick lineup</span>
                  <select
                    aria-label="Choose a preset lineup"
                    value=""
                    onChange={(e) => {
                      if (e.target.value)
                        featuredLineup(
                          e.target.value as 'classic' | 'endurance' | 'chaos',
                        )
                    }}
                  >
                    <option value="" disabled>
                      Pick a crowd
                    </option>
                    <option value="classic">The classics</option>
                    <option value="endurance">Endurance club</option>
                    <option value="chaos">Chaos crew</option>
                  </select>
                </label>
                <button
                  className={`mode-button ${settings.mode === 'experimental' ? 'nonsense' : ''}`}
                  onClick={toggleMode}
                >
                  <FlaskConical size={15} />
                  {settings.mode === 'plausible'
                    ? 'Plausible mode'
                    : 'Unrestricted nonsense'}
                  <span className="toggle-pill" />
                </button>
              </div>
            </div>
            <RaceDay
              settings={settings}
              update={update}
              onRoster={() => setRosterOpen(true)}
              onEdit={setEditing}
              notify={notify}
            />
            <section className="lab-banner">
              <div className="lab-banner-icon">
                <FlaskConical size={32} />
              </div>
              <div>
                <span className="eyebrow">
                  FOR THE SCIENTIFICALLY CURIOUS. AND THE CHAOTIC.
                </span>
                <h2>What if a hippo had a turbo?</h2>
                <p>
                  Change mass, acceleration, endurance, and more. The animal lab
                  is open.
                </p>
              </div>
              <button className="button dark" onClick={() => navigate('lab')}>
                Enter the animal lab <ArrowRight size={16} />
              </button>
              <span className="banner-scribble" aria-hidden="true">
                🧪
              </span>
            </section>
          </>
        ) : (
          <>
            <div className="page-breadcrumb">
              <button onClick={() => navigate('race')}>The league</button>
              <ChevronRight size={13} />
              {pages.find((p) => p.id === page)!.label}
            </div>
            {page === 'lab' ? (
              <AnimalLab
                settings={settings}
                update={update}
                library={library}
                save={saveAnimal}
                remove={(id) => {
                  setLibrary((items) => items.filter((s) => s.id !== id))
                  notify('Configuration removed from your stable.')
                }}
                onRoster={() => setRosterOpen(true)}
                notify={notify}
              />
            ) : page === 'compare' ? (
              <DistanceShowdown
                settings={settings}
                raceAt={(distance) => {
                  update({ distance })
                  navigate('race')
                }}
              />
            ) : (
              <FieldNotes />
            )}
          </>
        )}
        {storageFailed && (
          <p className="storage-warning" role="status">
            Browser storage is unavailable. You can keep racing, but changes
            won’t survive closing this page.
          </p>
        )}
      </main>
      <footer className="site-footer">
        <div>
          <PawPrint size={19} />
          <span>A little science. A lot of wild.</span>
        </div>
        <p>Simulated races. Estimated biology. Actual entertainment.</p>
        <div>
          <button onClick={() => navigate('notes')}>How it works</button>
          <button onClick={() => setResetOpen(true)}>
            <RotateCcw size={12} /> Reset settings
          </button>
          <a
            href="https://github.com/cwm33/animal-racing-league"
            target="_blank"
            rel="noreferrer"
          >
            Made in the open ↗
          </a>
        </div>
      </footer>
      {rosterOpen && (
        <Modal
          label="Choose race competitors"
          onClose={() => setRosterOpen(false)}
        >
          <Roster
            entrants={settings.entrants}
            library={library}
            distance={settings.distance}
            massEffects={settings.massEffects}
            onDistance={(distance) => update({ distance })}
            onMatch={(entrants) => {
              selectRoster(entrants)
              setRosterOpen(false)
              navigate('race')
              notify(
                `${entrants.length} rivals matched by predicted finish. May the best paws win.`,
              )
            }}
            onChange={selectRoster}
            onClose={() => setRosterOpen(false)}
          />
        </Modal>
      )}
      {editingAnimal && (
        <Modal
          label={`Edit ${editingAnimal.name}`}
          onClose={() => setEditing(null)}
        >
          <AnimalEditor
            animal={editingAnimal}
            mode={settings.mode}
            massEffects={settings.massEffects}
            onApply={(animal, mode) =>
              update({
                entrants: settings.entrants.map((a) =>
                  a.id === animal.id ? animal : a,
                ),
                mode: mode ?? settings.mode,
              })
            }
            onSave={saveAnimal}
            onClose={() => setEditing(null)}
            notify={notify}
          />
        </Modal>
      )}
      {resetOpen && (
        <Modal
          label="Reset league settings"
          onClose={() => setResetOpen(false)}
        >
          <div className="reset-dialog">
            <RotateCcw size={30} />
            <h2>A fresh starting line?</h2>
            <p>
              Reset your lineup, distance, mode, and playback preferences to
              their defaults. Your saved stable stays safe.
            </p>
            <div className="editor-actions">
              <button
                className="button secondary"
                onClick={() => setResetOpen(false)}
              >
                Keep tinkering
              </button>
              <button
                className="button primary"
                onClick={() => {
                  setSettings(defaultSettings())
                  setResetOpen(false)
                  navigate('race')
                  notify('Fresh grid. Same questionable sporting ambitions.')
                }}
              >
                Reset settings
              </button>
            </div>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Sparkles size={18} />
          {toast}
          <button
            className="icon-button"
            onClick={() => setToast('')}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </>
  )
}
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false }
  static getDerivedStateFromError() {
    return { error: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      'The league encountered a problem:',
      error,
      info.componentStack,
    )
  }
  render() {
    if (this.state.error)
      return (
        <div className="error-screen">
          <AnimalSprite
            animal={ANIMALS.find((a) => a.id === 'hippo')!}
            size={140}
          />
          <h1>A hippo has sat on the timing equipment.</h1>
          <p>Your saved stable is safe. Reset league settings to recover.</p>
          <button
            className="button primary"
            onClick={() => {
              try {
                localStorage.removeItem('arl:settings:v1')
              } catch {
                /* Recovery still reloads with in-memory defaults. */
              }
              window.location.reload()
            }}
          >
            Reset & reload
          </button>
        </div>
      )
    return this.props.children
  }
}
