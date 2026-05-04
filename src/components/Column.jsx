import { useState, useRef, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Circle, Timer, Eye, CheckCircle2, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import TaskCard, { TaskCardSkeleton } from './TaskCard'

const COLUMN_META = {
  todo:        { icon: Circle,       iconColor: '#94A3B8', accentColor: '#94A3B8' },
  in_progress: { icon: Timer,        iconColor: '#38BDF8', accentColor: '#38BDF8' },
  in_review:   { icon: Eye,          iconColor: '#A78BFA', accentColor: '#A78BFA' },
  done:        { icon: CheckCircle2, iconColor: '#34D399', accentColor: '#34D399' },
}

const SKELETON_COUNTS = { todo: 3, in_progress: 2, in_review: 2, done: 1 }

export default function Column({ column, tasks, onTaskClick, onAddTask, onInlineAdd, isDraggingOver, hasFilters, loading }) {
  const { setNodeRef } = useDroppable({ id: column.id })
  const [isAdding, setIsAdding] = useState(false)
  const taskIds = tasks.map(t => t.id)
  const { icon: Icon, iconColor, accentColor } = COLUMN_META[column.id] || { icon: Circle, iconColor: '#64748B', accentColor: '#475569' }

  const handleSave = (title) => {
    onInlineAdd(column.id, title)
    setIsAdding(false)
  }

  return (
    <div
      className={`flex flex-col rounded-xl transition-colors duration-200 ${
        isDraggingOver ? 'bg-[rgba(245,158,11,0.03)]' : 'bg-[rgba(255,255,255,0.02)]'
      }`}
      style={{ borderTop: `3px solid ${accentColor}`, boxShadow: `0 -1px 0 0 ${accentColor}33` }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Icon size={13} style={{ color: iconColor }} strokeWidth={2} />
          <span className="font-display text-[13px] font-semibold text-text-primary tracking-tight">
            {column.label}
          </span>
          <span className="font-mono text-[10px] font-medium tabular-nums px-1.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.07)] text-text-muted">
            {loading ? '—' : tasks.length}
          </span>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="w-6 h-6 flex items-center justify-center rounded-md
                     text-text-muted hover:text-text-secondary hover:bg-elevated
                     transition-colors duration-150
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          title="Add task"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Drop zone */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex flex-col gap-2.5 px-2 border-0 column-scroll
            transition-all duration-200
            ${isDraggingOver ? 'ring-1 ring-[rgba(245,158,11,0.25)] ring-inset rounded-lg' : ''}`}
        >
          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{ overflow: 'hidden' }}
              >
                <InlineInput onSave={handleSave} onCancel={() => setIsAdding(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          {loading
            ? Array.from({ length: SKELETON_COUNTS[column.id] ?? 2 }).map((_, i) => (
                <TaskCardSkeleton key={i} />
              ))
            : (
              <AnimatePresence initial={false}>
                {tasks.map(task => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: -10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  >
                    <TaskCard task={task} onClick={onTaskClick} />
                  </motion.div>
                ))}
              </AnimatePresence>
            )
          }

          {!loading && tasks.length === 0 && !isAdding && !isDraggingOver && (
            <EmptyColumnMessage isFiltered={hasFilters} onAdd={() => setIsAdding(true)} />
          )}
        </div>
      </SortableContext>

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 w-full px-3 py-2.5 flex-shrink-0
                     text-text-muted hover:text-text-secondary hover:bg-[rgba(255,255,255,0.03)]
                     rounded-b-xl transition-colors text-[11px] font-medium"
        >
          <Plus size={12} />
          New task
        </button>
      )}
    </div>
  )
}

function InlineInput({ onSave, onCancel }) {
  const [value, setValue] = useState('')
  const ref = useRef()

  useEffect(() => { ref.current?.focus() }, [])

  const submit = () => {
    const t = value.trim()
    if (t) onSave(t)
    else onCancel()
  }

  return (
    <div className="bg-card border border-primary-500/40 rounded-lg shadow-glow mb-1">
      <div className="px-3 pt-2.5 pb-2">
        <input
          ref={ref}
          className="w-full bg-transparent border-0 outline-none text-text-primary
                     placeholder:text-text-muted text-sm font-medium focus:ring-0"
          placeholder="Task title…"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); submit() }
            if (e.key === 'Escape') onCancel()
          }}
        />
      </div>
      <div className="flex items-center justify-end gap-1.5 px-3 py-1.5 border-t border-[rgba(255,255,255,0.06)]">
        <button
          onClick={onCancel}
          className="text-[10px] px-2 py-0.5 rounded font-medium text-text-muted
                     hover:text-text-secondary hover:bg-elevated transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          className="text-[10px] px-2 py-0.5 bg-primary-500 text-[#090B12] rounded font-semibold
                     hover:bg-primary-400 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}

function EmptyColumnMessage({ isFiltered, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
      <div className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center mb-2">
        <Check size={14} className="text-text-muted" />
      </div>
      <p className="text-sm text-text-muted">
        {isFiltered ? 'No matching tasks' : 'No tasks yet'}
      </p>
      {isFiltered ? (
        <p className="text-xs text-text-muted/60 mt-1">Try clearing filters</p>
      ) : (
        <button
          onClick={onAdd}
          className="mt-2 text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium"
        >
          + Add task
        </button>
      )}
    </div>
  )
}
