import { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user } = useAuth()

  const { data: members = [] } = useQuery({
    queryKey: ['team_members'],
    queryFn: async () => {
      const { data, error } = await supabase.from('team_members').select('*').order('created_at')
      if (error) throw error
      return data.map(m => ({
        ...m,
        initials: m.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      }))
    },
    enabled: !!user,
  })

  const { data: labels = [] } = useQuery({
    queryKey: ['labels'],
    queryFn: async () => {
      const { data, error } = await supabase.from('labels').select('*').order('name')
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  return (
    <DataContext.Provider value={{ members, labels }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
