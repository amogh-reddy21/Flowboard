import { useState, useEffect, useRef } from 'react'
import { X, ChevronDown, Calendar, Tag, Users } from 'lucide-react'
import { labelStyle } from '../utils/labelColors'
import { useData } from '../context/DataContext'
import { Avatar } from './SearchFilterBar'
import { format } from 'date-fns'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { COLUMNS } from '../hooks/useKanban'

const PRIORITIES = [
  { id: 'urgent', label: 'Urgent',      color: '#EF4444' },
  { id: 'high',   label: 'High',        color: '#F97316' },
  { id: 'medium', label: 'Medium',      color: '#EAB308' },
  { id: 'low',    label: 'Low',         color: '#22C55E' },
  { id: 'none',   label: 'No priority', color: '#9CA3AF' },
]

export default function CreateTaskModal({ open, defaultColumn, onSave, onClose }) {
  const { members, labels } = useData()

  const [title,       setTitle]       = useState('')
  const [description, setDesc]        = useState('')
  const [column,      setColumn]      = useState(defaultColumn || 'todo')
  const [priority,    setPriority]    = useState('none')
  const [selectedLabels, setSelectedLabels] = useState([])
  const [assignee,    setAssignee]    = useState(null)
  const [dueDate,     setDueDate]     = useState('')
  const [openPicker,  setOpenPicker]  = useState(null)
  const [error,       setError]       = useState(false)
  const titleRef = useRef()

  useEffect(() => {
    if (open) {
      setColumn(defaultColumn || 'todo')
      setTitle(''); setDesc(''); setPriority('none')
      setSelectedLabels([]); setAssignee(null); setDueDate('')
      setError(false)
      setTimeout(() => titleRef.current?.focus(), 50)
    }
  }, [open, defaultColumn])

  const handleSubmit = e => {
    e?.preventDefault()
    if (!title.trim()) { setError(true); titleRef.current?.focus(); return }
    onSave({
      title: title.trim(),
      description,
      column,
      priority,
      labels: selectedLabels,
      assignees: assignee ? [assignee] : [],
      dueDate: dueDate || null,
    })
    onClose()
  }

  const toggleLabel = id => setSelectedLabels(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const selPriority = PRIORITIES.find(p => p.id === priority)
  const selColumn   = COLUMNS.find(c => c.id === column)
  const selMember   = members.find(m => m.id === assignee)

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[500px] p-0 gap-0 bg-card border-border text-text-primary shadow-lg rounded-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <h2 className="text-text-primary font-semibold text-sm">New task</h2>
          <button onClick={onClose}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-elevated transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <input
            ref={titleRef}
            className={`w-full bg-transparent border-0 text-text-primary outline-none font-medium text-base focus:ring-0 placeholder:font-normal ${error ? 'placeholder:text-red-400' : 'placeholder:text-text-muted'}`}
            placeholder={error ? 'Title is required' : 'Task title…'}
            value={title}
            onChange={e => { setTitle(e.target.value); setError(false) }}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
          />
          <textarea
            className="w-full border border-[rgba(255,255,255,0.08)] rounded-md px-2.5 py-2 bg-[rgba(255,255,255,0.04)] text-text-secondary placeholder:text-text-muted
                       outline-none resize-none text-xs h-24
                       focus:border-primary-500/40 focus:ring-0 transition-colors"
            placeholder="Add a description… (optional)"
            value={description}
            onChange={e => setDesc(e.target.value)}
          />
          <div className="h-px bg-border" />

          {/* Metadata pickers */}
          <div className="flex flex-wrap gap-1.5">
            <MiniPicker open={openPicker === 'column'} onToggle={() => setOpenPicker(openPicker === 'column' ? null : 'column')}
              label={<span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: selColumn?.color }} />{selColumn?.label}</span>}>
              {COLUMNS.map(c => (
                <MiniItem key={c.id} active={column === c.id} onClick={() => { setColumn(c.id); setOpenPicker(null) }}>
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: c.color }} />{c.label}
                </MiniItem>
              ))}
            </MiniPicker>

            <MiniPicker open={openPicker === 'priority'} onToggle={() => setOpenPicker(openPicker === 'priority' ? null : 'priority')}
              label={<span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selPriority?.color }} />{selPriority?.label}</span>}>
              {PRIORITIES.map(p => (
                <MiniItem key={p.id} active={priority === p.id} onClick={() => { setPriority(p.id); setOpenPicker(null) }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />{p.label}
                </MiniItem>
              ))}
            </MiniPicker>

            <MiniPicker
              open={openPicker === 'label'} onToggle={() => setOpenPicker(openPicker === 'label' ? null : 'label')}
              active={selectedLabels.length > 0}
              label={selectedLabels.length === 0
                ? <span className="flex items-center gap-1"><Tag size={10} />Labels</span>
                : <span className="flex items-center gap-1 flex-wrap">
                    {labels.filter(l => selectedLabels.includes(l.id)).slice(0, 2).map(l => (
                      <span key={l.id} className="text-[10px] font-medium px-1.5 py-px rounded-full" style={labelStyle(l.color)}>{l.name}</span>
                    ))}
                    {selectedLabels.length > 2 && <span className="text-[10px] text-text-muted">+{selectedLabels.length - 2}</span>}
                  </span>
              }>
              {labels.map(l => (
                <MiniItem key={l.id} active={selectedLabels.includes(l.id)} onClick={() => toggleLabel(l.id)} noClose>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: l.color }} />{l.name}
                </MiniItem>
              ))}
            </MiniPicker>

            <MiniPicker
              open={openPicker === 'assignee'} onToggle={() => setOpenPicker(openPicker === 'assignee' ? null : 'assignee')}
              active={!!assignee}
              label={!assignee
                ? <span className="flex items-center gap-1"><Users size={10} />Assignee</span>
                : <span className="flex items-center gap-1">
                    <Avatar member={selMember} size={14} />
                    <span className="text-[10px]">{selMember?.name.split(' ')[0]}</span>
                  </span>
              }>
              <MiniItem active={!assignee} onClick={() => { setAssignee(null); setOpenPicker(null) }}>
                <span className="text-text-muted">No assignee</span>
              </MiniItem>
              {members.map(m => (
                <MiniItem key={m.id} active={assignee === m.id} onClick={() => { setAssignee(m.id); setOpenPicker(null) }}>
                  <Avatar member={m} size={16} />{m.name}
                </MiniItem>
              ))}
            </MiniPicker>

            {/* Due date */}
            <div className="relative">
              <label className={`flex items-center gap-1 px-2 py-1 rounded border cursor-pointer transition-all text-[10px] ${
                dueDate
                  ? 'bg-primary-500/10 border-primary-500/30 text-primary-400'
                  : 'bg-[rgba(255,255,255,0.04)] border-white/10 text-text-secondary hover:text-text-primary'
              }`}>
                <Calendar size={10} />
                {dueDate ? format(new Date(dueDate), 'MMM d') : 'Due date'}
                <input type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pb-4 pt-1">
          <p className="text-text-muted" style={{ fontSize: 10 }}>
            <kbd className="px-1 py-0.5 bg-elevated border border-border rounded text-[9px]">↵ Enter</kbd> to save
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="h-8 px-3 text-xs border border-border rounded-md text-text-secondary hover:bg-elevated transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit}
              className="h-8 px-3 text-xs bg-primary-500 text-[#090B12] rounded-md hover:bg-primary-400 transition-colors font-semibold shadow-sm">
              Create task
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MiniPicker({ open, onToggle, label, active, children }) {
  return (
    <div className="relative">
      <button type="button" onClick={onToggle}
        className={`flex items-center gap-1 h-7 px-2.5 rounded-md border transition-all duration-150 text-xs font-medium ${
          active
            ? 'bg-primary-500/10 border-primary-500/30 text-primary-400'
            : 'bg-[rgba(255,255,255,0.04)] border-white/10 text-text-secondary hover:text-text-primary hover:border-white/20'
        }`}>
        {label}
        <ChevronDown size={9} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-[#1F2538] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-md py-1 min-w-[150px] animate-scale-in">
          {children}
        </div>
      )}
    </div>
  )
}

function MiniItem({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors text-xs ${
        active ? 'bg-primary-500/10 text-primary-400' : 'text-text-secondary hover:bg-elevated hover:text-text-primary'
      }`}>
      {children}
      {active && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 ml-auto" />}
    </button>
  )
}
