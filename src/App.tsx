import { Routes, Route, useNavigate } from 'react-router-dom'
import { useQuiz } from './hooks/useQuiz'
import Navbar from './components/Navbar'
import QuizCard from './components/QuizCard'
import Stats from './components/Stats'
import Review from './components/Review'

export default function App() {
  const navigate = useNavigate()

  const {
    loading, error,
    currentQuestion, shuffledAnswers,
    selectedAnswer, selectedAnswers, submitted,
    isAnswered, wasLastCorrect,
    questions, answeredIds, incorrectIds, markedForReviewIds, questionResults,
    incorrectQuestions, everIncorrectQuestions, markedQuestions, history,
    handleAnswer, handleSubmit, handleNext, handleJumpTo, handleReset, handleToggleReview,
  } = useQuiz()

  // handleJumpTo sets the question in state; we then navigate to the quiz route.
  // WHY keep navigation here and not in the hook?
  // Hooks shouldn't know about routing — that's a UI concern. The hook just
  // manages data; App decides where to send the user afterwards.
  function jumpTo(id: string) {
    handleJumpTo(id)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading questions…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-red-400 text-center">
          <p className="text-xl font-bold mb-2">Failed to load quiz data</p>
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar incorrectCount={incorrectIds.size} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Routes>
          <Route
            path="/"
            element={
              currentQuestion ? (
                <QuizCard
                  question={currentQuestion}
                  shuffledAnswers={shuffledAnswers}
                  selectedAnswer={selectedAnswer}
                  selectedAnswers={selectedAnswers}
                  submitted={submitted}
                  isAnswered={isAnswered}
                  wasLastCorrect={wasLastCorrect}
                  isMarked={markedForReviewIds.has(currentQuestion.id)}
                  onAnswer={handleAnswer}
                  onSubmit={handleSubmit}
                  onNext={handleNext}
                  onReview={() => navigate('/review')}
                  onToggleReview={() => handleToggleReview(currentQuestion.id)}
                  priority={currentQuestion.priority}
                />
              ) : null
            }
          />
          <Route
            path="/stats"
            element={
              <Stats
                questions={questions}
                answeredIds={answeredIds}
                incorrectIds={incorrectIds}
                questionResults={questionResults}
                history={history}
                onReset={() => { handleReset(); navigate('/') }}
                onJumpTo={jumpTo}
              />
            }
          />
          <Route
            path="/review"
            element={
              <Review
                incorrectQuestions={incorrectQuestions}
                everIncorrectQuestions={everIncorrectQuestions}
                markedQuestions={markedQuestions}
                questionResults={questionResults}
                onJumpTo={jumpTo}
                onUnmark={(id) => handleToggleReview(id)}
              />
            }
          />
        </Routes>
      </main>
    </div>
  )
}
