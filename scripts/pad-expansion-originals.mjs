// Repair the expansion's source border with lossless canvas extension only.
// The original 36 PNGs are outside this script's scope. Repeat runs are idempotent.
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const imageDir = path.join(root, 'assets/animals/originals')
const reportFile = path.join(root, 'expansion/review/border-repair.json')
const metadata = JSON.parse(
  await fs.readFile(
    path.join(root, 'src/data/expansion-metadata.json'),
    'utf8',
  ),
)
const previous = JSON.parse(
  await fs.readFile(
    path.join(root, 'expansion/review/pre-border-image-checks.json'),
    'utf8',
  ),
)
const hash = (data) => crypto.createHash('sha256').update(data).digest('hex')
const checkOnly = process.argv.includes('--check')
let recorded
try {
  recorded = JSON.parse(await fs.readFile(reportFile, 'utf8'))
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
const records = []
function assertBorder(data, width, height, id) {
  const xMargin = Math.ceil(width / 10),
    yMargin = Math.ceil(height / 10)
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (
        (x < xMargin ||
          x >= width - xMargin ||
          y < yMargin ||
          y >= height - yMargin) &&
        data[(y * width + x) * 4 + 3] !== 0
      )
        throw new Error(`${id}: nonzero alpha in the strict 10% source border`)
}
for (const id of Object.keys(metadata)) {
  const file = path.join(imageDir, `${id}.png`)
  const input = await fs.readFile(file)
  const old = recorded?.species.find((entry) => entry.id === id)
  if (old) {
    if (hash(input) !== old.outputSha256)
      throw new Error(`${id}: repaired original differs from recorded output`)
    const { data, info } = await sharp(input)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    assertBorder(data, info.width, info.height, id)
    const retained = await sharp(input)
      .extract(old.contentRect)
      .ensureAlpha()
      .raw()
      .toBuffer()
    if (hash(retained) !== old.retainedRgbaSha256)
      throw new Error(`${id}: original pixel preservation failed`)
    records.push(old)
    continue
  }
  if (checkOnly)
    throw new Error(`${id}: no recorded border repair; run npm run assets:pad`)
  const delivered = previous.images.find((entry) => entry.speciesId === id)
  if (!delivered || hash(input) !== delivered.sha256)
    throw new Error(
      `${id}: unexpected delivered source; inspect before padding`,
    )
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  // p >= (dimension + 2p)/10, hence p >= dimension/8. Use whole pixels.
  const left = Math.ceil(info.width / 8),
    top = Math.ceil(info.height / 8)
  const output = await sharp(input)
    .extend({
      left,
      right: left,
      top,
      bottom: top,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer()
  const contentRect = { left, top, width: info.width, height: info.height }
  const retained = await sharp(output)
    .extract(contentRect)
    .ensureAlpha()
    .raw()
    .toBuffer()
  if (!retained.equals(data))
    throw new Error(`${id}: padding changed original RGBA pixels`)
  const padded = await sharp(output)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  assertBorder(padded.data, padded.info.width, padded.info.height, id)
  const temporary = `${file}.padding-tmp`
  await fs.writeFile(temporary, output)
  await fs.rename(temporary, file)
  records.push({
    id,
    inputSha256: hash(input),
    outputSha256: hash(output),
    inputBytes: input.length,
    outputBytes: output.length,
    contentRect,
    width: padded.info.width,
    height: padded.info.height,
    retainedRgbaSha256: hash(data),
    pixelIdenticalContent: true,
    strictTenPercentTransparentBorder: true,
  })
  // Save progress atomically so an interrupted run can safely resume.
  const temporaryReport = `${reportFile}.tmp`
  await fs.writeFile(
    temporaryReport,
    JSON.stringify(
      {
        schemaVersion: 1,
        deliveredSourceCommit: '42c06ee2354138ef4c961b853b76fe4a45f4d061',
        method:
          'Symmetric transparent canvas extension; no cropping, resampling, alpha cleanup or illustration regeneration. Every original RGBA pixel retained.',
        species: records,
      },
      null,
      2,
    ) + '\n',
  )
  await fs.rename(temporaryReport, reportFile)
}
if (records.length !== Object.keys(metadata).length)
  throw new Error('Incomplete border repair')
console.log(
  `Verified ${records.length} PNGs: strict 10% transparent borders and pixel-identical retained content${checkOnly ? '' : ' (repeat runs make no changes)'}.`,
)
