import type { Question } from '../types'

/**
 * Selects the next question using weighted random selection based on priority.
 *
 * WHY weighted random instead of "pick the highest priority"?
 * - Pure highest-priority would show the same wrong questions in a loop.
 * - Weighted random means harder questions appear MORE often, but easier ones
 *   still appear occasionally — keeping review natural.
 */
export function pickWeightedQuestion(
  questions: Question[],
  excludeId: string | null = null
): Question | null {
  const pool = excludeId ? questions.filter(q => q.id !== excludeId) : questions
  if (pool.length === 0) return questions[0] ?? null

  const totalWeight = pool.reduce((sum, q) => sum + q.priority, 0)
  let rand = Math.random() * totalWeight

  for (const q of pool) {
    rand -= q.priority
    if (rand <= 0) return q
  }

  return pool[pool.length - 1]
}

/**
 * Priority system:
 *   Not attempted : 50  — WHY 50? With in-progress questions at 8 and easy at
 *                         1–4, a gap of only 10 vs 8 barely changes the odds per
 *                         question. At 50, one unattempted question outweighs
 *                         ~6 in-progress ones, ensuring new material surfaces
 *                         much more aggressively until everything is attempted.
 *   Correct       : -2  (min 1)
 *   Incorrect     : +3
 *
 * Badge thresholds:
 *   New         : !attempted              (explicit flag, never derived from priority)
 *   In Progress : priority 5–9            (answered correctly 1–2 times)
 *   Easy        : priority <= 4           (answered correctly 3+ times)
 *   Review      : priority 13–15          (answered incorrectly once: 10+3=13)
 *   Hard        : priority >= 16          (answered incorrectly 2+ times)
 *
 * NOTE: thresholds are based on priority values AFTER the first answer,
 * which always starts from 10 (the post-attempt baseline), not 50.
 * PRIORITY_NOT_ATTEMPTED (50) is only ever the starting value — once
 * attempted is set to true, priority is updated from 10 via updatePriority.
 */
export const PRIORITY_NOT_ATTEMPTED = 50
export const PRIORITY_FIRST_ATTEMPT = 10  // baseline priority on first answer
export const THRESHOLD_IN_PROGRESS = 9
export const THRESHOLD_EASY = 4
export const THRESHOLD_HARD = 16

export function updatePriority(current: number, isCorrect: boolean): number {
  // WHY use PRIORITY_FIRST_ATTEMPT here?
  // The starting priority is 50 (to surface new questions aggressively), but
  // once answered, the question enters the normal 1–20 range. We don't want
  // 50 - 2 = 48 on first correct — that would still look "New" in weight terms.
  const base = current === PRIORITY_NOT_ATTEMPTED ? PRIORITY_FIRST_ATTEMPT : current
  if (isCorrect) return Math.max(1, base - 2)
  return base + 3
}
