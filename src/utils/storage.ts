// WHY a schema version?
// When we change the shape of saved data (e.g. new priority values, new fields),
// old localStorage data from previous app versions can cause subtle bugs —
// like showing "Easy" instead of "New" after a reset because priorities were
// saved as 1 under the old system.
// Bumping STATE_VERSION forces a clean slate on next load instead of silently
// using stale data. Always increment this when the saved state shape changes.
const STORAGE_KEY = 'quiz_app_state'
const STATE_VERSION = 4  // bump when SavedState shape changes

export interface SavedState {
  version: number
  priorities: Record<string, number>
  attemptedIds: string[]
  answeredIds: string[]
  incorrectIds: string[]
  everIncorrectIds: string[]
  markedForReviewIds: string[]
  questionResults: Record<string, 'correct' | 'incorrect'>
  history: Array<{ questionId: string; wasCorrect: boolean }>
}

export function loadState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedState
    // If the saved data is from an older schema version, discard it entirely.
    // This prevents old priority values (e.g. 1 from the old system) from
    // being loaded into a new app that expects a different range.
    if (parsed.version !== STATE_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveState(state: Omit<SavedState, 'version'>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: STATE_VERSION }))
  } catch (err) {
    console.error('Failed to save state:', err)
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY)
}
