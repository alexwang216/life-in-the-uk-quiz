export interface Answer {
  answer: string
  is_correct: boolean
}

export interface Question {
  id: string
  examKey: string
  question: string
  reference: string
  answers: Answer[]
  isMulti: boolean
  priority: number
}

export interface HistoryEntry {
  questionId: string
  wasCorrect: boolean
}

export type QuestionResult = 'correct' | 'incorrect'
export type View = 'quiz' | 'stats' | 'review'
