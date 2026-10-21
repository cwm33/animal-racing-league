import { describe, expect, it } from 'vitest'
import { clockPlan, smartTime } from './playback'
describe('smart clock', () => {
  it('holds the winning sprint in view before fast-forwarding the tail', () => {
    const plan = clockPlan([4, 5000, null])
    expect(smartTime(0, plan)).toBe(0)
    expect(smartTime(14, plan)).toBe(4)
    expect(smartTime(28, plan)).toBeCloseTo(5000)
    expect(plan.duration).toBe(28)
  })
  it('maps similar finish times linearly', () => {
    const plan = clockPlan([4, 5])
    expect(plan.duration).toBe(14)
    expect(smartTime(7, plan)).toBe(2.5)
  })
  it('is finite and monotonic with only DNF entrants', () => {
    const plan = clockPlan([null, null])
    let previous = 0
    for (let i = 0; i <= 28; i++) {
      const current = smartTime(i, plan)
      expect(Number.isFinite(current)).toBe(true)
      expect(current).toBeGreaterThanOrEqual(previous)
      previous = current
    }
  })
  it('clamps a scrubbed clock to its endpoints', () => {
    const plan = clockPlan([5, 100])
    expect(smartTime(-100, plan)).toBe(0)
    expect(smartTime(100, plan)).toBeCloseTo(100)
  })
})
