import type { Locomotion } from './types'

/** Presentation only: never feeds back into the deterministic racing engine. */
export type SpriteGait = 'run' | 'bound' | 'waddle' | 'crawl' | 'undulate'
export const SPRITE_WIDTHS = [96, 192, 384] as const
export function spriteSources(id: string, base = import.meta.env.BASE_URL) {
  const prefix = `${base}animals/${encodeURIComponent(id)}`
  return {
    src: `${prefix}-192.webp`,
    srcSet: SPRITE_WIDTHS.map(
      (width) => `${prefix}-${width}.webp ${width}w`,
    ).join(', '),
  }
}
const GAITS: Record<Locomotion, SpriteGait> = {
  gallop: 'run',
  bound: 'bound',
  biped: 'run',
  waddle: 'waddle',
  crawl: 'crawl',
}
const CADENCE: Record<SpriteGait, { scale: number; min: number; max: number }> =
  {
    run: { scale: 1.5, min: 0.28, max: 1.5 },
    bound: { scale: 1.9, min: 0.4, max: 1.9 },
    waddle: { scale: 1.8, min: 0.65, max: 2.3 },
    crawl: { scale: 2.5, min: 1.1, max: 3.4 },
    undulate: { scale: 3.3, min: 1.8, max: 4 },
  }
export function spriteMotion(
  id: string,
  locomotion: Locomotion,
  speed: number,
) {
  const gait: SpriteGait = id === 'seal' ? 'undulate' : GAITS[locomotion]
  const cadence = CADENCE[gait]
  const safeSpeed = Number.isFinite(speed) ? Math.max(0, speed) : 0
  const seconds = Math.min(
    cadence.max,
    Math.max(cadence.min, cadence.scale / Math.sqrt(safeSpeed + 0.35)),
  )
  // Quantize visual cadence to 50ms so the stylesheet is not rewritten every frame.
  const duration = Math.round(seconds * 20) / 20
  return { gait, duration, moving: safeSpeed > 0 }
}
