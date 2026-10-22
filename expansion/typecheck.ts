// Compile-time compatibility with the unmodified application schema.
import species from './species.json'
import type { Animal, RacingStats } from '../src/lib/types'

// JSON imports widen string literals; explicitly check the shared key shapes
// and numeric stats here, and enum membership in validate-simulation.mjs.
type ScalarFields = Omit<Animal, 'category' | 'locomotion' | 'source'>
const checkShapes: ScalarFields[] = species
const checkStats: RacingStats[] = species.map((entry) => entry.stats)
void checkShapes
void checkStats
