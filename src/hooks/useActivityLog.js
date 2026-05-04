import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useActivityLog(taskId) {
  const { user } = useAuth()

  const { data: activity = [] } = useQuery({
    queryKey: ['activity', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at')
      if (error) throw error
      return data
    },
    enabled: !!taskId && !!user,
  })

  return { activity }
}
