import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type MessageRow = Database['public']['Tables']['messages']['Row'];

export type { MessageRow };

export function useMessages() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: async (): Promise<MessageRow[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('sent_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  return {
    messages: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
