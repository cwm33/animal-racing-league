import { describe, expect, it } from 'vitest'
import { ANIMALS } from '../data/animals'
import catalog from '../../assets/animals/catalog.json'
import { spriteMotion, spriteSources } from './sprites'

describe('illustration presentation', () => {
  it('keeps a complete one-to-one artwork catalog for the existing roster', () => {
    expect(catalog.map((a) => a.id)).toEqual(ANIMALS.map((a) => a.id))
    expect(new Set(catalog.map((a) => a.id)).size).toBe(36)
  })
  it('serves responsive WebP files under the GitHub Pages project path', () => {
    const urls = spriteSources('platypus', '/animal-racing-league/')
    expect(urls.src).toBe('/animal-racing-league/animals/platypus-192.webp')
    expect(urls.srcSet).toContain('platypus-96.webp 96w')
    expect(urls.srcSet).toContain('platypus-384.webp 384w')
    expect(spriteSources('a/b', '/').src).toBe('/animals/a%2Fb-192.webp')
  })
  it('uses species-appropriate gaits including a dedicated elephant-seal undulation', () => {
    expect(spriteMotion('horse', 'gallop', 4).gait).toBe('run')
    expect(spriteMotion('human', 'biped', 4).gait).toBe('run')
    expect(spriteMotion('rabbit', 'bound', 4).gait).toBe('bound')
    expect(spriteMotion('penguin', 'waddle', 1).gait).toBe('waddle')
    expect(spriteMotion('tortoise', 'crawl', 0.1).gait).toBe('crawl')
    expect(spriteMotion('seal', 'crawl', 1).gait).toBe('undulate')
  })
  it('responds to simulated speed while keeping a stable visual cadence for extreme monsters', () => {
    for (const animal of ANIMALS) {
      const slow = spriteMotion(animal.id, animal.locomotion, 0.1)
      const fast = spriteMotion(animal.id, animal.locomotion, 20)
      expect(fast.duration).toBeLessThanOrEqual(slow.duration)
      for (const speed of [0, -1, 0.000001, 1e9, Infinity, NaN]) {
        const motion = spriteMotion(animal.id, animal.locomotion, speed)
        expect(Number.isFinite(motion.duration)).toBe(true)
        expect(motion.duration).toBeGreaterThanOrEqual(0.25)
        expect(motion.duration).toBeLessThanOrEqual(4)
      }
    }
  })
  it('does not animate stationary or non-finite movement', () => {
    for (const speed of [0, -1, Infinity, NaN])
      expect(spriteMotion('cheetah', 'gallop', speed).moving).toBe(false)
    expect(spriteMotion('snail', 'crawl', 0.0007).moving).toBe(true)
  })
})
