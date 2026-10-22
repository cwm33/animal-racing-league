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
const expansion = JSON.parse(
  await fs.readFile(
    path.join(root, 'src/data/expansion-metadata.json'),
    'utf8',
  ),
)
const repairReport = JSON.parse(
  await fs.readFile(
    path.join(root, 'expansion/review/border-repair.json'),
    'utf8',
  ),
)
const repairs = new Map(repairReport.species.map((item) => [item.id, item]))
const hash = (data) => crypto.createHash('sha256').update(data).digest('hex')
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
// Fail on extras too: an orphan file can otherwise conceal a misspelled ID.
if (!partial) {
  const ids = catalog.map((animal) => animal.id)
  for (const [directory, expected] of [
    [originalDir, ids.map((id) => `${id}.png`)],
    [
      runtimeDir,
      ids.flatMap((id) => widths.map((width) => `${id}-${width}.webp`)),
    ],
  ]) {
    const files = (await fs.readdir(directory)).filter((file) =>
      /\.(png|webp)$/.test(file),
    )
    if (files.some((file) => !expected.includes(file)))
      issues.push(
        `Unexpected artwork files in ${path.relative(root, directory)}`,
      )
  }
  if (
    checkOnly &&
    JSON.stringify(recorded.assets.map((asset) => asset.id)) !==
      JSON.stringify(ids)
  )
    issues.push('Manifest roster differs from the canonical catalog')
}
for (let start = 0; start < catalog.length; start += 4) {
  await Promise.all(
    catalog.slice(start, start + 4).map(async (animal) => {
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
        const isExpansion = Object.hasOwn(expansion, animal.id)
        const repair = repairs.get(animal.id)
        if (isExpansion) {
          if (
            !repair ||
            hash(original) !== repair.outputSha256 ||
            info.width !== repair.width ||
            info.height !== repair.height
          )
            throw new Error('Missing or stale source border-repair record')
          const xMargin = Math.ceil(info.width / 10),
            yMargin = Math.ceil(info.height / 10)
          for (let y = 0; y < info.height; y++)
            for (let x = 0; x < info.width; x++)
              if (
                (x < xMargin ||
                  x >= info.width - xMargin ||
                  y < yMargin ||
                  y >= info.height - yMargin) &&
                data[(y * info.width + x) * 4 + 3] !== 0
              )
                throw new Error(
                  'Source PNG must have a completely transparent 10% border',
                )
        }
        // Occupancy is measured against the delivered authoring canvas; adding
        // empty padding must not make a valid thin animal fail the density check.
        const occupancyPixels = isExpansion
          ? repair.contentRect.width * repair.contentRect.height
          : pixels
        // A slender wingless stick insect legitimately occupies less canvas than a mammal.
        const minimumSolid = animal.id === 'stick-insect' ? 0.03 : 0.08
        if (clear / pixels < 0.2 || solid / occupancyPixels < minimumSolid)
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
            .resize({
              width: isExpansion ? 300 : 338,
              height: isExpansion ? 300 : 326,
              fit: 'inside',
            })
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
                top: (isExpansion ? 342 : 350) - cropInfo.height,
              },
            ])
            .png()
            .toBuffer()
          for (const width of widths) {
            let output
            if (isExpansion) {
              // Resize the character first. Compositing last prevents Lanczos alpha
              // ringing from spreading into the deliberately empty delivery border.
              const { data: scaled, info: scaledInfo } = await sharp(cropped)
                .resize(
                  Math.max(1, Math.round((cropInfo.width * width) / 384)),
                  Math.max(1, Math.round((cropInfo.height * width) / 384)),
                )
                .png()
                .toBuffer({ resolveWithObject: true })
              output = sharp({
                create: {
                  width,
                  height: width,
                  channels: 4,
                  background: { r: 0, g: 0, b: 0, alpha: 0 },
                },
              }).composite([
                {
                  input: scaled,
                  left: Math.round((width - scaledInfo.width) / 2),
                  top: Math.round((342 * width) / 384) - scaledInfo.height,
                },
              ])
            } else {
              output = sharp(framed).resize(width, width)
            }
            await output
              .webp({ quality: 85, alphaQuality: 100, effort: 6 })
              .toFile(path.join(runtimeDir, `${animal.id}-${width}.webp`))
          }
        }
        let webpBytes = 0
        const derivatives = []
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
          // Check the actual delivered pixels, not just the original PNG metadata.
          let transparentBorder = null
          if (isExpansion) {
            const pixels = await webp.ensureAlpha().raw().toBuffer()
            const margin = Math.ceil(width * 0.1)
            transparentBorder = true
            for (let y = 0; y < width; y++)
              for (let x = 0; x < width; x++)
                if (
                  (x < margin ||
                    x >= width - margin ||
                    y < margin ||
                    y >= width - margin) &&
                  pixels[(y * width + x) * 4 + 3] !== 0
                )
                  transparentBorder = false
            if (!transparentBorder)
              throw new Error(
                `Missing clear 10% border in ${width}px derivative`,
              )
          }
          const sha256 = hash(output)
          if (
            checkOnly &&
            recorded.assets
              .find((asset) => asset.id === animal.id)
              ?.derivatives?.find((item) => item.width === width)?.sha256 !==
              sha256
          )
            throw new Error(
              `Stale or modified ${width}px derivative; run npm run assets:build`,
            )
          derivatives.push({
            width,
            bytes: output.byteLength,
            sha256,
            transparentBorder,
          })
          webpBytes += output.byteLength
        }
        const sha256 = crypto
          .createHash('sha256')
          .update(original)
          .digest('hex')
        if (
          checkOnly &&
          recorded.assets.find((asset) => asset.id === animal.id)?.sha256 !==
            sha256
        )
          throw new Error(
            'Original differs from the manifest; run npm run assets:build',
          )
        report.push({
          id: animal.id,
          width: info.width,
          height: info.height,
          originalBytes: original.byteLength,
          strictTenPercentSourceBorder: isExpansion ? true : null,
          webpBytes,
          derivatives,
          sha256,
          bounds,
          transparentPercent: Math.round((clear / pixels) * 100),
        })
      } catch (error) {
        if (partial && error.code === 'ENOENT') return
        issues.push(`${animal.id}: ${error.message}`)
      }
    }),
  )
}
report.sort(
  (a, b) =>
    catalog.findIndex((item) => item.id === a.id) -
    catalog.findIndex((item) => item.id === b.id),
)
if (new Set(report.map((asset) => asset.sha256)).size !== report.length)
  issues.push('Duplicate source illustrations')
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
          '384px square; original 36 retain 350px baseline and existing framing; expansion uses 342px baseline and maximum 300px silhouette with clear 10% border. Source PNGs unchanged.',
        assets: report,
      },
      null,
      2,
    ) + '\n',
  )
