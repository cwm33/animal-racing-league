import type { CSSProperties } from 'react'
import type { Animal } from '../lib/types'
export function AnimalAvatar({
  animal,
  small = false,
}: {
  animal: Pick<Animal, 'emoji' | 'color' | 'name'>
  small?: boolean
}) {
  return (
    <span
      className={`animal-avatar ${small ? 'small' : ''}`}
      style={{ '--animal-color': animal.color } as CSSProperties}
      aria-hidden="true"
    >
      {animal.emoji}
    </span>
  )
}
