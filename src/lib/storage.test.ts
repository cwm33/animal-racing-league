import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  defaultSettings,
  isEntrant,
  loadLibrary,
  loadSettings,
  persist,
} from './storage'
beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  })
})
afterEach(() => vi.unstubAllGlobals())
describe('browser persistence', () => {
  it('loads defaults for missing or malformed storage', () => {
    expect(loadSettings()).toEqual(defaultSettings())
    localStorage.setItem('arl:settings:v1', '{not json')
    expect(loadSettings()).toEqual(defaultSettings())
  })
  it('round-trips custom settings and rejects corrupt racers', () => {
    const settings = defaultSettings()
    settings.distance = 5000
    expect(persist('settings', settings)).toBe(true)
    expect(loadSettings()).toEqual(settings)
    settings.entrants[0].locomotion = 'unknown' as never
    persist('settings', settings)
    expect(loadSettings()).toEqual(defaultSettings())
  })
  it('rejects duplicate entrants and invalid distances', () => {
    const settings = defaultSettings()
    settings.entrants.push(settings.entrants[0])
    persist('settings', settings)
    expect(loadSettings()).toEqual(defaultSettings())
    settings.entrants = settings.entrants.slice(0, 1)
    settings.distance = -1
    persist('settings', settings)
    expect(loadSettings()).toEqual(defaultSettings())
  })
  it('handles blocked storage without crashing', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    })
    expect(loadSettings()).toEqual(defaultSettings())
    expect(loadLibrary()).toEqual([])
    expect(persist('settings', defaultSettings())).toBe(false)
  })
  it('validates saved configurations and filters bad library data', () => {
    const animal = defaultSettings().entrants[0]
    expect(isEntrant(animal)).toBe(true)
    expect(isEntrant({ ...animal, stats: {} })).toBe(false)
    expect(isEntrant({ ...animal, locomotion: '__proto__' })).toBe(false)
    expect(isEntrant({ ...animal, referenceMass: 1e200 })).toBe(false)
    localStorage.setItem(
      'arl:library:v1',
      JSON.stringify([
        { id: 'a', savedAt: 'today', animal },
        { id: 'b', animal: {} },
      ]),
    )
    expect(loadLibrary()).toHaveLength(1)
  })
})

it('keeps pre-division v1 custom settings and saved animals unchanged', () => {
  const settings = defaultSettings()
  settings.entrants[0] = {
    ...settings.entrants[0],
    name: 'Grandfathered Turbo Cat',
    custom: true,
    stats: { ...settings.entrants[0].stats, acceleration: 99 },
  }
  settings.mode = 'experimental'
  const library = [
    { id: 'old-v1', savedAt: '2026-01-01', animal: settings.entrants[0] },
  ]
  persist('settings', settings)
  persist('library', library)
  expect(loadSettings()).toEqual(settings)
  expect(loadLibrary()).toEqual(library)
  expect(loadSettings().entrants[0]).not.toHaveProperty('division')
  expect(loadSettings().entrants[0]).not.toHaveProperty('taxonomy')
})
