import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  clinicName: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string; onboardingCompleted?: boolean }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingCompleted: boolean | null;
  refreshOnboarding: () => Promise<void>;
  sessionConflict: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || '',
    clinicName: supabaseUser.user_metadata?.clinic_name || '',
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [sessionConflict, setSessionConflict] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loginFetchedRef = useRef(false);

  // Returns the onboarding status, or null if it couldn't be determined
  const fetchOnboardingStatus = async (userId: string): Promise<boolean | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching onboarding status:', error);
      return null; // unknown — don't overwrite existing state
    }
    if (!data) {
      return null; // no row found — don't overwrite
    }
    return data.onboarding_completed ?? false;
  };

  // Safe setter: never overwrite true with null (unknown)
  const safeSetOnboarding = useCallback((value: boolean | null) => {
    setOnboardingCompleted(prev => {
      if (value === null) return prev; // unknown → keep current
      return value;
    });
  }, []);

  const refreshOnboarding = useCallback(async () => {
    if (user?.id) {
      const status = await fetchOnboardingStatus(user.id);
      safeSetOnboarding(status);
    }
  }, [user?.id, safeSetOnboarding]);

  // Session token verification interval
  const startSessionCheck = useCallback((userId: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      const localToken = localStorage.getItem('session_token');
      if (!localToken) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('session_token')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) return;

      if (data.session_token !== localToken) {
        setSessionConflict(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        await supabase.auth.signOut();
        localStorage.removeItem('session_token');
        localStorage.removeItem('followup-storage');
      }
    }, 30000);
  }, []);

  const stopSessionCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Listener for ONGOING auth changes — only sync session/user.
    // Onboarding fetch is delegated: skip if login already fetched it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        setUser(newSession?.user ? mapUser(newSession.user) : null);

        if (newSession?.user) {
          // Mark session active for OAuth logins (login() does this for password auth)
          sessionStorage.setItem('followup_session_active', 'true');
          if (loginFetchedRef.current) {
            // login() already set the correct onboarding value — skip re-fetch
            loginFetchedRef.current = false;
          } else {
            // Page reload or token refresh — fetch onboarding
            fetchOnboardingStatus(newSession.user.id).then(status => {
              if (isMounted) safeSetOnboarding(status);
            });
          }
        } else {
          setOnboardingCompleted(null);
          stopSessionCheck();
        }
      }
    );

    // INITIAL load — controls isLoading
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        // If user didn't check "remember me" and this is a new browser session, sign out
        if (currentSession?.user) {
          // Se voltando de OAuth callback, não fazer sign-out
          if (window.location.pathname === '/auth/callback') {
            setSession(currentSession);
            setUser(currentSession?.user ? mapUser(currentSession.user) : null);
            if (currentSession?.user) {
              const status = await fetchOnboardingStatus(currentSession.user.id);
              if (isMounted) safeSetOnboarding(status);
            }
            if (isMounted) setIsLoading(false);
            return;
          }
          const rememberMe = localStorage.getItem('followup_remember');
          const sessionActive = sessionStorage.getItem('followup_session_active');
          if (rememberMe !== 'true' && !sessionActive) {
            // Session from previous browser session without "remember me" → sign out
            await supabase.auth.signOut();
            localStorage.removeItem('session_token');
            localStorage.removeItem('followup-storage');
            if (isMounted) {
              setSession(null);
              setUser(null);
              setOnboardingCompleted(null);
              setIsLoading(false);
            }
            return;
          }
        }

        setSession(currentSession);
        setUser(currentSession?.user ? mapUser(currentSession.user) : null);

        if (currentSession?.user) {
          const status = await fetchOnboardingStatus(currentSession.user.id);
          if (isMounted) {
            safeSetOnboarding(status);
            if (localStorage.getItem('session_token')) {
              startSessionCheck(currentSession.user.id);
            }
          }
        } else {
          if (isMounted) setOnboardingCompleted(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      stopSessionCheck();
    };
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe?: boolean) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: error.message };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('ativo, nome_clinica, full_name, onboarding_completed')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return { success: false, error: 'Erro ao carregar perfil. Entre em contato com o suporte.' };
    }

    if (!profile.ativo) {
      await supabase.auth.signOut();
      return { success: false, error: 'Sua conta está desativada. Entre em contato com o suporte.' };
    }

    // Handle "remember me"
    if (rememberMe) {
      localStorage.setItem('followup_remember', 'true');
    } else {
      localStorage.removeItem('followup_remember');
    }
    sessionStorage.setItem('followup_session_active', 'true');

    // Generate and save session token
    const token = crypto.randomUUID();
    await supabase
      .from('profiles')
      .update({ session_token: token } as any)
      .eq('id', data.user.id);
    localStorage.setItem('session_token', token);

    startSessionCheck(data.user.id);

    const onboarding = profile.onboarding_completed ?? false;
    setOnboardingCompleted(onboarding);
    loginFetchedRef.current = true; // prevent onAuthStateChange from overwriting

    return { success: true, onboardingCompleted: onboarding };
  }, [startSessionCheck]);

  const logout = useCallback(async () => {
    stopSessionCheck();

    if (user?.id) {
      await supabase
        .from('profiles')
        .update({ session_token: null } as any)
        .eq('id', user.id);
    }

    await supabase.auth.signOut();
    localStorage.removeItem('session_token');
    localStorage.removeItem('followup-storage');
  }, [user?.id, stopSessionCheck]);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, login, logout, resetPassword,
      isAuthenticated: !!session, isLoading,
      onboardingCompleted, refreshOnboarding,
      sessionConflict,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
