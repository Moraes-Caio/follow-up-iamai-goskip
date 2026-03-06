import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type InvitationRow = Database['public']['Tables']['workspace_invitations']['Row'];

export type { InvitationRow };

export function useInvitations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['workspace_invitations', user?.id],
    queryFn: async (): Promise<InvitationRow[]> => {
      const { data, error } = await supabase
        .from('workspace_invitations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const sendInvite = useMutation({
    mutationFn: async (params: { email: string; roleId: string; invitedByName: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if email belongs to an existing team member
      const { data: existingMembers } = await supabase
        .from('team_members')
        .select('id, full_name, email')
        .ilike('email', params.email)
        .eq('is_active', true);

      if (existingMembers && existingMembers.length > 0) {
        throw new Error(`O email "${params.email}" já pertence a um membro da equipe (${existingMembers[0].full_name}).`);
      }

      // Check if there's already a pending invite for this email
      const { data: existing } = await supabase
        .from('workspace_invitations')
        .select('id')
        .eq('email', params.email)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        throw new Error('Já existe um convite pendente para este email.');
      }

      // Create invitation record
      const { data: invitation, error } = await supabase
        .from('workspace_invitations')
        .insert({
          email: params.email,
          role_id: params.roleId,
          invited_by: user.id,
          invited_by_name: params.invitedByName,
          profile_id: user.id, // workspace owner
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Call edge function to send email (mock for now)
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('send-invite', {
        body: {
          invitationId: invitation.id,
          email: params.email,
          token: invitation.token,
          invitedByName: params.invitedByName,
        },
      });

      if (response.error) {
        console.warn('Email sending failed (mock):', response.error);
        // Don't throw - invitation was created, email is just mock
      }

      // Add to team_members with is_owner=false, user_id=null (first login indicator)
      await supabase
        .from('team_members')
        .insert({
          profile_id: user.id,
          full_name: '',
          email: params.email,
          role_id: params.roleId,
          is_owner: false,
          is_active: true,
          user_id: null,
        } as any);

      return invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace_invitations'] });
      queryClient.invalidateQueries({ queryKey: ['team_members'] });
    },
  });

  const cancelInvite = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('workspace_invitations')
        .delete()
        .eq('id', invitationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace_invitations'] });
    },
  });

  const resendInvite = useMutation({
    mutationFn: async (invitationId: string) => {
      // Reset expiration and re-trigger email
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);

      const { data: invitation, error } = await supabase
        .from('workspace_invitations')
        .update({
          expires_at: newExpiry.toISOString(),
          status: 'pending',
        })
        .eq('id', invitationId)
        .select()
        .single();

      if (error) throw error;

      // Mock email send
      await supabase.functions.invoke('send-invite', {
        body: {
          invitationId: invitation.id,
          email: invitation.email,
          token: invitation.token,
          invitedByName: invitation.invited_by_name || 'Equipe',
        },
      });

      return invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace_invitations'] });
    },
  });

  const pendingInvitations = (query.data || []).filter(i => i.status === 'pending');
  const allInvitations = (query.data || []).filter(i => i.status === 'pending');

  return {
    invitations: allInvitations,
    pendingInvitations,
    isLoading: query.isLoading,
    sendInvite: sendInvite.mutateAsync,
    isSending: sendInvite.isPending,
    cancelInvite: cancelInvite.mutateAsync,
    resendInvite: resendInvite.mutateAsync,
  };
}
