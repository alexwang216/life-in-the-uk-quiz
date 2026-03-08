import { useState, useEffect, useCallback } from 'react'
import { parseCSV } from '../utils/csvParser'
import { loadState, saveState, clearState } from '../utils/storage'
import { pickWeightedQuestion, updatePriority, PRIORITY_INITIAL } from '../utils/priority'
import type { Question, Answer, HistoryEntry, QuestionResult } from '../types'

export function useQuiz() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [shuffledAnswers, setShuffledAnswers] = useState<Answer[]>([])

  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Set<Answer>>(new Set())
  const [submitted, setSubmitted] = useState(false)

  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set())
  const [incorrectIds, setIncorrectIds] = useState<Set<string>>(new Set())
  // everIncorrectIds: questions you've ever got wrong — never removed even if later corrected.
  // Lets users re-test "lucky guesses" from the Ever Missed tab.
  const [everIncorrectIds, setEverIncorrectIds] = useState<Set<string>>(new Set())
  const [questionResults, setQuestionResults] = useState<Record<string, QuestionResult>>({})
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    async function init() {
      try {
        const base = import.meta.env.BASE_URL
        const [qRes, aRes] = await Promise.all([
          fetch(base + 'questions.csv'),
          fetch(base + 'answers.csv'),
        ])
        const [qText, aText] = await Promise.all([qRes.text(), aRes.text()])

        const rawQuestions = parseCSV(qText).filter(q => q['question']?.trim())
        const rawAnswers = parseCSV(aText).filter(a => a['answer']?.trim())

        const answerMap = rawAnswers.reduce<Record<string, Answer[]>>((map, row) => {
          const key = `${row['examNumber']}-${row['questionNumber']}`
          if (!map[key]) map[key] = []
          map[key].push({
            answer: row['answer'],
            is_correct: row['isCorrect'] === 'yes',
          })
          return map
        }, {})

        const built: Question[] = rawQuestions
          .map(q => {
            const key = `${q['examNumber']}-${q['questionNumber']}`
            const answers = answerMap[key] ?? []
            if (answers.length === 0) return null
            const correctCount = answers.filter(a => a.is_correct).length

            // WHY isFixedOrder (not just isTrueFalse)?
            // Yes/No questions have the same UX issue as True/False — shuffling
            // swaps familiar positions and is confusing. Both types get fixed order.
            const fixedOrderValues = ['true', 'false', 'yes', 'no']
            const isFixedOrder = answers.length === 2 &&
              answers.every(a => fixedOrderValues.includes(a.answer.toLowerCase()))

            return {
              id: q['globalId'],
              examKey: key,
              question: q['question'],
              reference: q['reference'] ?? '',
              answers,
              isMulti: correctCount > 1,
              isFixedOrder,
              priority: PRIORITY_INITIAL,
              attempted: false,  // explicit flag — never derived from priority
            }
          })
          .filter((q): q is Question => q !== null)

        const saved = loadState()
        if (saved?.priorities) {
          built.forEach(q => {
            if (saved.priorities[q.id] != null) q.priority = saved.priorities[q.id]
            if (saved.attemptedIds?.includes(q.id)) q.attempted = true
          })
          setAnsweredIds(new Set(saved.answeredIds ?? []))
          setIncorrectIds(new Set(saved.incorrectIds ?? []))
          setEverIncorrectIds(new Set(saved.everIncorrectIds ?? []))
          setQuestionResults(saved.questionResults ?? {})
          setHistory(saved.history ?? [])
        }

        setQuestions(built)
        const first = pickWeightedQuestion(built, null)
        setCurrentQuestion(first)
        setShuffledAnswers(first ? (first.isFixedOrder ? first.answers : shuffle(first.answers)) : [])
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (questions.length === 0) return
    const priorities = questions.reduce<Record<string, number>>((acc, q) => {
      acc[q.id] = q.priority
      return acc
    }, {})
    const attemptedIds = questions.filter(q => q.attempted).map(q => q.id)
    saveState({
      priorities,
      attemptedIds,
      answeredIds: [...answeredIds],
      incorrectIds: [...incorrectIds],
      everIncorrectIds: [...everIncorrectIds],
      questionResults,
      history,
    })
  }, [questions, answeredIds, incorrectIds, everIncorrectIds, questionResults, history])

  const handleAnswer = useCallback((answer: Answer) => {
    if (!currentQuestion) return
    const isAnswered = currentQuestion.isMulti ? submitted : selectedAnswer !== null
    if (isAnswered) return

    if (!currentQuestion.isMulti) {
      setSelectedAnswer(answer)
      _resolveAnswer(currentQuestion, [answer])
    } else {
      setSelectedAnswers(prev => {
        const next = new Set(prev)
        if (next.has(answer)) next.delete(answer)
        else next.add(answer)
        return next
      })
    }
  }, [currentQuestion, submitted, selectedAnswer])

  const handleSubmit = useCallback(() => {
    if (!currentQuestion?.isMulti || submitted) return
    setSubmitted(true)
    _resolveAnswer(currentQuestion, [...selectedAnswers])
  }, [currentQuestion, submitted, selectedAnswers])

  function _resolveAnswer(question: Question, chosen: Answer[]) {
    const correctSet = new Set(question.answers.filter(a => a.is_correct).map(a => a.answer))
    const chosenSet = new Set(chosen.map(a => a.answer))
    const wasCorrect =
      chosenSet.size === correctSet.size && [...correctSet].every(a => chosenSet.has(a))

    setQuestions(prev =>
      prev.map(q =>
        q.id === question.id
          ? { ...q, priority: updatePriority(q.priority, wasCorrect), attempted: true }
          : q
      )
    )
    setAnsweredIds(prev => new Set([...prev, question.id]))

    if (!wasCorrect) {
      setIncorrectIds(prev => new Set([...prev, question.id]))
      setEverIncorrectIds(prev => new Set([...prev, question.id]))
    } else {
      setIncorrectIds(prev => {
        const next = new Set(prev)
        next.delete(question.id)
        return next
      })
    }

    setQuestionResults(prev => ({
      ...prev,
      [question.id]: wasCorrect ? 'correct' : 'incorrect',
    }))
    setHistory(prev => [...prev, { questionId: question.id, wasCorrect }])
  }

  const handleNext = useCallback(() => {
    setSelectedAnswer(null)
    setSelectedAnswers(new Set())
    setSubmitted(false)
    setQuestions(prev => {
      const next = pickWeightedQuestion(prev, currentQuestion?.id ?? null)
      setCurrentQuestion(next)
      setShuffledAnswers(next ? (next.isFixedOrder ? next.answers : shuffle(next.answers)) : [])
      return prev
    })
  }, [currentQuestion])

  // handleJumpTo sets the target question; the caller navigates to '/' via the router.
  const handleJumpTo = useCallback((questionId: string) => {
    setSelectedAnswer(null)
    setSelectedAnswers(new Set())
    setSubmitted(false)
    setQuestions(prev => {
      const target = prev.find(q => q.id === questionId)
      if (target) {
        setCurrentQuestion(target)
        setShuffledAnswers(target.isFixedOrder ? target.answers : shuffle(target.answers))
      }
      return prev
    })
  }, [])

  const handleReset = useCallback(() => {
    clearState()
    setAnsweredIds(new Set())
    setIncorrectIds(new Set())
    setEverIncorrectIds(new Set())
    setQuestionResults({})
    setHistory([])
    setSelectedAnswer(null)
    setSelectedAnswers(new Set())
    setSubmitted(false)
    setQuestions(prev => {
      const reset = prev.map(q => ({ ...q, priority: PRIORITY_INITIAL, attempted: false }))
      const next = pickWeightedQuestion(reset, null)
      setCurrentQuestion(next)
      setShuffledAnswers(next ? (next.isFixedOrder ? next.answers : shuffle(next.answers)) : [])
      return reset
    })
  }, [])

  const incorrectQuestions = questions.filter(q => incorrectIds.has(q.id))
  const everIncorrectQuestions = questions.filter(q => everIncorrectIds.has(q.id))

  const isAnswered = currentQuestion
    ? currentQuestion.isMulti ? submitted : selectedAnswer !== null
    : false

  const wasLastCorrect = currentQuestion
    ? currentQuestion.isMulti
      ? (() => {
          const correctSet = new Set(
            currentQuestion.answers.filter(a => a.is_correct).map(a => a.answer)
          )
          const chosenSet = new Set([...selectedAnswers].map(a => a.answer))
          return chosenSet.size === correctSet.size && [...correctSet].every(a => chosenSet.has(a))
        })()
      : selectedAnswer?.is_correct ?? false
    : false

  return {
    loading, error,
    currentQuestion, shuffledAnswers,
    selectedAnswer, selectedAnswers, submitted,
    isAnswered, wasLastCorrect,
    questions, answeredIds, incorrectIds, everIncorrectIds, questionResults,
    incorrectQuestions, everIncorrectQuestions, history,
    handleAnswer, handleSubmit, handleNext, handleJumpTo, handleReset,
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
