import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { ANIMALS, toEntrant, DEFAULT_IDS } from '../data/animals'
import metadata from '../data/expansion-metadata.json'
import provenance from '../data/provenance.json'
import { belongsToGroup, classificationFor } from '../data/taxonomy'
import pack from '../../expansion/species.json'
import packSources from '../../expansion/sources.json'
import packImages from '../../expansion/review/image-checks.json'
import baseline from './fixtures/original-roster.json'
import direction from '../../assets/animals/art-direction.json'
import catalog from '../../assets/animals/catalog.json'
import { effectiveStats, simulate } from './simulation'
import { isEntrant } from './storage'

const digest = (id: string) =>
  createHash('sha256')
    .update(
      readFileSync(
        new URL(`../../assets/animals/originals/${id}.png`, import.meta.url),
      ),
    )
    .digest('hex')

describe('100-species integration contract', () => {
  it('retains every original identity, racing input, illustration, and default lineup', () => {
    expect(ANIMALS.slice(0, 36)).toEqual(baseline.animals)
    for (const [id, hash] of Object.entries(baseline.originals))
      expect(digest(id)).toBe(hash)
    expect(DEFAULT_IDS).toEqual([
      'cheetah',
      'horse',
      'hippo',
      'rabbit',
      'tortoise',
    ])
    for (const original of baseline.animals)
      expect(
        isEntrant({ ...original, referenceMass: original.stats.mass }),
      ).toBe(true)
  })
  it('imports all 64 supplied species without taxon collisions or missing images', () => {
    expect(ANIMALS).toHaveLength(100)
    expect(new Set(ANIMALS.map((a) => a.id)).size).toBe(100)
    expect(new Set(ANIMALS.map((a) => a.scientific)).size).toBe(100)
    expect(catalog).toEqual(
      ANIMALS.map(({ id, name, scientific }) => ({ id, name, scientific })),
    )
    expect(Object.keys(direction.species).sort()).toEqual(
      ANIMALS.map((a) => a.id).sort(),
    )
    for (const supplied of pack) {
      const animal = ANIMALS.find((a) => a.id === supplied.id)!
      expect(animal.stats).toEqual(supplied.stats)
      expect(animal.scientific).toBe(supplied.scientific)
      expect(animal.name).toBe(supplied.name)
      expect(digest(animal.id)).toBe(
        packImages.images.find((a) => a.speciesId === animal.id)!.sha256,
      )
      expect(isEntrant(toEntrant(animal))).toBe(true)
    }
  })
  it('connects explicit taxonomy, including non-mammals and uncertain ranks', () => {
    expect(Object.keys(metadata)).toHaveLength(64)
    const counts = Object.fromEntries(
      ['mammals', 'birds', 'reptiles', 'amphibians', 'invertebrates'].map(
        (group) => [
          group,
          ANIMALS.filter((a) => classificationFor(a.id)?.classId === group)
            .length,
        ],
      ),
    )
    expect(counts).toEqual({
      mammals: 51,
      birds: 16,
      reptiles: 12,
      amphibians: 6,
      invertebrates: 15,
    })
    for (const supplied of pack) {
      const classification = classificationFor(supplied.id)!
      expect(classification.order).toBe(supplied.taxonomy.order)
      expect(classification.family).toBe(supplied.taxonomy.family)
    }
    expect(classificationFor('velvet-worm')!.order).toBeNull()
    expect(belongsToGroup('elephant-shrew', 'elephants')).toBe(false)
    expect(belongsToGroup('red-panda', 'bears')).toBe(false)
    expect(belongsToGroup('springhare', 'rodents')).toBe(true)
    expect(belongsToGroup('common-toad', 'amphibians')).toBe(true)
    expect(belongsToGroup('coconut-crab', 'invertebrates')).toBe(true)
    expect(belongsToGroup('quokka', 'marsupials')).toBe(true)
  })
  it('retains per-field units, estimates and real reference IDs separately from presets', () => {
    expect(provenance).toEqual(packSources)
    expect(provenance.species).toHaveLength(64)
    for (const record of provenance.species) {
      const animal = ANIMALS.find((a) => a.id === record.speciesId)!
      for (const [key, field] of Object.entries(record.fields)) {
        expect(field.value).toBe(animal.stats[key as keyof typeof animal.stats])
        expect(field.unit).toBeTruthy()
        expect(field.status).toBeTruthy()
        for (const item of field.evidence) {
          const reference = record.references.find(
            (ref) => ref.id === item.sourceId,
          )!
          expect(reference.url).toMatch(/^https:\/\//)
          expect(reference.accessed).toBe('2026-10-22')
        }
      }
    }
    expect(
      provenance.species.filter(
        (a) => a.fields.mass.status === 'model_estimate',
      ),
    ).toHaveLength(8)
  })
  it('adds legless locomotion without changing supplied physics or legacy saved crawl values', () => {
    for (const id of ['rosy-boa', 'earthworm', 'slug']) {
      const animal = toEntrant(ANIMALS.find((a) => a.id === id)!)
      expect(animal.locomotion).toBe('slither')
      const legacy = { ...animal, locomotion: 'crawl' as const }
      expect(isEntrant(legacy)).toBe(true)
      expect(effectiveStats(animal, false)).toEqual(
        effectiveStats(legacy, false),
      )
      for (const distance of [25, 100, 400, 1000, 5000, 10000])
        expect(simulate([animal], distance)[0].finish).toBe(
          simulate([legacy], distance)[0].finish,
        )
    }
  })
})
