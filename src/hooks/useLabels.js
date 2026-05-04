import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

export function useLabels() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const { labels } = useData()

  const addLabelMutation = useMutation({
    mutationFn: async ({ name, color }) => {
      const { data, error } = await supabase
        .from('labels')
        .insert({ name: name.trim(), color, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labels'] })
      toast.success('Label added')
    },
    onError: () => toast.error('Failed to add label'),
  })

  const deleteLabelMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('labels').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labels'] }),
    onError: () => toast.error('Failed to delete label'),
  })

  return {
    labels,
    addLabel:    addLabelMutation.mutateAsync,
    deleteLabel: deleteLabelMutation.mutateAsync,
    isAdding:    addLabelMutation.isPending,
  }
}
