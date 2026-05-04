import { useState, useRef, useEffect } from 'react'
import { Trash2, Calendar, Tag, Users, Flag, ArrowRight, Pencil, UserCheck, MessageSquare, Clock, CheckCircle, Circle, ChevronDown, X, AlignLeft, Edit3 } from 'lucide-react'
import { labelStyle } from '../utils/labelColors'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import { useData } from '../context/DataContext'
import { useComments } from '../hooks/useComments'
import { useActivityLog } from '../hooks/useActivityLog'
import { Avatar } from './SearchFilterBar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { COLUMNS } from '../hooks/useKanban'

const PRIORITIES = [
  { id: 'urgent', label: 'Urgent',      color: '#EF4444' },
  { id: 'high',   label: 'High',        color: '#F97316' },
  { id: 'medium', label: 'Medium',      color: '#EAB308' },
  { id: 'low',    label: 'Low',         color: '#22C55E' },
  { id: 'none',   label: 'No priority', color: '#9CA3AF' },
]

export default function TaskDetailPanel({ open, task, onClose, onUpdate, onDelete }) {
  const { members, labels }              = useData()
  const { comments, addComment, deleteComment } = useComments(task?.id)
  const { activity }                     = useActivityLog(task?.id)

  const [commentText,  setCommentText]  = useState('')
  const [editTitle,    setEditTitle]    = useState(false)
  const [titleVal,     setTitleVal]     = useState(task?.title || '')
  const [openPicker,   setOpenPicker]   = useState(null)
  const [editDesc,     setEditDesc]     = useState(false)
  const panelRef   = useRef()
  const commentRef = useRef()

  useEffect(() => { if (task) setTitleVal(task.title) }, [task?.id, task?.title])
  useEffect(() => { if (!open) { setEditTitle(false); setEditDesc(false); setCommentText(''); setOpenPicker(null) } }, [open])

  useEffect(() => {
    const handler = e => {
      if (openPicker && panelRef.current && !panelRef.current.contains(e.target)) setOpenPicker(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openPicker])

  const submitComment = async () => {
    if (!commentText.trim()) return
    await addComment(commentText.trim())
    setCommentText('')
  }

  const saveTitle = () => {
    if (titleVal.trim() && titleVal !== task.title) onUpdate(task.id, { title: titleVal.trim() })
    setEditTitle(false)
  }

  const selPriority = task ? PRIORITIES.find(p => p.id === task.priority) : null
  const selColumn   = task ? COLUMNS.find(c => c.id === task.column) : null
  const taskLabels  = task ? labels.filter(l => task.labels?.includes(l.id)) : []
  const assignees   = task ? members.filter(m => task.assignees?.includes(m.id)) : []

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full md:w-[480px] md:max-w-[480px] p-0 bg-card border-l border-[rgba(255,255,255,0.07)] flex flex-col gap-0"
      >
        {task && (
          <div ref={panelRef} className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
              <span className="text-xs font-mono font-medium text-text-muted uppercase tracking-wide">Task details</span>
              <div className="flex items-center gap-1">
                <button onClick={() => onDelete(task.id)}
                  className="p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] transition-colors">
                  <Trash2 size={13} />
                </button>
                <button onClick={onClose}
                  className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-elevated transition-colors">
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-4">
                {/* Editable title */}
                {editTitle ? (
                  <textarea
                    autoFocus
                    className="w-full bg-transparent border-0 outline-none text-text-primary font-semibold
                               resize-none focus:ring-0 text-base leading-snug"
                    value={titleVal}
                    onChange={e => setTitleVal(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveTitle() }
                      if (e.key === 'Escape') { setTitleVal(task.title); setEditTitle(false) }
                    }}
                    rows={2}
                  />
                ) : (
                  <h2
                    onClick={() => setEditTitle(true)}
                    className="text-text-primary font-semibold cursor-text hover:bg-elevated rounded-md
                               px-1 -mx-1 py-0.5 transition-colors text-base leading-snug group flex items-start gap-1"
                  >
                    <span className="flex-1">{task.title}</span>
                    <Edit3 size={11} className="opacity-0 group-hover:opacity-40 mt-1 flex-shrink-0" />
                  </h2>
                )}

                {/* Meta grid */}
                <div className="space-y-0.5 mt-5">
                  <MetaRow icon={<CheckCircle size={12} />} label="Status"
                    onClick={() => setOpenPicker(openPicker === 'column' ? null : 'column')}>
                    <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: selColumn?.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selColumn?.color }} />
                      {selColumn?.label}
                    </span>
                    <PickerDropdown open={openPicker === 'column'}>
                      {COLUMNS.map(c => (
                        <PickerItem key={c.id} active={task.column === c.id}
                          onClick={e => { e.stopPropagation(); onUpdate(task.id, { column: c.id }); setOpenPicker(null) }}>
                          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: c.color }} />{c.label}
                        </PickerItem>
                      ))}
                    </PickerDropdown>
                  </MetaRow>

                  <MetaRow icon={<Flag size={12} />} label="Priority"
                    onClick={() => setOpenPicker(openPicker === 'priority' ? null : 'priority')}>
                    <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: selPriority?.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selPriority?.color }} />
                      {selPriority?.label}
                    </span>
                    <PickerDropdown open={openPicker === 'priority'}>
                      {PRIORITIES.map(p => (
                        <PickerItem key={p.id} active={task.priority === p.id}
                          onClick={e => { e.stopPropagation(); onUpdate(task.id, { priority: p.id }); setOpenPicker(null) }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />{p.label}
                        </PickerItem>
                      ))}
                    </PickerDropdown>
                  </MetaRow>

                  <MetaRow icon={<Users size={12} />} label="Assignee"
                    onClick={() => setOpenPicker(openPicker === 'assignee' ? null : 'assignee')}>
                    {assignees.length > 0
                      ? <span className="flex items-center gap-1.5 text-xs">
                          <span className="flex -space-x-1">{assignees.map(m => <Avatar key={m.id} member={m} size={16} />)}</span>
                          <span className="text-text-secondary font-medium">{assignees.map(m => m.name.split(' ')[0]).join(', ')}</span>
                        </span>
                      : <span className="text-text-muted text-xs">Unassigned</span>
                    }
                    <PickerDropdown open={openPicker === 'assignee'}>
                      <PickerItem active={!task.assignee_id}
                        onClick={e => { e.stopPropagation(); onUpdate(task.id, { assignees: [] }); setOpenPicker(null) }}>
                        <span className="w-4 h-4 rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center">
                          <X size={8} className="text-text-muted" />
                        </span>
                        Unassigned
                      </PickerItem>
                      {members.map(m => (
                        <PickerItem key={m.id} active={task.assignee_id === m.id}
                          onClick={e => {
                            e.stopPropagation()
                            onUpdate(task.id, { assignees: task.assignee_id === m.id ? [] : [m.id] })
                            setOpenPicker(null)
                          }}>
                          <Avatar member={m} size={16} />{m.name}
                        </PickerItem>
                      ))}
                    </PickerDropdown>
                  </MetaRow>

                  <MetaRow icon={<Calendar size={12} />} label="Due date" noChevron>
                    <label className={`relative cursor-pointer text-xs font-medium ${
                      task.dueDate && isPast(new Date(task.dueDate)) && task.column !== 'done'
                        ? 'text-red-400' : 'text-text-secondary'}`}>
                      {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : <span className="text-text-muted font-normal">No due date</span>}
                      <input type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full"
                        value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                        onChange={e => onUpdate(task.id, { dueDate: e.target.value || null })} />
                    </label>
                  </MetaRow>

                  <MetaRow icon={<Tag size={12} />} label="Labels"
                    onClick={() => setOpenPicker(openPicker === 'label' ? null : 'label')}>
                    {taskLabels.length > 0
                      ? <span className="flex flex-wrap gap-1">{taskLabels.map(l => (
                          <span key={l.id} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={labelStyle(l.color)}>{l.name}</span>
                        ))}</span>
                      : <span className="text-text-muted text-xs">No labels</span>
                    }
                    <PickerDropdown open={openPicker === 'label'}>
                      {labels.map(l => (
                        <PickerItem key={l.id} active={task.labels?.includes(l.id)}
                          onClick={e => {
                            e.stopPropagation()
                            const next = task.labels?.includes(l.id)
                              ? task.labels.filter(x => x !== l.id)
                              : [...(task.labels || []), l.id]
                            onUpdate(task.id, { labels: next })
                          }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />{l.name}
                        </PickerItem>
                      ))}
                    </PickerDropdown>
                  </MetaRow>
                </div>

                {/* Description */}
                <div className="mt-5">
                  <p className="text-xs font-medium text-text-muted mb-1.5 flex items-center gap-1.5">
                    <AlignLeft size={11} /> Description
                  </p>
                  {editDesc ? (
                    <textarea
                      autoFocus
                      className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2.5 text-sm text-text-primary
                                 placeholder:text-text-muted resize-none h-28
                                 focus:outline-none focus:ring-1 focus:ring-primary-500/40 focus:border-primary-500/40 transition-colors"
                      placeholder="Add a description…"
                      value={task.description || ''}
                      onChange={e => onUpdate(task.id, { description: e.target.value })}
                      onBlur={() => setEditDesc(false)}
                    />
                  ) : (
                    <p
                      onClick={() => setEditDesc(true)}
                      className="text-sm text-text-secondary px-3 py-2.5 rounded-lg hover:bg-elevated cursor-text min-h-[72px] transition-colors whitespace-pre-wrap"
                    >
                      {task.description || <span className="text-text-muted">Add a description…</span>}
                    </p>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div className="px-5 pb-4 border-t border-border pt-4">
                <p className="text-xs font-medium text-text-muted flex items-center gap-1.5 mb-3">
                  <MessageSquare size={11} /> Comments {comments.length > 0 && `(${comments.length})`}
                </p>
                <div className="space-y-3 mb-3">
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-2.5 group">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                        style={{ backgroundColor: '#7C3AED', color: '#fff' }}
                      >
                        G
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-text-primary font-medium" style={{ fontSize: 11 }}>Guest</span>
                          <span className="text-text-muted" style={{ fontSize: 10 }}>
                            {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                          </span>
                          <button
                            onClick={() => deleteComment(c.id)}
                            className="ml-auto opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-500 transition-opacity"
                            title="Delete comment"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                        <div className="bg-surface border border-border rounded-lg px-3 py-2 text-text-secondary text-xs">{c.body}</div>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-text-muted text-center py-3" style={{ fontSize: 11 }}>No comments yet</p>
                  )}
                </div>
                <div className="flex gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0">
                    G
                  </div>
                  <div className="flex-1 relative">
                    <textarea
                      ref={commentRef}
                      className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-text-primary
                                 placeholder:text-text-muted resize-none text-xs
                                 focus:outline-none focus:ring-1 focus:ring-primary-500/40 focus:border-primary-500/40 transition-colors"
                      style={{ minHeight: 36 }}
                      placeholder="Add a comment…"
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
                      rows={1}
                    />
                    {commentText && (
                      <button onClick={submitComment}
                        className="absolute right-2 bottom-2 text-[10px] px-1.5 py-0.5 bg-primary-600 text-white rounded font-medium hover:bg-primary-700 transition-colors">
                        Send
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity */}
              <div className="px-5 pb-6 border-t border-border pt-4">
                <p className="text-xs font-medium text-text-muted flex items-center gap-1.5 mb-3">
                  <Clock size={11} /> Activity
                </p>
                <div className="relative pl-4 border-l border-border space-y-3.5">
                  {[...activity].reverse().map(a => {
                    const toLabel   = COLUMNS.find(c => c.id === a.metadata?.to)?.label ?? a.metadata?.to
                    const toMember  = members.find(m => m.id === a.metadata?.to)
                    const fieldName = a.metadata?.field
                      ? { title: 'title', description: 'description', priority: 'priority', due_date: 'due date' }[a.metadata.field] ?? a.metadata.field
                      : null

                    let icon, text
                    switch (a.action) {
                      case 'created':
                        icon = <Circle size={10} className="text-text-muted" />
                        text = 'created this task'
                        break
                      case 'status_changed':
                        icon = <ArrowRight size={10} className="text-primary-400" />
                        text = <>moved to <span className="text-text-primary font-medium">{toLabel}</span></>
                        break
                      case 'edited':
                        icon = <Pencil size={9} className="text-yellow-400/80" />
                        text = <>updated <span className="text-text-primary font-medium">{fieldName}</span></>
                        break
                      case 'assignee_changed':
                        icon = <UserCheck size={9} className="text-green-400/80" />
                        text = toMember
                          ? <>assigned to <span className="text-text-primary font-medium">{toMember.name.split(' ')[0]}</span></>
                          : 'removed assignee'
                        break
                      default:
                        icon = <Circle size={10} className="text-text-muted" />
                        text = a.action.replace(/_/g, ' ')
                    }

                    return (
                      <div key={a.id} className="flex items-start gap-2">
                        <div className="absolute -left-1.5 mt-0.5 bg-card border border-[rgba(255,255,255,0.1)] rounded-full p-0.5">
                          {icon}
                        </div>
                        <div className="text-text-secondary leading-relaxed" style={{ fontSize: 11 }}>
                          {text}
                          <span className="text-text-muted ml-1.5">
                            · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {activity.length === 0 && (
                    <p className="text-text-muted" style={{ fontSize: 11 }}>No activity yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function MetaRow({ icon, label, onClick, noChevron, children }) {
  return (
    <div
      className={`relative flex items-center py-2 -mx-2 px-2 rounded-md transition-colors group/meta ${
        onClick ? 'hover:bg-elevated cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <span className="w-28 flex items-center gap-2 text-xs text-text-muted flex-shrink-0">
        {icon}{label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
      {onClick && !noChevron && (
        <ChevronDown size={12} className="text-text-muted ml-auto flex-shrink-0 opacity-0 group-hover/meta:opacity-100 transition-opacity" />
      )}
    </div>
  )
}

function PickerDropdown({ open, children }) {
  if (!open) return null
  return (
    <div className="absolute top-full mt-1 left-28 z-50 bg-[#1F2538] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-lg py-1 min-w-[170px] animate-scale-in">
      {children}
    </div>
  )
}

function PickerItem({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors text-xs ${
        active ? 'bg-primary-500/10 text-primary-400' : 'text-text-secondary hover:bg-elevated hover:text-text-primary'
      }`}>
      {children}
      {active && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 ml-auto flex-shrink-0" />}
    </button>
  )
}
