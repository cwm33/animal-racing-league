import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const originalDir = path.join(root, 'assets/animals/originals')
const runtimeDir = path.join(root, 'public/animals')
const catalog = JSON.parse(
  await fs.readFile(path.join(root, 'assets/animals/catalog.json'), 'utf8'),
)
const checkOnly = process.argv.includes('--check')
const recorded = checkOnly
  ? JSON.parse(
      await fs.readFile(
        path.join(root, 'assets/animals/manifest.json'),
        'utf8',
      ),
    )
  : null
const partial = process.argv.includes('--partial')
const widths = [96, 192, 384]
const issues = []
const report = []
await fs.mkdir(runtimeDir, { recursive: true })
for (const animal of catalog) {
  const file = path.join(originalDir, `${animal.id}.png`)
  try {
    const original = await fs.readFile(file)
    const image = sharp(original)
    const metadata = await image.metadata()
    if (metadata.format !== 'png' || !metadata.hasAlpha)
      throw new Error('Original must be a transparent PNG')
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    let clear = 0,
      solid = 0,
      minX = info.width,
      minY = info.height,
      maxX = -1,
      maxY = -1
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++) {
        const alpha = data[(y * info.width + x) * 4 + 3]
        if (alpha === 0) clear++
        if (alpha >= 240) solid++
        if (alpha >= 20) {
          minX = Math.min(minX, x)
          minY = Math.min(minY, y)
          maxX = Math.max(maxX, x)
          maxY = Math.max(maxY, y)
        }
      }
    const pixels = info.width * info.height
    if (clear / pixels < 0.2 || solid / pixels < 0.08)
      throw new Error(
        'Expected substantial transparent background and solid character',
      )
    if (
      minX < 2 ||
      minY < 2 ||
      maxX >= info.width - 2 ||
      maxY >= info.height - 2
    )
      throw new Error(
        `Character touches image edge: ${[minX, minY, maxX, maxY].join(',')}`,
      )
    const bounds = {
      left: minX,
      top: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    }
    if (!checkOnly) {
      // Only trim transparent padding; retain the generated original unchanged.
      // Use a shared 384px frame and foot baseline for stable cross-species layout.
      const { data: cropped, info: cropInfo } = await sharp(original)
        .extract(bounds)
        .resize({ width: 338, height: 326, fit: 'inside' })
        .png()
        .toBuffer({ resolveWithObject: true })
      const framed = await sharp({
        create: {
          width: 384,
          height: 384,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([
          {
            input: cropped,
            left: Math.round((384 - cropInfo.width) / 2),
            top: 350 - cropInfo.height,
          },
        ])
        .png()
        .toBuffer()
      for (const width of widths)
        await sharp(framed)
          .resize(width, width)
          .webp({ quality: 85, alphaQuality: 100, effort: 6 })
          .toFile(path.join(runtimeDir, `${animal.id}-${width}.webp`))
    }
    let webpBytes = 0
    for (const width of widths) {
      const output = await fs.readFile(
        path.join(runtimeDir, `${animal.id}-${width}.webp`),
      )
      const webp = sharp(output)
      const m = await webp.metadata()
      if (
        m.format !== 'webp' ||
        !m.hasAlpha ||
        m.width !== width ||
        m.height !== width
      )
        throw new Error(`Invalid ${width}px derivative`)
      const statistics = await webp.stats()
      if (statistics.isOpaque || statistics.channels[3].min !== 0)
        throw new Error(`Missing transparency in ${width}px WebP`)
      webpBytes += output.byteLength
    }
    const sha256 = crypto.createHash('sha256').update(original).digest('hex')
    if (
      checkOnly &&
      recorded.assets.find((asset) => asset.id === animal.id)?.sha256 !== sha256
    )
      throw new Error(
        'Original differs from the manifest; run npm run assets:build',
      )
    report.push({
      id: animal.id,
      width: info.width,
      height: info.height,
      originalBytes: original.byteLength,
      webpBytes,
      sha256,
      bounds,
      transparentPercent: Math.round((clear / pixels) * 100),
    })
  } catch (error) {
    if (partial && error.code === 'ENOENT') continue
    issues.push(`${animal.id}: ${error.message}`)
  }
}
if (!partial && report.length !== catalog.length)
  issues.push(
    `Expected ${catalog.length} complete species, got ${report.length}`,
  )
console.log(
  JSON.stringify(
    {
      species: report.length,
      originalsMB: +(
        report.reduce((n, a) => n + a.originalBytes, 0) / 1e6
      ).toFixed(2),
      runtimeMB: +(report.reduce((n, a) => n + a.webpBytes, 0) / 1e6).toFixed(
        2,
      ),
      issues,
    },
    null,
    2,
  ),
)
if (issues.length) process.exitCode = 1
else if (!checkOnly)
  await fs.writeFile(
    path.join(root, 'assets/animals/manifest.json'),
    JSON.stringify(
      {
        styleReference: 'cheetah',
        framing:
          '384px square, 350px foot baseline; transparent padding normalized without changing original artwork',
        assets: report,
      },
      null,
      2,
    ) + '\n',
  )
