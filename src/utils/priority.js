/**
 * Selects the next question using weighted random selection based on priority.
 *
 * Why weighted random instead of just "pick the highest priority"?
 * - Pure highest-priority would show the same wrong questions in a loop,
 *   which is frustrating and doesn't help learning.
 * - Weighted random means harder questions appear MORE often but easier ones
 *   still appear occasionally, which keeps review natural.
 *
 * How it works:
 * 1. Each question has a priority score (starts at 1, goes up on wrong, down on correct).
 * 2. We treat priority scores as weights — higher priority = higher chance of being picked.
 * 3. We pick a random point in the total weight range and find which question it lands on.
 *
 * @param {Array} questions - Array of { id, priority, ... }
 * @param {string|null} excludeId - ID to exclude (avoid repeating the same question)
 * @returns question object or null
 */
export function pickWeightedQuestion(questions, excludeId = null) {
  const pool = excludeId
    ? questions.filter(q => q.id !== excludeId)
    : questions

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
 * - Correct: lower priority (min 1) — we've seen it and got it right
 * - Incorrect: raise priority — needs more practice
 *
 * @param {number} current - current priority
 * @param {boolean} isCorrect
 * @returns new priority number
 */
export function updatePriority(current, isCorrect) {
  if (isCorrect) {
    return Math.max(1, current - 1)
  }
  return current + 2
}
