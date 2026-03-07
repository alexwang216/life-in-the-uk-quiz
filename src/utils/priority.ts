import type { Question } from '../types'

/**
 * Selects the next question using weighted random selection based on priority.
 *
 * WHY weighted random instead of just "pick the highest priority"?
 * - Pure highest-priority would show the same wrong questions in a loop,
 *   which is frustrating and doesn't help learning.
 * - Weighted random means harder questions appear MORE often but easier ones
 *   still appear occasionally, keeping review natural.
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
 * Returns updated priority after an answer.
 * - Correct: lower priority (min 1) — we know it well
 * - Incorrect: raise priority — needs more practice
 */
export function updatePriority(current: number, isCorrect: boolean): number {
  return isCorrect ? Math.max(1, current - 1) : current + 2
}
