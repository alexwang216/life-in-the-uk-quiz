import { useQuiz } from './hooks/useQuiz'
import Navbar from './components/Navbar'
import QuizCard from './components/QuizCard'
import Stats from './components/Stats'
import Review from './components/Review'

export default function App() {
  const {
    loading, error,
    currentQuestion, shuffledAnswers,
    selectedAnswer, selectedAnswers, submitted,
    isAnswered, wasLastCorrect,
    questions, answeredIds, incorrectIds, questionResults,
    incorrectQuestions, everIncorrectQuestions, history,
    view, setView,
    handleAnswer, handleSubmit, handleNext, handleJumpTo, handleReset,
  } = useQuiz()

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
      <Navbar view={view} setView={setView} incorrectCount={incorrectIds.size} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {view === 'quiz' && currentQuestion && (
          <QuizCard
            question={currentQuestion}
            shuffledAnswers={shuffledAnswers}
            selectedAnswer={selectedAnswer}
            selectedAnswers={selectedAnswers}
            submitted={submitted}
            isAnswered={isAnswered}
            wasLastCorrect={wasLastCorrect}
            onAnswer={handleAnswer}
            onSubmit={handleSubmit}
            onNext={handleNext}
            priority={currentQuestion.priority}
          />
        )}

        {view === 'stats' && (
          <Stats
            questions={questions}
            answeredIds={answeredIds}
            incorrectIds={incorrectIds}
            questionResults={questionResults}
            history={history}
            onReset={() => { handleReset(); setView('quiz') }}
            onJumpTo={handleJumpTo}
          />
        )}

        {view === 'review' && (
          <Review
            incorrectQuestions={incorrectQuestions}
            everIncorrectQuestions={everIncorrectQuestions}
            questionResults={questionResults}
            onJumpTo={handleJumpTo}
          />
        )}
      </main>
    </div>
  )
}
