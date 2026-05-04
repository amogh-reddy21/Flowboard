import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { Calendar } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Avatar } from './SearchFilterBar'
import { labelStyle } from '../utils/labelColors'
import { cn } from '../lib/utils'

const PRIORITY_BORDER = {
  urgent: '#EF4444',
  high:   '#F97316',
  medium: '#818CF8',
  low:    'rgba(255,255,255,0.08)',
  none:   'transparent',
}

const PRIORITY_GLOW = {
  urgent: '0 0 20px rgba(239,68,68,0.18), 0 1px 0 rgba(255,255,255,0.05)',
  high:   '0 0 20px rgba(249,115,22,0.15), 0 1px 0 rgba(255,255,255,0.05)',
  medium: '0 0 20px rgba(129,140,248,0.15), 0 1px 0 rgba(255,255,255,0.05)',
  low:    '0 1px 0 rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.5)',
  none:   '0 1px 0 rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.5)',
}

function dueDateBadge(dateStr) {
  // Normalize both dates to midnight local time for accurate day comparison
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // Supabase returns 'YYYY-MM-DD' for date columns; parse without UTC shift
  const due = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr)
  due.setHours(0, 0, 0, 0)
  const daysUntil = Math.round((due.getTime() - today.getTime()) / 86_400_000)

  if (daysUntil < 0)
    return { text: 'Overdue',  cls: 'bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)]',   color: '#EF4444' }
  if (daysUntil === 0)
    return { text: 'Today',    cls: 'bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)]',  color: '#F59E0B' }
  if (daysUntil === 1)
    return { text: 'Tomorrow', cls: 'bg-[rgba(107,114,128,0.08)] border border-[rgba(107,114,128,0.15)]', color: '#9CA3AF' }
  if (daysUntil <= 3)
    return { text: format(due, 'MMM d'), cls: 'bg-[rgba(234,179,8,0.08)] border border-[rgba(234,179,8,0.25)]', color: '#EAB308' }
  return   { text: format(due, 'MMM d'), cls: 'border border-transparent', color: '#6B7280' }
}

export default function TaskCard({ task, onClick, isDraggingOverlay = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const { members, labels } = useData()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : 'transform 260ms cubic-bezier(0.34, 1.20, 0.64, 1)',
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={{ ...style, minHeight: 64 }}
        {...attributes}
        {...listeners}
        className="relative flex flex-col justify-start pt-2 select-none"
      >
        <div className="flex items-center">
          <div className="w-[7px] h-[7px] rounded-full bg-primary-500 ring-2 ring-primary-500/30 flex-shrink-0 shadow-sm" />
          <div className="flex-1 h-[2px] bg-gradient-to-r from-primary-500 to-primary-500/30 rounded-r-full ml-0.5" />
        </div>
      </div>
    )
  }

  const isDone       = task.column === 'done'
  const assignees    = members.filter(m => task.assignees?.includes(m.id))
  const dueBadge     = (!isDone && task.dueDate) ? dueDateBadge(task.dueDate) : null
  const taskLabels   = labels.filter(l => task.labels?.includes(l.id))
  const borderColor  = isDone ? 'transparent' : (PRIORITY_BORDER[task.priority] ?? PRIORITY_BORDER.none)
  const hoverGlow    = isDone ? undefined : (PRIORITY_GLOW[task.priority] ?? PRIORITY_GLOW.none)

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderLeftColor: borderColor }}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative bg-card rounded-lg border border-l-[3px] border-[rgba(255,255,255,0.07)]',
        'shadow-card transition-all duration-150 animate-slide-up select-none',
        'cursor-pointer active:cursor-grabbing',
        'flex flex-col justify-between gap-1.5',
        'min-h-[64px] px-3 py-2.5',
        isDone && 'opacity-50 hover:opacity-70',
        isDraggingOverlay
          ? 'shadow-xl scale-[1.02] rotate-1'
          : 'hover:-translate-y-px',
      )}
      onMouseEnter={e => {
        if (!isDraggingOverlay && !isDone) {
          e.currentTarget.style.boxShadow = hoverGlow
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = ''
        e.currentTarget.style.borderColor = ''
      }}
      onClick={() => !isDragging && onClick(task)}
    >
      {/* Title + labels */}
      <div className="flex flex-col gap-1.5">
        <p className={cn(
          'text-[13.5px] leading-snug pr-6',
          isDone
            ? 'line-through text-text-muted decoration-text-muted/50 font-normal'
            : 'font-medium text-text-primary',
        )}>
          {task.title}
        </p>

        {taskLabels.length > 0 && (
          <div className="flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 max-h-0 group-hover:max-h-10 overflow-hidden transition-all duration-150">
            {taskLabels.slice(0, 3).map(l => (
              <span
                key={l.id}
                className="inline-flex items-center px-1.5 py-px rounded-full text-[10px] font-medium"
                style={labelStyle(l.color)}
              >
                {l.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 mt-auto min-h-[22px]">
        <div className="flex items-center gap-1.5">
          {dueBadge && (
            <span
              className={cn('inline-flex items-center gap-1 text-[11px] font-medium font-mono px-2 py-0.5 rounded-full leading-none', dueBadge.cls)}
              style={{ color: dueBadge.color }}
            >
              <Calendar size={11} className="shrink-0" />
              {dueBadge.text}
            </span>
          )}
        </div>

        {assignees.length > 0 && (
          <div className="flex -space-x-2">
            {assignees.slice(0, 3).map(m => (
              <Avatar key={m.id} member={m} size={22} showTooltip />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-[rgba(255,255,255,0.07)] px-3 py-2.5 min-h-[64px] flex flex-col justify-between gap-1.5 animate-pulse">
      <div>
        <div className="h-3.5 bg-[rgba(255,255,255,0.05)] rounded w-3/4 mb-2" />
        <div className="h-3 bg-[rgba(255,255,255,0.04)] rounded w-1/2" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 bg-[rgba(255,255,255,0.05)] rounded-full w-14" />
        <div className="w-5 h-5 bg-[rgba(255,255,255,0.05)] rounded-full" />
      </div>
    </div>
  )
}
