import { useState, useEffect, useCallback } from 'react'
import { useKanban } from './hooks/useKanban'
import Sidebar from './components/Sidebar'
import BoardHeader from './components/BoardHeader'
import KanbanBoard from './components/KanbanBoard'
import CreateTaskModal from './components/CreateTaskModal'
import TaskDetailPanel from './components/TaskDetailPanel'
import TeamPanel from './components/TeamPanel'
import SettingsPanel from './components/SettingsPanel'
import LabelsPanel from './components/LabelsPanel'

export default function App() {
  const kanban = useKanban()
  const [draggingOverCol,  setDraggingOverCol]  = useState(null)
  const [hasCreatedTask,   setHasCreatedTask]   = useState(false)
  const [activePanel,      setActivePanel]      = useState(null) // 'team' | 'settings'

  const handleDragOver = event => {
    const { over } = event
    if (over) {
      const colIds = kanban.columns.map(c => c.id)
      setDraggingOverCol(colIds.includes(over.id) ? over.id : null)
    }
    kanban.handleDragOver(event)
  }

  const handleDragEnd = event => {
    setDraggingOverCol(null)
    kanban.handleDragEnd(event)
  }

  const handleInlineAdd = useCallback((colId, title) => {
    kanban.createTask({ title, column: colId, priority: 'none', labels: [], assignees: [], dueDate: null })
    setHasCreatedTask(true)
  }, [kanban])

  const handleCreateTask = useCallback(data => {
    kanban.createTask(data)
    setHasCreatedTask(true)
  }, [kanban])

  useEffect(() => {
    const handler = e => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        kanban.setCreateCol(kanban.columns[0].id)
        kanban.setShowCreate(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [kanban])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar
        stats={kanban.stats}
        activePanel={activePanel}
        onPanelChange={setActivePanel}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <BoardHeader
          onCreateTask={col => { kanban.setCreateCol(col); kanban.setShowCreate(true) }}
          search={kanban.search}         setSearch={kanban.setSearch}
          hasCreatedTask={hasCreatedTask}
          filterPriority={kanban.filterPriority} setFilterPriority={kanban.setFilterPriority}
          filterLabel={kanban.filterLabel}       setFilterLabel={kanban.setFilterLabel}
          filterAssignee={kanban.filterAssignee} setFilterAssignee={kanban.setFilterAssignee}
          stats={kanban.stats}
        />

        <div className="flex flex-1 overflow-hidden">
          <KanbanBoard
            columns={kanban.columns}
            tasksByColumn={kanban.tasksByColumn}
            activeTask={kanban.activeTask}
            onTaskClick={kanban.setDetailTask}
            onAddTask={col => { kanban.setCreateCol(col); kanban.setShowCreate(true) }}
            onInlineAdd={handleInlineAdd}
            onDragStart={kanban.handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            draggingOverCol={draggingOverCol}
            hasFilters={!!(kanban.filterPriority || kanban.filterLabel || kanban.filterAssignee || kanban.search)}
            loading={kanban.isLoading}
            isError={kanban.isError}
            onRetry={kanban.refetch}
          />
        </div>
      </div>

      <TaskDetailPanel
        open={!!kanban.detailTask}
        task={kanban.detailTask}
        onClose={() => kanban.setDetailTask(null)}
        onUpdate={kanban.updateTask}
        onDelete={id => { kanban.deleteTask(id); kanban.setDetailTask(null) }}
      />

      <CreateTaskModal
        open={kanban.showCreate}
        defaultColumn={kanban.createCol}
        onSave={handleCreateTask}
        onClose={() => { kanban.setShowCreate(false); kanban.setCreateCol(null) }}
      />

      <TeamPanel
        open={activePanel === 'team'}
        onClose={() => setActivePanel(null)}
      />

      <LabelsPanel
        open={activePanel === 'labels'}
        onClose={() => setActivePanel(null)}
      />

      <SettingsPanel
        open={activePanel === 'settings'}
        onClose={() => setActivePanel(null)}
      />
    </div>
  )
}
