import { useState, useEffect, useCallback } from 'react'
import { parseCSV } from '../utils/csvParser'
import { loadState, saveState, clearState } from '../utils/storage'
import { pickWeightedQuestion, updatePriority } from '../utils/priority'

/**
 * useQuiz — central state hook.
 *
 * CSV format:
 *   questions.csv: globalId, examNumber, questionNumber, question, reference
 *   answers.csv:   examNumber, questionNumber, answerNumber, answer, isCorrect
 *
 * Key design decisions:
 * - globalId (1..435) is the stable sequential question number shown to the user
 * - isMulti: true when a question has >1 correct answer — changes UX to multi-select
 * - For multi-select, user must select all correct answers before getting feedback
 * - selectedAnswers is a Set for multi, a single object for single
 */
export function useQuiz() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [shuffledAnswers, setShuffledAnswers] = useState([])

  // For single-answer: selectedAnswer is an object | null
  // For multi-answer: selectedAnswers is a Set of answer objects (grows as user clicks)
  // "submitted" becomes true once user has finalised their multi-select
  const [selectedAnswer, setSelectedAnswer] = useState(null)   // single
  const [selectedAnswers, setSelectedAnswers] = useState(new Set()) // multi
  const [submitted, setSubmitted] = useState(false)

  const [answeredIds, setAnsweredIds] = useState(new Set())
  const [incorrectIds, setIncorrectIds] = useState(new Set())
  // everIncorrectIds: questions you got wrong at least once — never removed even if later corrected.
  // This is separate from incorrectIds (which removes on correct) so users can
  // revisit "lucky guess" questions from a dedicated section.
  const [everIncorrectIds, setEverIncorrectIds] = useState(new Set())
  // questionResults: { [globalId]: 'correct' | 'incorrect' } — latest result only
  const [questionResults, setQuestionResults] = useState({})
  const [history, setHistory] = useState([])
  const [view, setView] = useState('quiz')

  useEffect(() => {
    async function init() {
      try {
        const [qRes, aRes] = await Promise.all([
          fetch(import.meta.env.BASE_URL + 'questions.csv'),
          fetch(import.meta.env.BASE_URL + 'answers.csv'),
        ])
        const [qText, aText] = await Promise.all([qRes.text(), aRes.text()])

        const rawQuestions = parseCSV(qText).filter(q => q.question?.trim())
        const rawAnswers = parseCSV(aText).filter(a => a.answer?.trim())

        // Group answers by "examNumber-questionNumber"
        const answerMap = rawAnswers.reduce((map, row) => {
          const key = `${row.examNumber}-${row.questionNumber}`
          if (!map[key]) map[key] = []
          map[key].push({
            answer: row.answer,
            is_correct: row.isCorrect === 'yes',
          })
          return map
        }, {})

        const built = rawQuestions
          .map(q => {
            const key = `${q.examNumber}-${q.questionNumber}`
            const answers = answerMap[key] ?? []
            if (answers.length === 0) return null
            const correctCount = answers.filter(a => a.is_correct).length
            return {
              id: q.globalId,          // sequential "1", "2", ... "435"
              examKey: key,             // "1-1", "1-2", ... for dedup
              question: q.question,
              reference: q.reference ?? '',
              answers,                  // stored unshuffled; shuffle on display
              isMulti: correctCount > 1, // true = user must pick multiple
              priority: 1,
            }
          })
          .filter(Boolean)

        // Restore saved state
        const saved = loadState()
        if (saved?.priorities) {
          built.forEach(q => {
            if (saved.priorities[q.id] != null) q.priority = saved.priorities[q.id]
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
        setShuffledAnswers(first ? shuffle(first.answers) : [])
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }
    init()
  }, [])

  // Persist whenever relevant state changes
  useEffect(() => {
    if (questions.length === 0) return
    const priorities = questions.reduce((acc, q) => { acc[q.id] = q.priority; return acc }, {})
    saveState({
      priorities,
      answeredIds: [...answeredIds],
      incorrectIds: [...incorrectIds],
      everIncorrectIds: [...everIncorrectIds],
      questionResults,
      history,
    })
  }, [questions, answeredIds, incorrectIds, everIncorrectIds, questionResults, history])

  /**
   * handleAnswer — called when user clicks an answer button.
   *
   * Single-answer: resolves immediately on click.
   * Multi-answer: toggles selection; user then clicks "Submit" to confirm.
   */
  const handleAnswer = useCallback((answer) => {
    if (!currentQuestion) return
    const isAnswered = currentQuestion.isMulti ? submitted : selectedAnswer !== null
    if (isAnswered) return

    if (!currentQuestion.isMulti) {
      // Single answer — resolve immediately
      setSelectedAnswer(answer)
      _resolveAnswer(currentQuestion, [answer])
    } else {
      // Multi answer — toggle selection
      setSelectedAnswers(prev => {
        const next = new Set(prev)
        if (next.has(answer)) next.delete(answer)
        else next.add(answer)
        return next
      })
    }
  }, [currentQuestion, submitted, selectedAnswer])

  /**
   * handleSubmit — only for multi-answer questions.
   * Called when user clicks "Submit Answers".
   */
  const handleSubmit = useCallback(() => {
    if (!currentQuestion?.isMulti || submitted) return
    setSubmitted(true)
    _resolveAnswer(currentQuestion, [...selectedAnswers])
  }, [currentQuestion, submitted, selectedAnswers])

  /** Shared logic: record result, update priority */
  function _resolveAnswer(question, chosen) {
    const correctSet = new Set(question.answers.filter(a => a.is_correct).map(a => a.answer))
    const chosenSet = new Set(chosen.map(a => a.answer))
    const wasCorrect = (
      chosenSet.size === correctSet.size &&
      [...correctSet].every(a => chosenSet.has(a))
    )

    setQuestions(prev =>
      prev.map(q =>
        q.id === question.id
          ? { ...q, priority: updatePriority(q.priority, wasCorrect) }
          : q
      )
    )
    setAnsweredIds(prev => new Set([...prev, question.id]))
    if (!wasCorrect) {
      // Add to both current-incorrect and ever-incorrect lists
      setIncorrectIds(prev => new Set([...prev, question.id]))
      setEverIncorrectIds(prev => new Set([...prev, question.id]))
    } else {
      // Remove from current-incorrect (so Review page clears it) but NOT from everIncorrectIds
      setIncorrectIds(prev => { const next = new Set(prev); next.delete(question.id); return next })
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
      const next = pickWeightedQuestion(prev, currentQuestion?.id)
      setCurrentQuestion(next)
      setShuffledAnswers(next ? shuffle(next.answers) : [])
      return prev
    })
  }, [currentQuestion])

  /**
   * handleJumpTo — jump directly to a specific question by globalId.
   * Used when clicking a question box in the Stats grid.
   */
  const handleJumpTo = useCallback((questionId) => {
    setSelectedAnswer(null)
    setSelectedAnswers(new Set())
    setSubmitted(false)
    setQuestions(prev => {
      const target = prev.find(q => q.id === questionId)
      if (target) {
        setCurrentQuestion(target)
        setShuffledAnswers(shuffle(target.answers))
      }
      return prev
    })
    setView('quiz')
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
      const reset = prev.map(q => ({ ...q, priority: 1 }))
      const next = pickWeightedQuestion(reset, null)
      setCurrentQuestion(next)
      setShuffledAnswers(next ? shuffle(next.answers) : [])
      return reset
    })
  }, [])

  const incorrectQuestions = questions.filter(q => incorrectIds.has(q.id))
  // everIncorrectQuestions: all questions you've ever got wrong — including ones you later corrected.
  // Lets users re-test "lucky guesses".
  const everIncorrectQuestions = questions.filter(q => everIncorrectIds.has(q.id))

  // Is the current question "done" (showing feedback)?
  const isAnswered = currentQuestion
    ? (currentQuestion.isMulti ? submitted : selectedAnswer !== null)
    : false

  // Was the last answer correct?
  const wasLastCorrect = currentQuestion
    ? (currentQuestion.isMulti
        ? (() => {
            const correctSet = new Set(currentQuestion.answers.filter(a => a.is_correct).map(a => a.answer))
            const chosenSet = new Set([...selectedAnswers].map(a => a.answer))
            return chosenSet.size === correctSet.size && [...correctSet].every(a => chosenSet.has(a))
          })()
        : selectedAnswer?.is_correct ?? false)
    : false

  return {
    loading, error,
    currentQuestion, shuffledAnswers,
    selectedAnswer, selectedAnswers, submitted,
    isAnswered, wasLastCorrect,
    questions, answeredIds, incorrectIds, everIncorrectIds, questionResults,
    incorrectQuestions, everIncorrectQuestions, history,
    view, setView,
    handleAnswer, handleSubmit, handleNext, handleJumpTo, handleReset,
  }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
