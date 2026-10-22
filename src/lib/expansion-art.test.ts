import { it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import repairs from '../../expansion/review/border-repair.json'
import delivered from '../../expansion/review/pre-border-image-checks.json'
import metadata from '../data/expansion-metadata.json'

const digest = (data: Buffer) => createHash('sha256').update(data).digest('hex')

it('repairs all 64 source borders while retaining every delivered RGBA pixel', async () => {
  expect(repairs.species.map((entry) => entry.id).sort()).toEqual(
    Object.keys(metadata).sort(),
  )
  for (const repair of repairs.species) {
    expect(repair.inputSha256).toBe(
      delivered.images.find((item) => item.speciesId === repair.id)!.sha256,
    )
    const png = readFileSync(
      new URL(
        `../../assets/animals/originals/${repair.id}.png`,
        import.meta.url,
      ),
    )
    expect(digest(png)).toBe(repair.outputSha256)
    const { data, info } = await sharp(png)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const marginX = Math.ceil(info.width / 10),
      marginY = Math.ceil(info.height / 10)
    let nonclear = 0
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++)
        if (
          (x < marginX ||
            x >= info.width - marginX ||
            y < marginY ||
            y >= info.height - marginY) &&
          data[(y * info.width + x) * 4 + 3] !== 0
        )
          nonclear++
    expect(nonclear, repair.id).toBe(0)
    const { left, top, width, height } = repair.contentRect
    const retained = Buffer.alloc(width * height * 4)
    for (let y = 0; y < height; y++) {
      const start = ((top + y) * info.width + left) * 4
      data.copy(retained, y * width * 4, start, start + width * 4)
    }
    expect(digest(retained), repair.id).toBe(repair.retainedRgbaSha256)
  }
}, 30000)
