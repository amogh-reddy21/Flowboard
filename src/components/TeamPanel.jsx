import { useState } from 'react'
import { X, UserPlus, Trash2, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTeamMembers } from '../hooks/useTeamMembers'
import { Avatar } from './SearchFilterBar'

export default function TeamPanel({ open, onClose }) {
  const { members, addMember, deleteMember, isAdding } = useTeamMembers()
  const [name, setName] = useState('')
  const [err,  setErr]  = useState(false)

  const handleAdd = async (e) => {
    e?.preventDefault()
    if (!name.trim()) { setErr(true); return }
    await addMember({ name: name.trim() })
    setName('')
    setErr(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.aside
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0,   opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 38 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[340px] bg-card border-l border-[rgba(255,255,255,0.08)] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-primary-400" />
                <span className="font-semibold text-sm text-text-primary">Team</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-text-muted">
                  {members.length}
                </span>
              </div>
              <button onClick={onClose}
                className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-elevated transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Members list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              <AnimatePresence initial={false}>
                {members.map(m => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16, height: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-elevated group/member transition-colors"
                  >
                    <Avatar member={m} size={30} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{m.name}</p>
                      <p className="text-[10px] text-text-muted">Team member</p>
                    </div>
                    <button
                      onClick={() => deleteMember(m.id)}
                      className="opacity-0 group-hover/member:opacity-100 p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] transition-all"
                      title="Remove member"
                    >
                      <Trash2 size={12} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {members.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users size={24} className="text-text-muted mb-2 opacity-40" />
                  <p className="text-sm text-text-muted">No team members yet</p>
                  <p className="text-xs text-text-muted/60 mt-1">Add your first member below</p>
                </div>
              )}
            </div>

            {/* Add member form */}
            <form onSubmit={handleAdd} className="px-4 py-4 border-t border-border flex-shrink-0">
              <p className="text-xs font-medium text-text-muted mb-2 flex items-center gap-1.5">
                <UserPlus size={11} /> Add member
              </p>
              <div className="flex gap-2">
                <input
                  className={`flex-1 h-8 px-3 bg-[rgba(255,255,255,0.05)] border rounded-md text-xs text-text-primary placeholder:text-text-muted
                              focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-colors ${
                    err ? 'border-red-500/50 placeholder:text-red-400' : 'border-white/10'
                  }`}
                  placeholder={err ? 'Name required' : 'Member name…'}
                  value={name}
                  onChange={e => { setName(e.target.value); setErr(false) }}
                />
                <button
                  type="submit"
                  disabled={isAdding}
                  className="h-8 px-3 bg-primary-500 hover:bg-primary-400 disabled:opacity-50 text-[#090B12] text-xs font-semibold rounded-md transition-colors"
                >
                  {isAdding ? '…' : 'Add'}
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
