// Generate the image-asset identity catalog from the application's canonical roster.
// Row layout is deliberately explicit; fail closed if it changes rather than
// creating a partial asset catalog. Never execute the application to read identities.
import fs from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'
const root = path.resolve(import.meta.dirname, '..')
const source = await fs.readFile(path.join(root, 'src/data/animals.ts'), 'utf8')
// Parse literals with TypeScript so apostrophes and Unicode names survive intact.
const tree = ts.createSourceFile(
  'animals.ts',
  source,
  ts.ScriptTarget.Latest,
  true,
)
const declaration = tree.statements
  .filter(ts.isVariableStatement)
  .flatMap((statement) => [...statement.declarationList.declarations])
  .find((item) => ts.isIdentifier(item.name) && item.name.text === 'rows')
const rows = declaration?.initializer
if (!rows || !ts.isArrayLiteralExpression(rows) || !rows.elements.length)
  throw new Error(
    'Cannot locate canonical animal rows; revise roster sync parser',
  )
const catalog = rows.elements.map((row) => {
  if (!ts.isArrayLiteralExpression(row) || row.elements.length !== 15)
    throw new Error('Unexpected canonical animal row schema')
  const identity = row.elements.slice(0, 3)
  if (!identity.every(ts.isStringLiteral))
    throw new Error('Animal identity must use string literals')
  const [id, name, scientific] = identity.map((value) => value.text)
  return { id, name, scientific }
})
if (
  new Set(catalog.map((a) => a.scientific.toLowerCase().trim())).size !==
  catalog.length
)
  throw new Error('Duplicate scientific taxa')
const ids = new Set(catalog.map((a) => a.id))
if (ids.size !== catalog.length) throw new Error('Duplicate animal IDs')
for (const a of catalog) {
  if (!/^[a-z][a-z0-9-]*$/.test(a.id) || !a.name.trim() || !a.scientific.trim())
    throw new Error(`Invalid species identity: ${JSON.stringify(a)}`)
}
const destination = path.join(root, 'assets/animals/catalog.json')
const output = JSON.stringify(catalog, null, 2) + '\n'
if (process.argv.includes('--check')) {
  if ((await fs.readFile(destination, 'utf8')) !== output)
    throw new Error('Stale asset catalog; run npm run roster:sync')
  console.log(
    `Verified ${catalog.length} species in canonical roster and asset catalog`,
  )
} else {
  await fs.writeFile(destination, output)
  console.log(`Synchronized ${catalog.length} species into asset catalog`)
}
