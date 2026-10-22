// Generate the image-asset identity catalog from the application's canonical roster.
// Row layout is deliberately explicit; fail closed if it changes rather than silently
// creating a partial asset catalog. No third-party parser or runtime TS import needed.
import fs from 'node:fs/promises'
import path from 'node:path'
const root = path.resolve(import.meta.dirname, '..')
const source = await fs.readFile(path.join(root, 'src/data/animals.ts'), 'utf8')
const section = source.match(/const rows: Row\[\] = \[([\s\S]*?)\n\]\nexport const ANIMALS:/)
if (!section) throw new Error('Cannot locate canonical animal rows; revise roster sync parser')
const rows = [...section[1].matchAll(/\[\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',/g)]
const count = (section[1].match(/\n  \[\n/g) ?? []).length
if (rows.length !== count || !rows.length) throw new Error(`Parsed ${rows.length}/${count} rows: unexpected animal schema`)
const catalog = rows.map(([, id, name, scientific]) => ({ id, name, scientific }))
const ids = new Set(catalog.map(a => a.id))
if (ids.size !== catalog.length) throw new Error('Duplicate animal IDs')
for (const a of catalog) {
  if (!/^[a-z][a-z0-9-]*$/.test(a.id) || !a.name.trim() || !a.scientific.trim())
    throw new Error(`Invalid species identity: ${JSON.stringify(a)}`)
}
const destination = path.join(root, 'assets/animals/catalog.json')
const output = JSON.stringify(catalog, null, 2) + '\n'
if (process.argv.includes('--check')) {
  if (await fs.readFile(destination, 'utf8') !== output)
    throw new Error('Stale asset catalog; run npm run roster:sync')
  console.log(`Verified ${catalog.length} species in canonical roster and asset catalog`)
} else {
  await fs.writeFile(destination, output)
  console.log(`Synchronized ${catalog.length} species into asset catalog`)
}
