import type { CSSProperties } from 'react'
import type { Animal } from '../lib/types'
import { AnimalSprite } from './AnimalSprite'
export function AnimalAvatar({
  animal,
  small = false,
}: {
  animal: Pick<Animal, 'id' | 'emoji' | 'color' | 'name'>
  small?: boolean
}) {
  return (
    <span
      className={`animal-avatar ${small ? 'small' : ''}`}
      style={{ '--animal-color': animal.color } as CSSProperties}
      aria-hidden="true"
    >
      <AnimalSprite animal={animal} size={small ? 35 : 56} />
    </span>
  )
}
