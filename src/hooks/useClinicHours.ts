import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/hooks/useWorkspace';
import type { ClinicHoursConfig } from '@/components/appointments/AppointmentTimePicker';

export interface ClinicHourRow {
  id: string;
  profile_id: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export interface ClinicBreakRow {
  id: string;
  profile_id: string;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  label: string;
}

export interface ClinicExtraSessionRow {
  id: string;
  profile_id: string;
  date: string;
  open_time: string;
  close_time: string;
  label: string;
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function getDayName(day: number) {
  return DAY_NAMES[day] || '';
}

export function useClinicHours() {
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();
  const [hours, setHours] = useState<ClinicHourRow[]>([]);
  const [breaks, setBreaks] = useState<ClinicBreakRow[]>([]);
  const [extraSessions, setExtraSessions] = useState<ClinicExtraSessionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const profileId = workspaceId || user?.id;

  const fetchAll = useCallback(async () => {
    if (!profileId) return;
    setIsLoading(true);
    try {
      const [hRes, bRes, eRes] = await Promise.all([
        supabase.from('clinic_hours').select('*').order('day_of_week'),
        supabase.from('clinic_breaks').select('*').order('created_at'),
        supabase.from('clinic_extra_sessions').select('*').order('date'),
      ]);
      if (hRes.data) setHours(hRes.data as unknown as ClinicHourRow[]);
      if (bRes.data) setBreaks(bRes.data as unknown as ClinicBreakRow[]);
      if (eRes.data) setExtraSessions(eRes.data as unknown as ClinicExtraSessionRow[]);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveClinicHours = useCallback(async (updatedHours: ClinicHourRow[]) => {
    if (!profileId) return;
    for (const h of updatedHours) {
      await supabase.from('clinic_hours').update({
        is_open: h.is_open,
        open_time: h.open_time,
        close_time: h.close_time,
      } as any).eq('id', h.id);
    }
    await fetchAll();
  }, [profileId, fetchAll]);

  const initializeDefaultHours = useCallback(async () => {
    if (!profileId || hours.length > 0) return;
    const defaults = Array.from({ length: 7 }, (_, i) => ({
      profile_id: profileId,
      day_of_week: i,
      is_open: i >= 1 && i <= 5,
      open_time: '08:00',
      close_time: '18:00',
    }));
    await supabase.from('clinic_hours').insert(defaults as any);
    await fetchAll();
  }, [profileId, hours.length, fetchAll]);

  useEffect(() => {
    if (!isLoading && hours.length === 0 && profileId) {
      initializeDefaultHours();
    }
  }, [isLoading, hours.length, profileId, initializeDefaultHours]);

  const addBreak = useCallback(async (brk: { day_of_week: number | null; start_time: string; end_time: string; label: string }) => {
    if (!profileId) return;
    await supabase.from('clinic_breaks').insert({ ...brk, profile_id: profileId } as any);
    await fetchAll();
  }, [profileId, fetchAll]);

  const deleteBreak = useCallback(async (id: string) => {
    await supabase.from('clinic_breaks').delete().eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const addExtraSession = useCallback(async (session: { date: string; open_time: string; close_time: string; label: string }) => {
    if (!profileId) return;
    await supabase.from('clinic_extra_sessions').insert({ ...session, profile_id: profileId } as any);
    await fetchAll();
  }, [profileId, fetchAll]);

  const deleteExtraSession = useCallback(async (id: string) => {
    await supabase.from('clinic_extra_sessions').delete().eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const getClinicHoursForDate = useCallback((date: Date): ClinicHoursConfig => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Check extra sessions first (priority)
    const extra = extraSessions.find(s => s.date === dateStr);
    if (extra) {
      const applicableBreaks = breaks.filter(b => b.day_of_week === null || b.day_of_week === date.getDay());
      return {
        isOpen: true,
        openTime: extra.open_time,
        closeTime: extra.close_time,
        breaks: applicableBreaks.map(b => ({ startTime: b.start_time, endTime: b.end_time })),
      };
    }

    // Standard day of week
    const dayConfig = hours.find(h => h.day_of_week === date.getDay());
    if (!dayConfig || !dayConfig.is_open) {
      return { isOpen: false };
    }

    const applicableBreaks = breaks.filter(b => b.day_of_week === null || b.day_of_week === date.getDay());
    return {
      isOpen: true,
      openTime: dayConfig.open_time,
      closeTime: dayConfig.close_time,
      breaks: applicableBreaks.map(b => ({ startTime: b.start_time, endTime: b.end_time })),
    };
  }, [hours, breaks, extraSessions]);

  return {
    hours, breaks, extraSessions, isLoading,
    saveClinicHours, addBreak, deleteBreak,
    addExtraSession, deleteExtraSession,
    getClinicHoursForDate, refetch: fetchAll,
  };
}
