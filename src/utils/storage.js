const STORAGE_KEY = 'quiz_app_state'

/**
 * Loads the quiz state from localStorage.
 * Returns null if nothing is saved yet.
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Saves the quiz state to localStorage.
 * We save the whole state object at once to keep it simple.
 */
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('Failed to save state:', err)
  }
}

/**
 * Clears all saved quiz state (used for reset).
 */
export function clearState() {
  localStorage.removeItem(STORAGE_KEY)
}
