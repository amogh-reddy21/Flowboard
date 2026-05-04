import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { AlertCircle, RefreshCw } from 'lucide-react'
import Column from './Column'
import TaskCard from './TaskCard'

export default function KanbanBoard({
  columns, tasksByColumn, activeTask,
  onTaskClick, onAddTask, onInlineAdd,
  onDragStart, onDragOver, onDragEnd,
  draggingOverCol, hasFilters, loading,
  isError, onRetry,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4 text-center px-8">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle size={22} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary mb-1">Failed to load board</p>
            <p className="text-xs text-text-muted max-w-[260px]">
              Could not reach Supabase. Check your internet connection or verify your project URL and anon key in <code className="font-mono text-text-secondary">.env.local</code>.
            </p>
          </div>
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 h-8 px-4 bg-primary-500 hover:bg-primary-400 text-[#090B12] text-xs font-semibold rounded-md transition-colors"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex-1 overflow-x-auto overflow-y-auto bg-surface board-scroll">
        <div className="flex gap-4 p-4 min-h-full" style={{ alignItems: 'flex-start' }}>
          {columns.map(col => (
            <div key={col.id} className="flex-1 min-w-[280px] flex-shrink-0 flex flex-col self-start">
              <Column
                column={col}
                tasks={tasksByColumn[col.id] || []}
                onTaskClick={onTaskClick}
                onAddTask={onAddTask}
                onInlineAdd={onInlineAdd}
                isDraggingOver={draggingOverCol === col.id}
                hasFilters={hasFilters}
                loading={loading}
              />
            </div>
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeTask && <TaskCard task={activeTask} onClick={() => {}} isDraggingOverlay />}
      </DragOverlay>
    </DndContext>
  )
}
