import type { Question, HistoryEntry, QuestionResult } from '../types'
import QuestionGrid from './QuestionGrid'

interface Props {
  questions: Question[]
  answeredIds: Set<string>
  incorrectIds: Set<string>
  questionResults: Record<string, QuestionResult>
  history: HistoryEntry[]
  onReset: () => void
  onJumpTo: (id: string) => void
}

interface StatCardProps {
  label: string
  value: string | number
  color: 'indigo' | 'emerald' | 'amber' | 'red' | 'slate'
}

export default function Stats({ questions, answeredIds, incorrectIds, questionResults, history, onReset, onJumpTo }: Props) {
  const totalQuestions = questions.length
  const uniqueAnswered = answeredIds.size
  const uniqueIncorrect = incorrectIds.size
  const totalAttempts = history.length
  const correctAttempts = history.filter(h => h.wasCorrect).length
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Your Stats</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard label="Questions Seen" value={`${uniqueAnswered} / ${totalQuestions}`} color="indigo" />
          <StatCard label="Accuracy" value={`${accuracy}%`} color={accuracy >= 70 ? 'emerald' : 'amber'} />
          <StatCard label="Total Attempts" value={totalAttempts} color="slate" />
          <StatCard label="Ever Incorrect" value={uniqueIncorrect} color="red" />
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Progress</span>
            <span>{Math.round((uniqueAnswered / totalQuestions) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className="bg-indigo-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(uniqueAnswered / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <QuestionGrid questions={questions} questionResults={questionResults} onJumpTo={onJumpTo} />

      <button
        onClick={() => {
          if (window.confirm('Reset all progress? This cannot be undone.')) onReset()
        }}
        className="w-full py-3 rounded-xl border-2 border-red-700 text-red-400 hover:bg-red-900 transition-colors font-medium"
      >
        Reset All Progress
      </button>
    </div>
  )
}

function StatCard({ label, value, color }: StatCardProps) {
  const colors: Record<StatCardProps['color'], string> = {
    indigo: 'bg-indigo-900 border-indigo-700 text-indigo-300',
    emerald: 'bg-emerald-900 border-emerald-700 text-emerald-300',
    amber: 'bg-amber-900 border-amber-700 text-amber-300',
    red: 'bg-red-900 border-red-700 text-red-300',
    slate: 'bg-slate-800 border-slate-600 text-slate-300',
  }
  return (
    <div className={`rounded-xl border-2 p-4 ${colors[color]}`}>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-xs opacity-70 uppercase tracking-wide">{label}</div>
    </div>
  )
}
