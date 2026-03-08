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
 *   Not attempted : 10  — new questions are shown often so you cover everything
 *   Correct       : -2  — backs off quickly once you know it (min 1)
 *   Incorrect     : +3  — ramps up faster so weak questions resurface more
 *
 * Badge thresholds:
 *   New         : priority === 10         (not attempted)
 *   In Progress : priority 5–10           (answered correctly 1–2 times: 10→8→6)
 *   Easy        : priority <= 4           (answered correctly 3+ times: 6→4)
 *   Review      : priority 13–15          (answered incorrectly once: 10+3=13)
 *   Hard        : priority >= 16          (answered incorrectly 2+ times: 13+3=16)
 */
export const PRIORITY_INITIAL = 10
export const THRESHOLD_IN_PROGRESS = 10   // 5–10: coming down from New, not Easy yet
export const THRESHOLD_EASY = 4
export const THRESHOLD_HARD = 16

export function updatePriority(current: number, isCorrect: boolean): number {
  if (isCorrect) return Math.max(1, current - 2)
  return current + 3
}
