'use client';

// Vendirado de @chronokairo/platform/auth (removido como dependência).
// Cópia fiel do contexto + hook; o cliente platform (createPlatformClient) foi
// trocado pelo cliente browser próprio do app (`@/shared/supabase`).
// Ponto estável: `@/shared/auth/session`.
// NOTA: nenhum provider está montado hoje (igual ao platform), então `session`
// segue `null` até que o SessionProvider seja montado no shell do app.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/shared/supabase';

export interface SessionContextValue {
  session: any | null;
  loading: boolean;
  setSession: (session: any | null) => void;
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  loading: false,
  setSession: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const setSession = (newSession: any | null) => {
    setSessionState(newSession);
  };

  useEffect(() => {
    let active = true;
    // A sessão só é aceita depois de carregada pelo cliente oficial Supabase.
    try {
      const loadValidatedSession = async () => {
        const [{ data: sessionData }, { data: userData, error: userError }] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
        ]);
        if (!active) return;
        const session = sessionData.session;
        setSessionState(!userError && userData.user && session?.user.id === userData.user.id ? session : null);
        setLoading(false);
      };

      loadValidatedSession().catch(() => {
        if (active) {
          setSessionState(null);
          setLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
          setSessionState(null);
          return;
        }
        void loadValidatedSession();
      });

      return () => {
        active = false;
        subscription.unsubscribe();
      };
    } catch {
      setLoading(false);
    }
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading, setSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  return useContext(SessionContext);
}

export function useSession() {
  return useSessionContext();
}
