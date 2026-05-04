import { Plus, Search, X, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useData } from '../context/DataContext'
import { Avatar } from './SearchFilterBar'

function useCountUp(target, duration = 700) {
  const [count, setCount] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    if (target === prev.current) return
    const start = prev.current
    prev.current = target
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - (1 - p) ** 3          // ease-out cubic
      setCount(Math.round(start + (target - start) * eased))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return count
}

const PRIORITIES = [
  { id: 'urgent', label: 'Urgent',      color: '#EF4444' },
  { id: 'high',   label: 'High',        color: '#F97316' },
  { id: 'medium', label: 'Medium',      color: '#818CF8' },
  { id: 'low',    label: 'Low',         color: '#64748B' },
  { id: 'none',   label: 'No priority', color: '#4E5678' },
]

export default function BoardHeader({
  onCreateTask, search, setSearch, hasCreatedTask,
  filterPriority, setFilterPriority,
  filterLabel,    setFilterLabel,
  filterAssignee, setFilterAssignee,
  stats,
}) {
  const { members, labels } = useData()
  const me = members[0]
  const animTotal   = useCountUp(stats.total)
  const animDone    = useCountUp(stats.done)
  const animOverdue = useCountUp(stats.overdue)
  const [open, setOpen] = useState(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const ref = useRef()
  const searchRef = useRef()

  useEffect(() => {
    const handler = e => {
      if (!ref.current?.contains(e.target)) { setOpen(null); setShowShortcuts(false) }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const hasFilters = filterPriority || filterLabel || filterAssignee
  const clearFilters = () => { setFilterPriority(null); setFilterLabel(null); setFilterAssignee(null) }

  return (
    <div ref={ref} className="flex items-center min-h-[48px] px-5 border-b border-[rgba(255,255,255,0.06)] bg-[#0F1221] flex-shrink-0 gap-4">
      {/* Board name + sprint progress */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <span className="font-display text-text-primary font-bold text-sm tracking-tight">FlowBoard</span>
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <span className="font-mono text-[11px] font-bold text-text-secondary tracking-widest uppercase">Sprint 4</span>
          <div className="w-24 h-[5px] bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden flex-shrink-0">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%`,
                backgroundColor: stats.done === stats.total && stats.total > 0 ? '#34D399' : '#F59E0B',
                boxShadow: stats.done === stats.total && stats.total > 0
                  ? '0 0 8px rgba(52,211,153,0.5)'
                  : '0 0 8px rgba(245,158,11,0.4)',
              }}
            />
          </div>
          <span className="font-mono text-text-secondary font-semibold tabular-nums text-[12px]">
            <span className="text-text-primary">{animDone}</span>/{animTotal}
          </span>
          {stats.overdue > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold
                             text-red-400 bg-red-500/[0.12] border border-red-500/30
                             px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 animate-pulse" />
              {animOverdue} overdue
            </span>
          )}
        </div>
      </div>

      <div className="w-px h-5 bg-[rgba(255,255,255,0.1)] flex-shrink-0" />

      {/* Search */}
      <div className="relative w-36 sm:w-56 flex-shrink-0">
        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          ref={searchRef}
          type="text"
          className="w-full h-[30px] pl-7 pr-14 bg-[rgba(255,255,255,0.06)] border border-white/10 rounded-md text-xs
                     text-text-primary placeholder:text-text-muted
                     focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500/50
                     transition-all duration-150"
          placeholder="Search tasks…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search ? (
          <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
            <X size={10} />
          </button>
        ) : (
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none
                          hidden sm:flex items-center gap-0.5 h-[18px] px-1.5
                          bg-[rgba(255,255,255,0.06)] border border-white/10 rounded text-[9px] font-mono text-text-muted">
            <span className="text-[10px] leading-none">⌘</span>K
          </kbd>
        )}
      </div>

      {/* Inline filters — hidden on mobile, visible md+ */}
      <div className="hidden md:flex items-center gap-1.5 flex-1">
        <FilterChip
          label="Priority" value={filterPriority}
          open={open === 'priority'} onToggle={() => setOpen(open === 'priority' ? null : 'priority')}
          onClear={() => setFilterPriority(null)}
          renderValue={() => {
            const p = PRIORITIES.find(p => p.id === filterPriority)
            return p ? <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />{p.label}</span> : null
          }}
        >
          {PRIORITIES.map(p => (
            <DropItem key={p.id} active={filterPriority === p.id}
              onClick={() => { setFilterPriority(filterPriority === p.id ? null : p.id); setOpen(null) }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />{p.label}
            </DropItem>
          ))}
        </FilterChip>

        <FilterChip
          label="Label" value={filterLabel}
          open={open === 'label'} onToggle={() => setOpen(open === 'label' ? null : 'label')}
          onClear={() => setFilterLabel(null)}
          renderValue={() => {
            const l = labels.find(l => l.id === filterLabel)
            return l ? <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: l.color }} />{l.name}</span> : null
          }}
        >
          {labels.map(l => (
            <DropItem key={l.id} active={filterLabel === l.id}
              onClick={() => { setFilterLabel(filterLabel === l.id ? null : l.id); setOpen(null) }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />{l.name}
            </DropItem>
          ))}
        </FilterChip>

        <FilterChip
          label="Assignee" value={filterAssignee}
          open={open === 'assignee'} onToggle={() => setOpen(open === 'assignee' ? null : 'assignee')}
          onClear={() => setFilterAssignee(null)}
          renderValue={() => {
            const m = members.find(m => m.id === filterAssignee)
            return m ? <span className="flex items-center gap-1.5"><Avatar member={m} size={13} />{m.name.split(' ')[0]}</span> : null
          }}
        >
          {members.map(m => (
            <DropItem key={m.id} active={filterAssignee === m.id}
              onClick={() => { setFilterAssignee(filterAssignee === m.id ? null : m.id); setOpen(null) }}>
              <Avatar member={m} size={16} />{m.name}
            </DropItem>
          ))}
        </FilterChip>

        {hasFilters && (
          <button onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-1 rounded-md border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors text-[10px] font-medium">
            <X size={9} /> Clear filters
          </button>
        )}
      </div>

      {/* Mobile filter badge — md hidden */}
      {hasFilters && (
        <button onClick={clearFilters}
          className="flex md:hidden items-center gap-1 px-2 h-[30px] rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-[10px] font-medium flex-shrink-0">
          <X size={9} /> Filters
        </button>
      )}

      {/* Right — shortcuts hint + avatar + new task */}
      <div className="flex items-center gap-2 flex-shrink-0 relative">
        <div className="relative">
          <button
            onClick={() => setShowShortcuts(v => !v)}
            className={`w-5 h-5 flex items-center justify-center rounded-full border
                       text-[10px] font-bold transition-colors duration-150
                       ${showShortcuts
                         ? 'bg-[#F0F2FF] border-[#F0F2FF] text-[#090B12]'
                         : 'border-[rgba(255,255,255,0.15)] text-text-muted hover:border-[rgba(255,255,255,0.3)] hover:text-text-secondary'
                       }`}
            title="Keyboard shortcuts"
          >
            ?
          </button>
          <AnimatePresence>
            {showShortcuts && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute top-full right-0 mt-2 z-50 bg-[#1F2538] border border-[rgba(255,255,255,0.1)]
                           rounded-xl shadow-lg p-3 min-w-[188px]"
              >
                <p className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-widest mb-2">
                  Shortcuts
                </p>
                <div className="flex flex-col gap-1.5">
                  {[
                    { label: 'New task', key: 'C' },
                    { label: 'Search',   key: '⌘K' },
                  ].map(({ label, key }) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <span className="text-xs text-text-secondary">{label}</span>
                      <kbd className="px-1.5 py-0.5 bg-elevated border border-[rgba(255,255,255,0.1)]
                                      rounded text-[10px] font-mono text-text-secondary flex-shrink-0">
                        {key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {me && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ring-2 ring-[rgba(255,255,255,0.08)]"
            style={{ backgroundColor: me.color, fontSize: 9, color: '#090B12' }}
            title={me.name}
          >
            {me.initials}
          </div>
        )}

        <div className="relative group/btn">
          <button
            onClick={() => onCreateTask(null)}
            className={`flex items-center gap-1.5 h-7 px-3 bg-primary-500 hover:bg-primary-400
                       active:bg-primary-600 text-[#090B12] text-[11px] font-semibold rounded-md
                       transition-all duration-150 cursor-pointer
                       ${!hasCreatedTask ? 'animate-btn-pulse' : ''}`}
          >
            <Plus size={12} />
            New task
          </button>
          <span className="absolute -bottom-5 right-0 text-[9px] text-text-muted whitespace-nowrap
                           opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
            press <kbd className="px-1 py-px bg-elevated border border-[rgba(255,255,255,0.08)] rounded text-[9px] font-mono">C</kbd>
          </span>
        </div>
      </div>
    </div>
  )
}

function FilterChip({ label, value, open, onToggle, onClear, renderValue, children }) {
  return (
    <div className="relative">
      <button onClick={onToggle}
        className={`flex items-center gap-1.5 px-2.5 h-[30px] rounded-md border transition-all duration-150 text-[11px] font-medium ${
          value
            ? 'bg-primary-500/[0.15] border-primary-500/50 text-primary-300'
            : 'bg-[rgba(255,255,255,0.04)] border-white/10 text-text-secondary hover:text-text-primary hover:bg-[rgba(255,255,255,0.07)] hover:border-white/15'
        }`}>
        {value ? renderValue() : label}
        {value ? (
          <X size={10} onClick={e => { e.stopPropagation(); onClear() }} className="ml-0.5 opacity-70 hover:opacity-100" />
        ) : (
          <ChevronDown size={10} className={`transition-transform duration-150 opacity-60 ${open ? 'rotate-180' : ''}`} />
        )}
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-50 bg-[#1F2538] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl py-1 min-w-[160px] animate-scale-in">
          {children}
        </div>
      )}
    </div>
  )
}

function DropItem({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors text-xs ${
        active ? 'bg-[rgba(245,158,11,0.1)] text-primary-400' : 'text-text-secondary hover:bg-elevated hover:text-text-primary'
      }`}>
      {children}
      {active && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 ml-auto flex-shrink-0" />}
    </button>
  )
}
