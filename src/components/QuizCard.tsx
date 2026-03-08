import { THRESHOLD_IN_PROGRESS, THRESHOLD_EASY, THRESHOLD_HARD } from '../utils/priority'
import type { Question, Answer } from '../types'

interface Props {
  question: Question
  shuffledAnswers: Answer[]
  selectedAnswer: Answer | null
  selectedAnswers: Set<Answer>
  submitted: boolean
  isAnswered: boolean
  wasLastCorrect: boolean
  onAnswer: (answer: Answer) => void
  onSubmit: () => void
  onNext: () => void
  priority: number
}

function buildClaudeUrl(question: string, correctAnswers: string[]): string {
  const answers = correctAnswers.join(', ')
  const prompt = `I'm studying for the Life in the UK test. The question is: "${question}". The correct answer is: "${answers}". Can you explain this in more detail to help me understand and remember it?`
  return `https://claude.ai/new?q=${encodeURIComponent(prompt)}`
}

export default function QuizCard({
  question, shuffledAnswers, selectedAnswer, selectedAnswers,
  submitted, isAnswered, wasLastCorrect, onAnswer, onSubmit, onNext, priority,
}: Props) {
  const isMulti = question.isMulti
  const correctAnswers = shuffledAnswers.filter(a => a.is_correct)
  const expectedCount = correctAnswers.length
  const selectedCount = selectedAnswers.size
  const canSubmit = isMulti && !submitted && selectedCount > 0

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header: Q number + type badge + priority */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 uppercase tracking-widest">Q#{question.id}</span>
          {isMulti && (
            <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full font-medium">
              Select {expectedCount}
            </span>
          )}
        </div>
        <div className="relative group">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-default select-none ${
              !question.attempted              ? 'bg-slate-700 text-slate-300'
              : priority <= THRESHOLD_EASY    ? 'bg-emerald-900 text-emerald-300'
              : priority <= THRESHOLD_IN_PROGRESS ? 'bg-blue-900 text-blue-300'
              : priority < THRESHOLD_HARD     ? 'bg-amber-900 text-amber-300'
              : 'bg-red-900 text-red-300'
            }`}
          >
            {!question.attempted                  ? '○ New'
              : priority <= THRESHOLD_EASY        ? '🟢 Easy'
              : priority <= THRESHOLD_IN_PROGRESS ? '🔵 In Progress'
              : priority < THRESHOLD_HARD         ? '🟡 Review'
              : '🔴 Hard'}
          </span>
          <div className="absolute right-0 top-7 z-20 hidden group-hover:block min-w-max bg-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
            <p className="font-semibold mb-0.5">Priority: {priority}</p>
            <p className="text-slate-400">
              {!question.attempted                  ? 'Not attempted yet'
                : priority <= THRESHOLD_EASY        ? 'You know this well — appears less often'
                : priority <= THRESHOLD_IN_PROGRESS ? 'Getting there — keep answering correctly'
                : priority < THRESHOLD_HARD         ? 'You have missed this — appears more often'
                : 'You keep missing this — appears frequently'}
            </p>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-slate-800 rounded-2xl p-6 mb-6 shadow-lg border border-slate-700">
        <p className="cap-first text-white text-lg font-medium leading-relaxed">{question.question}</p>
      </div>

      {/* Answer choices */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        {shuffledAnswers.map((ans, i) => {
          let style = 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:border-indigo-500'

          if (isMulti) {
            const isSelected = selectedAnswers.has(ans)
            if (submitted) {
              if (ans.is_correct) style = 'bg-emerald-900 border-emerald-500 text-emerald-200'
              else if (isSelected) style = 'bg-red-900 border-red-500 text-red-200'
              else style = 'bg-slate-800 border-slate-700 text-slate-500 opacity-50'
            } else {
              if (isSelected) style = 'bg-indigo-900 border-indigo-500 text-indigo-200'
            }
          } else {
            if (isAnswered) {
              if (ans.is_correct) style = 'bg-emerald-900 border-emerald-500 text-emerald-200'
              else if (ans === selectedAnswer) style = 'bg-red-900 border-red-500 text-red-200'
              else style = 'bg-slate-800 border-slate-700 text-slate-500 opacity-50'
            }
          }

          const disabled = isMulti ? submitted : isAnswered

          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onAnswer(ans)}
              className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 font-medium cursor-pointer disabled:cursor-default ${style}`}
            >
              <span className="text-slate-400 mr-3 text-sm">{String.fromCharCode(65 + i)}.</span>
              <span className="cap-first">{ans.answer}</span>
              {isMulti && !submitted && (
                <span className={`cap-first float-right text-lg ${selectedAnswers.has(ans) ? 'text-indigo-400' : 'text-slate-600'}`}>
                  {selectedAnswers.has(ans) ? '☑' : '☐'}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Multi-select: progress hint + submit */}
      {isMulti && !submitted && (
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-slate-400">
            {selectedCount} of {expectedCount} selected
          </span>
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-xl transition-colors text-sm"
          >
            Submit Answers
          </button>
        </div>
      )}

      {/* Post-answer panel */}
      {isAnswered && (
        <div className="flex flex-col gap-4">
          <p className={`text-center text-lg font-semibold ${wasLastCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
            {wasLastCorrect ? '✓ Correct!' : '✗ Incorrect'}
          </p>

          {/* 1. Next Question — primary action, shown first */}
          <button
            onClick={onNext}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Next Question →
          </button>

          {/* 2. Reference */}
          {question.reference && (
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">📖 Reference</p>
              <p className="cap-first text-slate-300 text-sm leading-relaxed">{question.reference}</p>
            </div>
          )}

          {/* 3. Ask Claude — secondary action.
              WHY no target="_blank" on mobile?
              iOS universal links only trigger when the link is tapped in the
              same browsing context. Opening in a new tab bypasses the universal
              link handler, so the app never opens. On desktop we still want a
              new tab so the user doesn't lose their quiz progress.
              We detect mobile via the pointer: coarse media query — touch
              devices have coarse pointers, mice have fine ones. */}
          <div className="flex flex-col gap-1">
            <a
              href={buildClaudeUrl(question.question, correctAnswers.map(a => a.answer))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-indigo-700 text-indigo-300 hover:bg-indigo-900 transition-colors text-sm font-medium"
            >
              <span>✦</span>
              Ask Claude AI for more details
              <span className="text-xs opacity-60">↗</span>
            </a>
            <p className="text-xs text-slate-500 text-center">
              On mobile, long-press → "Open in Claude" if you have the app installed
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
