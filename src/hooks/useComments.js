import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useComments(taskId) {
  const qc = useQueryClient()
  const { user } = useAuth()

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at')
      if (error) throw error
      return data
    },
    enabled: !!taskId && !!user,
  })

  const addMutation = useMutation({
    mutationFn: async (body) => {
      const { data, error } = await supabase
        .from('comments')
        .insert({ task_id: taskId, user_id: user.id, body })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', taskId] }),
    onError: () => toast.error('Failed to post comment'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (commentId) => {
      const { error } = await supabase.from('comments').delete().eq('id', commentId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', taskId] }),
    onError: () => toast.error('Failed to delete comment'),
  })

  return {
    comments,
    addComment:    addMutation.mutateAsync,
    deleteComment: deleteMutation.mutateAsync,
  }
}
