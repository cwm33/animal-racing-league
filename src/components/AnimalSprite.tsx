import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { Animal } from '../lib/types'
import { spriteMotion, spriteSources } from '../lib/sprites'

type SpriteAnimal = Pick<Animal, 'id' | 'name' | 'emoji'> &
  Partial<Pick<Animal, 'locomotion'>>
export function AnimalSprite({
  animal,
  size = 48,
  className = '',
  decorative = true,
  moving = false,
  speed = 0,
  priority = false,
}: {
  animal: SpriteAnimal
  size?: number
  className?: string
  decorative?: boolean
  moving?: boolean
  speed?: number
  priority?: boolean
}) {
  const sources = spriteSources(animal.id)
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const failed = failedSource === sources.src
  const motion = spriteMotion(animal.id, animal.locomotion ?? 'gallop', speed)
  const style = {
    width: size,
    height: size,
    '--stride-duration': `${motion.duration}s`,
    '--fallback-size': `${size * 0.75}px`,
  } as CSSProperties
  return (
    <span
      className={`animal-sprite ${moving && motion.moving ? 'is-moving' : ''} ${className}`.trim()}
      data-animal={animal.id}
      data-gait={motion.gait}
      data-fallback={failed || undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : animal.name}
      aria-hidden={decorative || undefined}
      style={style}
    >
      <span className="animal-sprite-motion">
        {failed ? (
          <span className="animal-sprite-fallback" aria-hidden="true">
            {animal.emoji}
          </span>
        ) : (
          <img
            {...sources}
            sizes={`${size}px`}
            width={384}
            height={384}
            alt=""
            draggable={false}
            decoding="async"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            onError={() => setFailedSource(sources.src)}
          />
        )}
      </span>
    </span>
  )
}
