const STORAGE_KEY = 'quiz_app_state'

export interface SavedState {
  priorities: Record<string, number>
  answeredIds: string[]
  incorrectIds: string[]
  everIncorrectIds: string[]
  questionResults: Record<string, 'correct' | 'incorrect'>
  history: Array<{ questionId: string; wasCorrect: boolean }>
}

export function loadState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedState) : null
  } catch {
    return null
  }
}

export function saveState(state: SavedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('Failed to save state:', err)
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY)
}
