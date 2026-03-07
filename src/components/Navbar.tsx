import type { View } from '../types'

interface Props {
  view: View
  setView: (v: View) => void
  incorrectCount: number
}

const TABS: { id: View; label: string }[] = [
  { id: 'quiz', label: '🧠 Quiz' },
  { id: 'stats', label: '📊 Stats' },
  { id: 'review', label: '📝 Review' },
]

export default function Navbar({ view, setView, incorrectCount }: Props) {
  return (
    <nav className="w-full bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
        <span className="text-white font-bold text-lg tracking-tight">QuizApp</span>
        <div className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                view === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
              {tab.id === 'review' && incorrectCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {incorrectCount > 9 ? '9+' : incorrectCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
