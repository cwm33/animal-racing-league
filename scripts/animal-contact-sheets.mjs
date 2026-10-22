import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
const root = path.resolve(import.meta.dirname, '..')
const destination = path.join(root, 'test-results/animal-art')
const catalog = JSON.parse(
  await fs.readFile(path.join(root, 'assets/animals/catalog.json'), 'utf8'),
)
await fs.mkdir(destination, { recursive: true })
const label = (text, width, height = 24) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><text x="${width / 2}" y="17" text-anchor="middle" font-size="12" fill="#304535" font-family="sans-serif">${text.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</text></svg>`,
  )
const background = (width, height) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><pattern id="p" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#f7f7f0"/><rect width="8" height="8" fill="#e8ecdf"/><rect x="8" y="8" width="8" height="8" fill="#e8ecdf"/></pattern></defs><rect width="100%" height="100%" fill="url(#p)"/></svg>`,
  )
const overview = []
for (let i = 0; i < catalog.length; i++) {
  const animal = catalog[i],
    x = (i % 6) * 184,
    y = Math.floor(i / 6) * 122
  overview.push({ input: label(animal.name, 184), left: x, top: y })
  for (const [size, offset] of [
    [64, 28],
    [32, 112],
  ]) {
    const input = await sharp(
      path.join(root, `public/animals/${animal.id}-192.webp`),
    )
      .resize(size, size)
      .png()
      .toBuffer()
    overview.push({ input, left: x + offset, top: y + 31 })
  }
  overview.push(
    { input: label('64 px', 64, 20), left: x + 28, top: y + 99 },
    { input: label('32 px', 64, 20), left: x + 96, top: y + 99 },
  )
}
await sharp(
  background(1104, Math.max(122, Math.ceil(catalog.length / 6) * 122)),
)
  .composite(overview)
  .png()
  .toFile(path.join(destination, 'all-at-64-and-32.png'))
for (let page = 0; page < Math.ceil(catalog.length / 6); page++) {
  const composites = []
  for (let slot = 0; slot < 6; slot++) {
    const animal = catalog[page * 6 + slot]
    if (!animal) continue
    const x = (slot % 3) * 384,
      y = Math.floor(slot / 3) * 416
    const input = await sharp(
      path.join(root, `public/animals/${animal.id}-384.webp`),
    )
      .png()
      .toBuffer()
    composites.push(
      { input, left: x, top: y + 25 },
      { input: label(animal.name, 384), left: x, top: y },
    )
  }
  await sharp(background(1152, 832))
    .composite(composites)
    .png()
    .toFile(path.join(destination, `detail-${page + 1}.png`))
}
await sharp(path.join(destination, 'all-at-64-and-32.png'))
  .webp({ quality: 90, effort: 4 })
  .toFile(path.join(root, 'assets/animals/collection-preview.webp'))
console.log(
  `Wrote ${1 + Math.ceil(catalog.length / 6)} review sheets to ${destination} and the collection preview to assets/animals/`,
)
