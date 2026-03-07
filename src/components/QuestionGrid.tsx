import type { Question, QuestionResult } from '../types'

interface Props {
  questions: Question[]
  questionResults: Record<string, QuestionResult>
  onJumpTo: (id: string) => void
}

export default function QuestionGrid({ questions, questionResults, onJumpTo }: Props) {
  const total = questions.length
  const correct = Object.values(questionResults).filter(r => r === 'correct').length
  const incorrect = Object.values(questionResults).filter(r => r === 'incorrect').length
  const unseen = total - correct - incorrect

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-1">Question Map</h2>
      <p className="text-slate-400 text-sm mb-5">Click any box to jump to that question.</p>

      <div className="flex items-center gap-4 mb-5 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-slate-700 inline-block border border-slate-600" />
          Unseen ({unseen})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-700 inline-block border border-emerald-600" />
          Correct ({correct})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-700 inline-block border border-amber-600" />
          Incorrect ({incorrect})
        </span>
      </div>

      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))' }}>
        {questions.map(q => {
          const result = questionResults[q.id]
          let bg = 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
          if (result === 'correct') bg = 'bg-emerald-800 border-emerald-600 text-emerald-200 hover:bg-emerald-700'
          if (result === 'incorrect') bg = 'bg-amber-800 border-amber-600 text-amber-200 hover:bg-amber-700'

          return (
            <button
              key={q.id}
              onClick={() => onJumpTo(q.id)}
              title={`Q${q.id}: ${q.question.slice(0, 60)}...`}
              className={`border rounded-md text-xs font-mono font-bold h-9 flex items-center justify-center transition-colors ${bg}`}
            >
              {q.id}
            </button>
          )
        })}
      </div>
    </div>
  )
}
