# FlowBoard — Kanban Task Manager

FlowBoard is a production-grade Kanban board built for the Next Play Games engineering assessment. It uses React 19 + Vite on the frontend, Supabase for PostgreSQL persistence and anonymous authentication, @tanstack/react-query for server-state management, and @dnd-kit for drag-and-drop. Every change—task creation, column moves, edits, comments—is persisted to Supabase in real time, and Row Level Security ensures each anonymous session has a completely isolated board with no shared data between users.

**Live URL:** https://your-deployment.vercel.app  
**GitHub:** https://github.com/your-username/your-repo

---

## Local Setup

### 1. Clone and install
```bash
git clone <repo-url>
cd kanban-app
npm install
```

### 2. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) and create a new free project
2. In **Authentication → Providers**, enable **Anonymous sign-in**
3. In the **SQL Editor**, run the schema below

### 3. Run the SQL schema

```sql
-- =============================================
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

-- Row Level Security
alter table public.team_members  enable row level security;
alter table public.labels        enable row level security;
alter table public.tasks         enable row level security;
alter table public.task_labels   enable row level security;
alter table public.comments      enable row level security;
alter table public.activity_log  enable row level security;

create policy "Users manage own members"
  on public.team_members for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own labels"
  on public.labels for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own tasks"
  on public.tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own task_labels"
  on public.task_labels for all
  using (exists (
    select 1 from public.tasks
    where id = task_labels.task_id and user_id = auth.uid()
  ));

create policy "Users manage own comments"
  on public.comments for all
  using (exists (
    select 1 from public.tasks
    where id = comments.task_id and user_id = auth.uid()
  ));

create policy "Users manage own activity"
  on public.activity_log for all
  using (exists (
    select 1 from public.tasks
    where id = activity_log.task_id and user_id = auth.uid()
  ));
```

### 4. Add environment variables

Create `.env.local` in `kanban-app/` (already gitignored):
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both values are in **Supabase → Project Settings → API**.

### 5. Run the app
```bash
npm run dev
```
Open `http://localhost:5173`

---

## Deployment (Vercel)

1. Push this repo to GitHub (public)
2. Connect to Vercel → set root directory to `kanban-app`
3. Add environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

**Never commit `.env.local` — it is already in `.gitignore`.**

---

## Advanced Features

| Feature | How it works |
|---|---|
| **Team Members** | Stored in `team_members` per user; add/remove from the Team panel; auto-assigned color from an 8-color palette; avatar initials computed from name |
| **Labels / Tags** | Stored in `labels` with a hex color; linked to tasks via `task_labels` join table; multi-select per task; filterable from the board header |
| **Comments** | Per-task comments stored in `comments`; loaded in the detail panel via `useComments(taskId)`; supports add and delete |
| **Activity Log** | Every status change, field edit, and assignee change writes to `activity_log` with structured `metadata` JSON; rendered with icons and relative timestamps |
| **Due Date Indicators** | Color-coded badges: red (overdue), amber (today), yellow (≤3 days), neutral (future); midnight normalization prevents UTC timezone off-by-one errors |
| **Search & Filtering** | Real-time title search (⌘K shortcut); filter chips for priority, label, and assignee; active filters shown as dismissible chips |
| **Board Summary Stats** | Header shows total, done, and overdue counts with a sprint progress bar; values animate with an ease-out cubic RAF loop via `useCountUp()` |
| **Drag & Drop** | Cross-column and same-column reordering via @dnd-kit; `position` float written to Supabase on drop; optimistic local state prevents UI flicker |
| **Skeleton Loading** | Per-column skeleton cards shown while the initial query loads |
| **Error State** | Full-board error UI with a Retry button when the Supabase query fails |
| **Settings Panel** | Reset board (tasks only) or clear all data; SQL schema export with one-click copy |

---

## Tradeoffs & What I'd Improve With More Time

**Real-time multi-user sync** — Currently each session polls on mount and after mutations. Supabase supports `channel().on('postgres_changes')` subscriptions that would push updates to all connected clients instantly. Skipped because the spec targets a single-user anonymous session, but adding it would be straightforward.

**Optimistic UI for comments** — Task edits and drag-and-drop use local optimistic state before the server responds. Comments wait for the server before appearing. The fix follows the same pattern `createTask` already uses: generate a temp ID, insert into cache, replace on success.

**Persistent user accounts** — Anonymous sessions survive browser refresh (Supabase stores the JWT in localStorage) but are lost if the user clears storage or switches browsers. Replacing anonymous auth with email/OAuth would give users a permanent board across devices.

**Backend API layer** — Activity log writes happen on the client today, which means a slow network or tab close can silently drop an event. A lightweight server (Go or Edge Functions) that handles mutations and writes activity atomically in a transaction would make the log reliable.

**Fractional indexing** — Task positions use integer indices that require renumbering the whole column on insert. True fractional indexing (midpoint splits between floats) would eliminate those bulk updates entirely.

**End-to-end tests** — No Playwright tests exist. The drag-and-drop and cross-column move flows are the highest-value targets since they touch both optimistic UI state and the Supabase write path simultaneously.

**Keyboard navigation** — `C` creates a task and ⌘K focuses search, but the board is otherwise mouse-driven. Arrow keys to move between tasks, Enter to open detail, and `d` to mark done would significantly improve the power-user experience.
