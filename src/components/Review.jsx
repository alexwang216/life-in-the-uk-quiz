import { useState } from 'react'
import PropTypes from 'prop-types'

export default function Review({ incorrectQuestions, everIncorrectQuestions, questionResults, onJumpTo }) {
  const [tab, setTab] = useState('current')

  const list = tab === 'current' ? incorrectQuestions : everIncorrectQuestions

  const emptyMsg = tab === 'current'
    ? { icon: '🎉', title: 'No current mistakes!', sub: 'Questions you get wrong will appear here. Clear them by answering correctly.' }
    : { icon: '📭', title: 'No history yet', sub: "Questions you've ever answered incorrectly will appear here — even if you later got them right." }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-1">Review</h2>
      <p className="text-slate-400 text-sm mb-5">
        {list.length} question{list.length !== 1 ? 's' : ''}
      </p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('current')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
            tab === 'current'
              ? 'bg-red-700 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Still Incorrect
          <span className="ml-2 text-xs opacity-70">({incorrectQuestions.length})</span>
        </button>
        <button
          onClick={() => setTab('ever')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
            tab === 'ever'
              ? 'bg-amber-700 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Ever Missed
          <span className="ml-2 text-xs opacity-70">({everIncorrectQuestions.length})</span>
        </button>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">{emptyMsg.icon}</div>
          <h3 className="text-xl font-bold text-white mb-2">{emptyMsg.title}</h3>
          <p className="text-slate-400 text-sm">{emptyMsg.sub}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {list.map(q => {
            const correctAnswers = q.answers.filter(a => a.is_correct)
            const latestResult = questionResults[q.id]
            const laterCorrected = tab === 'ever' && latestResult === 'correct'

            return (
              <div
                key={q.id}
                className={`bg-slate-800 border rounded-xl p-5 ${
                  laterCorrected ? 'border-emerald-700' : 'border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                      Q#{q.id}
                    </span>
                    {laterCorrected && (
                      <span className="text-xs bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded-full">
                        ✓ Later corrected
                      </span>
                    )}
                    {q.isMulti && (
                      <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">
                        Multi-answer
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onJumpTo(q.id)}
                    className="text-xs bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-1 rounded-lg transition-colors font-medium"
                  >
                    Jump →
                  </button>
                </div>

                <p className="text-white font-medium mb-3 leading-relaxed">{q.question}</p>

                <div className="flex flex-col gap-1 mb-2">
                  {correctAnswers.map((a, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                      <p className="text-emerald-300 text-sm">{a.answer}</p>
                    </div>
                  ))}
                </div>

                {q.reference && (
                  <p className="text-slate-500 text-xs mt-2 leading-relaxed border-t border-slate-700 pt-2">
                    {q.reference}
                  </p>
                )}

                <div className="mt-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      q.priority <= 1 ? 'bg-emerald-900 text-emerald-300'
                      : q.priority <= 3 ? 'bg-amber-900 text-amber-300'
                      : 'bg-red-900 text-red-300'
                    }`}
                  >
                    {q.priority <= 1 ? '🟢 Easy' : q.priority <= 3 ? '🟡 Review' : '🔴 Hard'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

Review.propTypes = {
  incorrectQuestions: PropTypes.array.isRequired,
  everIncorrectQuestions: PropTypes.array.isRequired,
  questionResults: PropTypes.object.isRequired,
  onJumpTo: PropTypes.func.isRequired,
}
