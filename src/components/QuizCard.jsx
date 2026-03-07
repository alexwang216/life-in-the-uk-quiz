import PropTypes from 'prop-types'

function buildClaudeUrl(question, correctAnswers) {
  const answers = correctAnswers.join(', ')
  const prompt = `I'm studying for the Life in the UK test. The question is: "${question}". The correct answer is: "${answers}". Can you explain this in more detail to help me understand and remember it?`
  return `https://claude.ai/new?q=${encodeURIComponent(prompt)}`
}

export default function QuizCard({
  question,
  shuffledAnswers,
  selectedAnswer,
  selectedAnswers,
  submitted,
  isAnswered,
  wasLastCorrect,
  onAnswer,
  onSubmit,
  onNext,
  priority,
}) {
  const isMulti = question.isMulti
  const correctAnswers = shuffledAnswers.filter(a => a.is_correct)

  // For multi: has the user selected the right number yet?
  const expectedCount = correctAnswers.length
  const selectedCount = selectedAnswers.size
  const canSubmit = isMulti && !submitted && selectedCount > 0

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header row: Q number + type badge + priority */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 uppercase tracking-widest">Q#{question.id}</span>
          {isMulti && (
            <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full font-medium">
              Select {expectedCount}
            </span>
          )}
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            priority <= 1 ? 'bg-emerald-900 text-emerald-300'
            : priority <= 3 ? 'bg-amber-900 text-amber-300'
            : 'bg-red-900 text-red-300'
          }`}
          title={
            priority <= 1 ? 'You know this well — appears less often'
            : priority <= 3 ? 'You have missed this — appears more often'
            : 'You keep missing this — appears frequently'
          }
        >
          {priority <= 1 ? '🟢 Easy' : priority <= 3 ? '🟡 Review' : '🔴 Hard'}
        </span>
      </div>

      {/* Question */}
      <div className="bg-slate-800 rounded-2xl p-6 mb-6 shadow-lg border border-slate-700">
        <p className="text-white text-lg font-medium leading-relaxed">{question.question}</p>
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
              {ans.answer}
              {/* Checkbox indicator for multi-select */}
              {isMulti && !submitted && (
                <span className={`float-right text-lg ${selectedAnswers.has(ans) ? 'text-indigo-400' : 'text-slate-600'}`}>
                  {selectedAnswers.has(ans) ? '☑' : '☐'}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Multi-select: progress hint + submit button */}
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

          <button
            onClick={onNext}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Next Question →
          </button>

          {/* Reference */}
          {question.reference && (
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">📖 Reference</p>
              <p className="text-slate-300 text-sm leading-relaxed">{question.reference}</p>
            </div>
          )}

          {/* Ask Claude link */}
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
        </div>
      )}
    </div>
  )
}

QuizCard.propTypes = {
  question: PropTypes.object.isRequired,
  shuffledAnswers: PropTypes.array.isRequired,
  selectedAnswer: PropTypes.object,
  selectedAnswers: PropTypes.instanceOf(Set).isRequired,
  submitted: PropTypes.bool.isRequired,
  isAnswered: PropTypes.bool.isRequired,
  wasLastCorrect: PropTypes.bool.isRequired,
  onAnswer: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  priority: PropTypes.number.isRequired,
}
