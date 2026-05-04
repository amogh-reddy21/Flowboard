import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULT_MEMBERS = [
  { name: 'Amogh Reddy',   color: '#7C3AED' },
  { name: 'Jamie Liu',     color: '#3B82F6' },
  { name: 'Sara Kim',      color: '#22C55E' },
  { name: 'Marcus Torres', color: '#F97316' },
  { name: 'Elena Park',    color: '#EC4899' },
]

const DEFAULT_LABELS = [
  { name: 'Frontend', color: '#3B82F6' },
  { name: 'Backend',  color: '#22C55E' },
  { name: 'Design',   color: '#EC4899' },
  { name: 'Bug',      color: '#EF4444' },
  { name: 'Feature',  color: '#A78BFA' },
  { name: 'Docs',     color: '#EAB308' },
  { name: 'Infra',    color: '#F97316' },
  { name: 'Perf',     color: '#14B8A6' },
]

const AuthContext = createContext(null)

async function seedDefaults(userId) {
  const { data: existing } = await supabase.from('team_members').select('id').limit(1)
  if (existing?.length > 0) return

  await supabase.from('team_members').insert(
    DEFAULT_MEMBERS.map(m => ({ ...m, user_id: userId }))
  )
  await supabase.from('labels').insert(
    DEFAULT_LABELS.map(l => ({ ...l, user_id: userId }))
  )
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const seeded = useRef(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      supabase.auth.signInAnonymously().then(({ data }) => {
        if (data?.user && !seeded.current) {
          seeded.current = true
          seedDefaults(data.user.id)
        }
      })
    }
    if (!loading && user && !seeded.current) {
      seeded.current = true
      seedDefaults(user.id)
    }
  }, [loading, user])

  if (loading) {
    return (
      <div style={{
        background: '#0D0D0F', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ color: '#8A8A8F', fontFamily: 'monospace', fontSize: '13px' }}>
          Initializing…
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
