import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { arrayMove } from '@dnd-kit/sortable'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export const COLUMNS = [
  { id: 'todo',        label: 'To Do',      color: '#94A3B8' },
  { id: 'in_progress', label: 'In Progress', color: '#38BDF8' },
  { id: 'in_review',   label: 'In Review',   color: '#A78BFA' },
  { id: 'done',        label: 'Done',        color: '#34D399' },
]

async function logActivity(taskId, userId, action, metadata) {
  await supabase.from('activity_log').insert({ task_id: taskId, user_id: userId, action, metadata })
}

export function useKanban() {
  const { user }    = useAuth()
  const qc          = useQueryClient()

  const [activeTask,      setActiveTask]      = useState(null)
  const [detailTaskId,    setDetailTaskId]    = useState(null)
  const [createCol,       setCreateCol]       = useState(null)
  const [showCreate,      setShowCreate]      = useState(false)
  const [search,          setSearch]          = useState('')
  const [filterPriority,  setFilterPriority]  = useState(null)
  const [filterLabel,     setFilterLabel]     = useState(null)
  const [filterAssignee,  setFilterAssignee]  = useState(null)

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const { data: serverTasks = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, task_labels(label_id)')
        .order('position')
      if (error) throw error
      return data.map(t => ({
        id:          t.id,
        title:       t.title,
        description: t.description,
        column:      t.status,
        priority:    t.priority,
        assignee_id: t.assignee_id,
        assignees:   t.assignee_id ? [t.assignee_id] : [],
        labels:      (t.task_labels || []).map(tl => tl.label_id),
        dueDate:     t.due_date,
        position:    t.position,
        order:       t.position,
        createdAt:   t.created_at,
        user_id:     t.user_id,
      }))
    },
    enabled: !!user,
  })

  const [tasks, setTasks] = useState([])
  useEffect(() => { setTasks(serverTasks) }, [serverTasks])

  // ── Derived ───────────────────────────────────────────────────────────────
  const detailTask = tasks.find(t => t.id === detailTaskId) ?? null
  const setDetailTask = useCallback((task) => setDetailTaskId(task?.id ?? null), [])

  const filtered = tasks.filter(t => {
    if (search         && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterPriority && t.priority   !== filterPriority)                        return false
    if (filterLabel    && !t.labels.includes(filterLabel))                        return false
    if (filterAssignee && t.assignee_id !== filterAssignee)                       return false
    return true
  })

  const tasksByColumn = COLUMNS.reduce((acc, col) => {
    acc[col.id] = filtered
      .filter(t => t.column === col.id)
      .sort((a, b) => a.order - b.order)
    return acc
  }, {})

  const stats = {
    total:      tasks.length,
    done:       tasks.filter(t => t.column === 'done').length,
    overdue:    tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.column !== 'done').length,
    inProgress: tasks.filter(t => t.column === 'in_progress').length,
  }

  // ── Create ────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const colTasks = tasks.filter(t => t.column === (data.column || 'todo'))
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          title:       data.title,
          description: data.description || null,
          status:      data.column || 'todo',
          priority:    data.priority || 'none',
          assignee_id: data.assignees?.[0] || null,
          due_date:    data.dueDate || null,
          position:    colTasks.length,
          user_id:     user.id,
        })
        .select()
        .single()
      if (error) throw error

      if (data.labels?.length > 0) {
        await supabase.from('task_labels').insert(
          data.labels.map(lid => ({ task_id: task.id, label_id: lid }))
        )
      }
      await logActivity(task.id, user.id, 'created', { title: data.title })
      return task
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      setShowCreate(false)
      setCreateCol(null)
    },
    onError: () => toast.error('Failed to create task'),
  })

  const createTask = useCallback((data) => {
    const colTasks = tasks.filter(t => t.column === (data.column || 'todo'))
    const tempTask = {
      id:          `temp-${Date.now()}`,
      title:       data.title,
      description: data.description || null,
      column:      data.column || 'todo',
      priority:    data.priority || 'none',
      assignee_id: data.assignees?.[0] || null,
      assignees:   data.assignees || [],
      labels:      data.labels || [],
      dueDate:     data.dueDate || null,
      order:       colTasks.length,
      position:    colTasks.length,
      createdAt:   new Date().toISOString(),
    }
    setTasks(prev => [...prev, tempTask])
    createMutation.mutate(data)
  }, [tasks, createMutation])

  // ── Update ────────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async ({ id, patch, prevTask }) => {
      const row = {}
      if ('title'       in patch) row.title       = patch.title
      if ('description' in patch) row.description = patch.description
      if ('column'      in patch) row.status      = patch.column
      if ('priority'    in patch) row.priority    = patch.priority
      if ('dueDate'     in patch) row.due_date    = patch.dueDate
      if ('assignees'   in patch) row.assignee_id = patch.assignees?.[0] || null

      if (Object.keys(row).length > 0) {
        const { error } = await supabase.from('tasks').update(row).eq('id', id)
        if (error) throw error
      }

      if ('labels' in patch) {
        await supabase.from('task_labels').delete().eq('task_id', id)
        if (patch.labels.length > 0) {
          await supabase.from('task_labels').insert(
            patch.labels.map(lid => ({ task_id: id, label_id: lid }))
          )
        }
      }

      if ('column' in patch && prevTask) {
        await logActivity(id, user.id, 'status_changed', { from: prevTask.column, to: patch.column })
        qc.invalidateQueries({ queryKey: ['activity', id] })
      }
      if (('title' in patch || 'description' in patch) && prevTask) {
        const field = 'title' in patch ? 'title' : 'description'
        await logActivity(id, user.id, 'edited', { field, from: prevTask[field], to: patch[field] })
        qc.invalidateQueries({ queryKey: ['activity', id] })
      }
      if ('assignees' in patch && prevTask) {
        await logActivity(id, user.id, 'assignee_changed', {
          from: prevTask.assignee_id,
          to:   patch.assignees?.[0] || null,
        })
        qc.invalidateQueries({ queryKey: ['activity', id] })
      }
      if ('priority' in patch && prevTask && patch.priority !== prevTask.priority) {
        await logActivity(id, user.id, 'edited', { field: 'priority', from: prevTask.priority, to: patch.priority })
        qc.invalidateQueries({ queryKey: ['activity', id] })
      }
      if ('dueDate' in patch && prevTask && patch.dueDate !== prevTask.dueDate) {
        await logActivity(id, user.id, 'edited', { field: 'due_date', from: prevTask.dueDate, to: patch.dueDate })
        qc.invalidateQueries({ queryKey: ['activity', id] })
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError:   () => toast.error('Failed to update task'),
  })

  const updateTask = useCallback((id, patch) => {
    const prevTask = tasks.find(t => t.id === id)
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const updated = { ...t, ...patch }
      if ('assignees' in patch) updated.assignee_id = patch.assignees?.[0] || null
      return updated
    }))
    updateMutation.mutate({ id, patch, prevTask })
  }, [tasks, updateMutation])

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError:   () => toast.error('Failed to delete task'),
  })

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    setDetailTaskId(prev => prev === id ? null : prev)
    deleteMutation.mutate(id)
  }, [deleteMutation])

  // ── DnD ───────────────────────────────────────────────────────────────────
  const handleDragStart = useCallback(({ active }) => {
    setActiveTask(tasks.find(t => t.id === active.id) || null)
  }, [tasks])

  const handleDragOver = useCallback(({ active, over }) => {
    if (!over) return
    const overId    = over.id
    const activeCol = tasks.find(t => t.id === active.id)?.column
    const isCol     = COLUMNS.some(c => c.id === overId)
    const overCol   = isCol ? overId : tasks.find(t => t.id === overId)?.column
    if (!activeCol || !overCol || activeCol === overCol) return

    setTasks(prev => {
      const srcTasks  = prev.filter(t => t.column === activeCol && t.id !== active.id)
        .sort((a, b) => a.order - b.order).map((t, i) => ({ ...t, order: i }))
      const dstTasks  = prev.filter(t => t.column === overCol).sort((a, b) => a.order - b.order)
      const insertIdx = isCol ? dstTasks.length : dstTasks.findIndex(t => t.id === overId)
      const moved     = { ...prev.find(t => t.id === active.id), column: overCol }
      const newDst    = [
        ...dstTasks.slice(0, insertIdx < 0 ? dstTasks.length : insertIdx),
        moved,
        ...dstTasks.slice(insertIdx < 0 ? dstTasks.length : insertIdx),
      ].map((t, i) => ({ ...t, order: i }))
      return [
        ...prev.filter(t => t.column !== activeCol && t.column !== overCol),
        ...srcTasks,
        ...newDst,
      ]
    })
  }, [tasks])

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveTask(null)
    if (!over) return

    const prevTask = tasks.find(t => t.id === active.id)
    if (!prevTask) return

    let finalTasks = tasks
    const isCol = COLUMNS.some(c => c.id === over.id)

    if (!isCol && active.id !== over.id) {
      const overT = tasks.find(t => t.id === over.id)
      if (overT && overT.column === prevTask.column) {
        const col    = tasks.filter(t => t.column === prevTask.column).sort((a, b) => a.order - b.order)
        const oldIdx = col.findIndex(t => t.id === active.id)
        const newIdx = col.findIndex(t => t.id === over.id)
        const newCol = arrayMove(col, oldIdx, newIdx).map((t, i) => ({ ...t, order: i }))
        finalTasks   = [...tasks.filter(t => t.column !== prevTask.column), ...newCol]
        setTasks(finalTasks)
      }
    }

    const movedTask = finalTasks.find(t => t.id === active.id)
    if (!movedTask) return

    supabase.from('tasks')
      .update({ status: movedTask.column, position: movedTask.order })
      .eq('id', active.id)
      .then(({ error }) => {
        if (error) {
          toast.error('Failed to save position')
          qc.invalidateQueries({ queryKey: ['tasks'] })
        }
      })

    if (movedTask.column !== prevTask.column) {
      logActivity(active.id, user.id, 'status_changed', { from: prevTask.column, to: movedTask.column })
        .then(() => qc.invalidateQueries({ queryKey: ['activity', active.id] }))
    }
  }, [tasks, qc, user])

  return {
    tasks, filtered, tasksByColumn, stats, isLoading, isError, refetch,
    activeTask, detailTask, setDetailTask,
    showCreate, setShowCreate, createCol, setCreateCol,
    search, setSearch,
    filterPriority, setFilterPriority,
    filterLabel,    setFilterLabel,
    filterAssignee, setFilterAssignee,
    createTask, updateTask, deleteTask,
    handleDragStart, handleDragOver, handleDragEnd,
    columns: COLUMNS,
  }
}
