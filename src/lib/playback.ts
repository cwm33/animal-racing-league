/** Smart clock keeps the winning sprint visible, then accelerates the long tail. */
export function clockPlan(finishes: (number | null)[]) {
  const finite = finishes.filter(
    (t): t is number => t !== null && Number.isFinite(t),
  )
  const first = finite.length ? Math.min(...finite) : 30
  const end = finite.length ? Math.max(...finite) : 60
  const hasTail = end > first * 1.5
  return { first, end, duration: hasTail ? 28 : 14, hasTail }
}
export function smartTime(
  playhead: number,
  plan: ReturnType<typeof clockPlan>,
): number {
  const p = Math.max(0, Math.min(plan.duration, playhead))
  if (p === plan.duration) return plan.end
  if (!plan.hasTail) return (plan.end * p) / plan.duration
  if (p <= 14) return (plan.first * p) / 14
  return plan.first * Math.pow(plan.end / plan.first, (p - 14) / 14)
}
