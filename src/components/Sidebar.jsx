import { LayoutGrid, CheckSquare, Users, Settings, Tag } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

const NAV = [
  { icon: LayoutGrid,  label: 'Board',    id: 'board' },
  { icon: CheckSquare, label: 'My Tasks', id: 'tasks' },
  { icon: Users,       label: 'Team',     id: 'team' },
  { icon: Tag,         label: 'Labels',   id: 'labels' },
]

export default function Sidebar({ stats, activePanel, onPanelChange }) {
  const { user }    = useAuth()
  const { members } = useData()
  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  const me = members[0]

  const handleNavClick = (id) => {
    if (id === 'board' || id === 'tasks') return
    onPanelChange(activePanel === id ? null : id)
  }

  return (
    <aside className="flex flex-col w-16 h-full bg-[#0F1221] border-r border-[rgba(255,255,255,0.06)] overflow-visible flex-shrink-0 sidebar-scroll">
      {/* Logo mark */}
      <div className="flex items-center justify-center h-12 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center shadow-[0_0_16px_rgba(245,158,11,0.35)]">
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1" width="4" height="4" rx="1" fill="#090B12" fillOpacity="0.9"/>
            <rect x="7" y="1" width="4" height="4" rx="1" fill="#090B12" fillOpacity="0.9"/>
            <rect x="7" y="7" width="4" height="4" rx="1" fill="#090B12" fillOpacity="0.9"/>
            <rect x="1" y="7" width="4" height="4" rx="1" fill="#090B12" fillOpacity="0.9"/>
          </svg>
        </div>
      </div>

      {/* Nav icons */}
      <nav className="flex flex-col items-center pt-2 gap-0.5">
        {NAV.map(({ icon: Icon, label, id }) => {
          const isActive = id === 'board' ? activePanel === null : activePanel === id
          return (
            <Tip key={id} label={label}>
              <button
                onClick={() => handleNavClick(id)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'text-text-muted hover:text-text-secondary hover:bg-[rgba(255,255,255,0.05)]'
                }`}
              >
                <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
              </button>
            </Tip>
          )
        })}
      </nav>

      <div className="h-px bg-[rgba(255,255,255,0.06)] mx-3 my-2" />

      {/* Sprint progress */}
      <div className="flex flex-col items-center px-2 gap-1">
        <Tip label={`${pct}% complete`}>
          <div className="w-8 h-8 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
              <circle cx="14" cy="14" r="11" fill="none"
                stroke={pct === 100 ? '#34D399' : '#F59E0B'} strokeWidth="2.5"
                strokeDasharray={`${2 * Math.PI * 11}`}
                strokeDashoffset={`${2 * Math.PI * 11 * (1 - pct / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 14 14)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
              <text x="14" y="18" textAnchor="middle" fill="rgba(255,255,255,0.5)"
                style={{ fontSize: 7, fontFamily: 'monospace', fontWeight: 600 }}>
                {pct}%
              </text>
            </svg>
          </div>
        </Tip>
      </div>

      <div className="flex-1" />

      {/* Guest session indicator */}
      {user && (
        <Tip label={`Guest · ${user.id.slice(0, 8)}`} side="right">
          <div className="flex items-center justify-center mb-1">
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-text-muted">
              GUEST
            </span>
          </div>
        </Tip>
      )}

      {/* Bottom actions */}
      <div className="flex flex-col items-center pb-2">
        {me ? (
          <Tip label={`${me.name} — Guest`} side="right">
            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-elevated transition-colors cursor-pointer mt-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center font-semibold"
                style={{ backgroundColor: me.color, fontSize: 8, color: '#090B12' }}
              >
                {me.initials}
              </div>
            </button>
          </Tip>
        ) : (
          <div className="w-9 h-9 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-primary-500/30 animate-pulse" />
          </div>
        )}

        <Tip label="Settings" side="right">
          <button
            onClick={() => onPanelChange(activePanel === 'settings' ? null : 'settings')}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              activePanel === 'settings'
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-text-muted hover:text-text-secondary hover:bg-[rgba(255,255,255,0.05)]'
            }`}
          >
            <Settings size={13} />
          </button>
        </Tip>
      </div>
    </aside>
  )
}

function Tip({ label, children, side = 'right' }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="pointer-events-none absolute z-50 px-2 py-1 bg-[#F0F2FF] text-[#090B12] rounded-md
                       whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150
                       text-[11px] font-medium left-full ml-2 top-1/2 -translate-y-1/2">
        {label}
      </div>
    </div>
  )
}
