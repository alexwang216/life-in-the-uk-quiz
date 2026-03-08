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
  isFixedOrder: boolean  // true for True/False and Yes/No — never shuffle these
  priority: number
  attempted: boolean     // explicit flag, never conflated with priority value
}

export interface HistoryEntry {
  questionId: string
  wasCorrect: boolean
}

export type QuestionResult = 'correct' | 'incorrect'
