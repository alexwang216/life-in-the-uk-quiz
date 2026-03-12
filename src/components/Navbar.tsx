import { NavLink } from 'react-router-dom'

interface Props {
  incorrectCount: number
}

const TABS = [
  { path: '/',       label: '🧠 Quiz'   },
  { path: '/stats',  label: '📊 Stats'  },
  { path: '/review', label: '📝 Review' },
]

export default function Navbar({ incorrectCount }: Props) {
  return (
    <nav className="w-full bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg tracking-tight">QuizApp</span>
        </div>
        <div className="flex gap-1">
          {TABS.map(tab => (
            <NavLink
              key={tab.path}
              to={tab.path}
              // NavLink passes `isActive` so we don't need to compare manually.
              // `end` on '/' prevents it matching all routes (since every path starts with /).
              end={tab.path === '/'}
              className={({ isActive }) =>
                `relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              {tab.label}
              {tab.path === '/review' && incorrectCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {incorrectCount > 9 ? '9+' : incorrectCount}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
