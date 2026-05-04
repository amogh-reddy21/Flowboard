import { useState } from 'react'
import { X, Settings, Trash2, AlertTriangle, Copy, Check, Database } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

const SQL_SCHEMA = `-- =============================================
-- FlowBoard · Supabase SQL Schema
-- =============================================

create table if not exists public.team_members (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  name       text not null,
  color      text not null default '#94A3B8',
  created_at timestamptz default now()
);

create table if not exists public.labels (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  name       text not null,
  color      text not null default '#64748B',
  created_at timestamptz default now()
);

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  title       text not null,
  description text,
  status      text not null default 'todo'
              check (status in ('todo','in_progress','in_review','done')),
  priority    text not null default 'none'
              check (priority in ('urgent','high','medium','low','none')),
  assignee_id uuid references public.team_members(id) on delete set null,
  due_date    date,
  position    float8 not null default 0,
  created_at  timestamptz default now()
);

create table if not exists public.task_labels (
  task_id  uuid references public.tasks(id) on delete cascade,
  label_id uuid references public.labels(id) on delete cascade,
  primary key (task_id, label_id)
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid references public.tasks(id) on delete cascade not null,
  user_id    uuid references auth.users not null,
  body       text not null,
  created_at timestamptz default now()
);

create table if not exists public.activity_log (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid references public.tasks(id) on delete cascade not null,
  user_id    uuid references auth.users not null,
  action     text not null,
  metadata   jsonb,
  created_at timestamptz default now()
);

-- ── Row Level Security ──────────────────────────────────────

alter table public.team_members  enable row level security;
alter table public.labels        enable row level security;
alter table public.tasks         enable row level security;
alter table public.task_labels   enable row level security;
alter table public.comments      enable row level security;
alter table public.activity_log  enable row level security;

-- team_members
create policy "Users manage own members"
  on public.team_members for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- labels
create policy "Users manage own labels"
  on public.labels for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- tasks
create policy "Users manage own tasks"
  on public.tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- task_labels (via tasks)
create policy "Users manage own task_labels"
  on public.task_labels for all
  using (exists (
    select 1 from public.tasks
    where id = task_labels.task_id and user_id = auth.uid()
  ));

-- comments (via tasks)
create policy "Users manage own comments"
  on public.comments for all
  using (exists (
    select 1 from public.tasks
    where id = comments.task_id and user_id = auth.uid()
  ));

-- activity_log (via tasks)
create policy "Users manage own activity"
  on public.activity_log for all
  using (exists (
    select 1 from public.tasks
    where id = activity_log.task_id and user_id = auth.uid()
  ));`

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded-md border border-[rgba(255,255,255,0.1)] text-text-muted hover:text-text-secondary hover:bg-elevated transition-colors text-[10px]"
    >
      {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function SettingsPanel({ open, onClose }) {
  const { user }   = useAuth()
  const qc         = useQueryClient()
  const [confirm,    setConfirm]    = useState(null) // 'tasks' | 'everything'
  const [resetting,  setResetting]  = useState(false)

  const resetTasks = async () => {
    if (!user) return
    setResetting(true)
    try {
      const { error } = await supabase.from('tasks').delete().eq('user_id', user.id)
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Board reset — all tasks deleted')
      setConfirm(null)
    } catch {
      toast.error('Failed to reset board')
    } finally {
      setResetting(false)
    }
  }

  const resetEverything = async () => {
    if (!user) return
    setResetting(true)
    try {
      // tasks cascade-deletes task_labels, comments, activity_log
      const { error: te } = await supabase.from('tasks').delete().eq('user_id', user.id)
      if (te) throw te
      const { error: le } = await supabase.from('labels').delete().eq('user_id', user.id)
      if (le) throw le
      const { error: me } = await supabase.from('team_members').delete().eq('user_id', user.id)
      if (me) throw me
      qc.invalidateQueries()
      toast.success('All data cleared')
      setConfirm(null)
    } catch {
      toast.error('Failed to clear data')
    } finally {
      setResetting(false)
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
            className="fixed right-0 top-0 bottom-0 z-50 w-[360px] bg-card border-l border-[rgba(255,255,255,0.08)] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Settings size={15} className="text-primary-400" />
                <span className="font-semibold text-sm text-text-primary">Settings</span>
              </div>
              <button onClick={onClose}
                className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-elevated transition-colors">
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Session info */}
              <section>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Session</h3>
                <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-lg p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Type</span>
                    <span className="text-xs font-medium text-text-secondary px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)]">
                      Anonymous (Guest)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Session ID</span>
                    <span className="text-[10px] font-mono text-text-muted select-all">{user?.id?.slice(0, 16)}…</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Persistence</span>
                    <span className="text-xs text-green-400">Supabase (per session)</span>
                  </div>
                </div>
              </section>

              {/* Danger zone */}
              <section>
                <h3 className="text-xs font-semibold text-red-400/70 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <AlertTriangle size={11} /> Danger zone
                </h3>
                <div className="border border-red-500/20 rounded-lg divide-y divide-red-500/10">
                  {/* Reset tasks only */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Reset board</p>
                      <p className="text-xs text-text-muted mt-0.5">Delete all tasks. Team members and labels are kept.</p>
                    </div>
                    {confirm !== 'tasks' ? (
                      <button
                        onClick={() => setConfirm('tasks')}
                        className="h-8 px-3 border border-red-500/30 text-red-400 text-xs rounded-md hover:bg-red-500/10 transition-colors"
                      >
                        Reset board…
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={resetTasks}
                          disabled={resetting}
                          className="h-8 px-3 bg-red-500/80 hover:bg-red-500 text-white text-xs rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Trash2 size={12} />
                          {resetting ? 'Resetting…' : 'Confirm reset'}
                        </button>
                        <button onClick={() => setConfirm(null)}
                          className="h-8 px-3 border border-border text-text-secondary text-xs rounded-md hover:bg-elevated transition-colors">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Clear everything */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Clear all data</p>
                      <p className="text-xs text-text-muted mt-0.5">Delete tasks, comments, activity, labels, and team members. Cannot be undone.</p>
                    </div>
                    {confirm !== 'everything' ? (
                      <button
                        onClick={() => setConfirm('everything')}
                        className="h-8 px-3 border border-red-500/40 text-red-400 text-xs rounded-md hover:bg-red-500/10 transition-colors font-medium"
                      >
                        Clear everything…
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={resetEverything}
                          disabled={resetting}
                          className="h-8 px-3 bg-red-600 hover:bg-red-500 text-white text-xs rounded-md font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Trash2 size={12} />
                          {resetting ? 'Clearing…' : 'Yes, clear all'}
                        </button>
                        <button onClick={() => setConfirm(null)}
                          className="h-8 px-3 border border-border text-text-secondary text-xs rounded-md hover:bg-elevated transition-colors">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* SQL Schema export */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                    <Database size={11} /> Schema
                  </h3>
                  <CopyButton text={SQL_SCHEMA} />
                </div>
                <div className="bg-[#090B12] border border-[rgba(255,255,255,0.07)] rounded-lg overflow-hidden">
                  <pre className="p-3 text-[9px] leading-[1.6] font-mono text-text-muted overflow-x-auto overflow-y-auto max-h-64 whitespace-pre select-all">
                    {SQL_SCHEMA}
                  </pre>
                </div>
                <p className="text-[10px] text-text-muted mt-2">
                  Run this in your Supabase SQL editor to set up all tables and RLS policies.
                </p>
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
