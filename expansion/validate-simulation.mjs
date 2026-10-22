// Read the real application modules, strip TypeScript in memory, and run them.
// Node 24+; no dependencies, application edits, emitted code, or app artifacts.
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'

const pack = new URL('./', import.meta.url)
const read = (name) => readFile(new URL(name, pack), 'utf8')
const dataModule = (code) =>
  `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
const types = dataModule(stripTypeScriptTypes(await read('../src/lib/types.ts')))
const engineCode = stripTypeScriptTypes(
  await read('../src/lib/simulation.ts'),
).replace("'./types'", JSON.stringify(types))
const engine = await import(dataModule(engineCode))
const current = await import(
  dataModule(stripTypeScriptTypes(await read('../src/data/animals.ts'))),
)
const additions = JSON.parse(await read('species.json'))
const { LOCOMOTION } = await import(types)
const ids = new Set(current.ANIMALS.map((a) => a.id))
const taxa = new Set(current.ANIMALS.map((a) => a.scientific))
assert.equal(current.ANIMALS.length, 36)
assert.equal(additions.length, 64)
for (const a of additions) {
  assert(!ids.has(a.id), `Duplicate ID ${a.id}`)
  assert(!taxa.has(a.scientific), `Duplicate taxon ${a.scientific}`)
  ids.add(a.id)
  taxa.add(a.scientific)
  assert(LOCOMOTION[a.locomotion], `Unknown gait ${a.id}`)
  assert.equal(engine.validateStats(a.stats, 'plausible'), null, a.id)
}
assert.equal(ids.size, 100)
const distances = [25, 100, 400, 1000, 5000, 10000]
const entrants = [...current.ANIMALS, ...additions].map(current.toEntrant)
const results = []
for (const a of entrants) {
  let last = 0
  const finishes = {}
  for (const distance of distances) {
    const result = engine.simulate([a], distance, false)[0]
    assert(Number.isFinite(result.finish) && result.finish > last, a.id)
    assert(result.peak <= a.stats.topSpeed + 1e-9, a.id)
    const position = engine.motionAt(result.effective, result.finish)
    assert(Math.abs(position.distance - distance) < Math.max(1e-7, distance * 1e-9), a.id)
    last = result.finish
    finishes[distance] = result.finish
  }
  results.push({ id: a.id, new: !current.ANIMALS.some((x) => x.id === a.id), finishSeconds: finishes })
}
const report = {
  engine: 'Unmodified src/lib/simulation.ts, stripped in memory with node:module',
  distancesMetres: distances,
  species: entrants.length,
  simulations: entrants.length * distances.length,
  status: 'pass',
  note: 'Numerical compatibility only. Long race times are mathematical extrapolations, not evidence of biological endurance.',
  results,
}
await writeFile(new URL('review/simulation-checks.json', pack), JSON.stringify(report, null, 2) + '\n')
console.log(`PASS: ${report.simulations} races using the actual application engine; 36 + 64 = 100 distinct entries.`)
