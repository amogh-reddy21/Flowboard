import { useState } from 'react'
import { X, Tag, Trash2, Plus, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLabels } from '../hooks/useLabels'

const PRESET_COLORS = [
  '#3B82F6', '#22C55E', '#EF4444', '#F97316',
  '#A78BFA', '#EC4899', '#EAB308', '#14B8A6',
  '#F87171', '#6366F1', '#84CC16', '#06B6D4',
]

export default function LabelsPanel({ open, onClose }) {
  const { labels, addLabel, deleteLabel, isAdding } = useLabels()
  const [name,        setName]        = useState('')
  const [color,       setColor]       = useState(PRESET_COLORS[0])
  const [hoverId,     setHoverId]     = useState(null)
  const [deleteId,    setDeleteId]    = useState(null)

  const handleAdd = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    await addLabel({ name: trimmed, color })
    setName('')
    setColor(PRESET_COLORS[0])
  }

  const handleDelete = async (id) => {
    setDeleteId(id)
    try {
      await deleteLabel(id)
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0,   opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 38 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[320px] bg-card border-l border-[rgba(255,255,255,0.08)] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-primary-400" />
                <span className="font-semibold text-sm text-text-primary">Labels</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-elevated border border-border text-text-muted">
                  {labels.length}
                </span>
              </div>
              <button onClick={onClose}
                className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-elevated transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Label list */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
              {labels.length === 0 && (
                <p className="text-xs text-text-muted text-center py-8">No labels yet — add one below.</p>
              )}
              <AnimatePresence initial={false}>
                {labels.map(label => (
                  <motion.div
                    key={label.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    onMouseEnter={() => setHoverId(label.id)}
                    onMouseLeave={() => setHoverId(null)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-elevated transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="text-sm text-text-primary">{label.name}</span>
                    </div>
                    <AnimatePresence>
                      {hoverId === label.id && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.1 }}
                          onClick={() => handleDelete(label.id)}
                          disabled={deleteId === label.id}
                          className="p-1 rounded-md text-text-muted hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={12} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Add label form */}
            <div className="px-5 py-4 border-t border-border flex-shrink-0">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3">Add label</p>
              <form onSubmit={handleAdd} className="space-y-3">
                <input
                  type="text"
                  placeholder="Label name…"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-8 px-3 bg-elevated border border-border rounded-md text-xs text-text-primary
                             placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-500/50
                             focus:border-primary-500/50 transition-all"
                />

                {/* Color swatches */}
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-6 h-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px #090B12, 0 0 0 3.5px ${c}` : 'none' }}
                    >
                      {color === c && <Check size={10} color="#fff" strokeWidth={3} />}
                    </button>
                  ))}
                </div>

                {/* Preview */}
                {name.trim() && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted">Preview:</span>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: color + '26',
                        color,
                        border: `1px solid ${color}40`,
                      }}
                    >
                      {name.trim()}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!name.trim() || isAdding}
                  className="w-full h-8 flex items-center justify-center gap-1.5 bg-primary-500 hover:bg-primary-400
                             disabled:opacity-40 disabled:cursor-not-allowed text-[#090B12] text-xs font-semibold
                             rounded-md transition-colors"
                >
                  <Plus size={12} />
                  {isAdding ? 'Adding…' : 'Add label'}
                </button>
              </form>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
