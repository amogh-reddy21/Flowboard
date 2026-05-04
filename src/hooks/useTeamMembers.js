import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

const MEMBER_COLORS = [
  '#7C3AED', '#3B82F6', '#22C55E', '#F97316',
  '#EC4899', '#EAB308', '#06B6D4', '#F87171',
]

export function useTeamMembers() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const { members } = useData()

  const addMemberMutation = useMutation({
    mutationFn: async ({ name }) => {
      const color = MEMBER_COLORS[members.length % MEMBER_COLORS.length]
      const { data, error } = await supabase
        .from('team_members')
        .insert({ name: name.trim(), color, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team_members'] })
      toast.success('Member added')
    },
    onError: () => toast.error('Failed to add member'),
  })

  const deleteMemberMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('team_members').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team_members'] }),
    onError: () => toast.error('Failed to remove member'),
  })

  return {
    members,
    addMember:    addMemberMutation.mutateAsync,
    deleteMember: deleteMemberMutation.mutateAsync,
    isAdding:     addMemberMutation.isPending,
  }
}
