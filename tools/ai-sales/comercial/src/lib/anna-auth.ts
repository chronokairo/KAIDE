'use client';

import { useEffect, useState } from 'react';

export const ANNA_AUTH_STORAGE_KEY = 'anna:auth-state';

export interface AnnaAuthState {
  isAuthenticated: boolean;
  displayName: string;
  email: string;
  cpf: string;
  age: string;
  updatedAt: string;
}

export const EMPTY_ANNA_AUTH: AnnaAuthState = {
  isAuthenticated: false,
  displayName: '',
  email: '',
  cpf: '',
  age: '',
  updatedAt: '',
};

export function loadAnnaAuth(): AnnaAuthState {
  if (typeof window === 'undefined') return EMPTY_ANNA_AUTH;

  try {
    const raw = localStorage.getItem(ANNA_AUTH_STORAGE_KEY);
    if (!raw) return EMPTY_ANNA_AUTH;
    const parsed = JSON.parse(raw) as Partial<AnnaAuthState>;
    return {
      isAuthenticated: !!parsed.isAuthenticated,
      displayName: parsed.displayName ?? '',
      email: parsed.email ?? '',
      cpf: parsed.cpf ?? '',
      age: parsed.age ?? '',
      updatedAt: parsed.updatedAt ?? '',
    };
  } catch {
    return EMPTY_ANNA_AUTH;
  }
}

export function saveAnnaAuth(auth: Omit<AnnaAuthState, 'updatedAt'>) {
  if (typeof window === 'undefined') return;

  const next: AnnaAuthState = {
    ...auth,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(ANNA_AUTH_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new StorageEvent('storage', { key: ANNA_AUTH_STORAGE_KEY }));
}

export function clearAnnaAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ANNA_AUTH_STORAGE_KEY);
  window.dispatchEvent(new StorageEvent('storage', { key: ANNA_AUTH_STORAGE_KEY }));
}

export function useAnnaAuth() {
  const [auth, setAuth] = useState<AnnaAuthState>(EMPTY_ANNA_AUTH);

  useEffect(() => {
    const sync = () => setAuth(loadAnnaAuth());
    sync();

    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);

    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  return {
    auth,
    refreshAuth: () => setAuth(loadAnnaAuth()),
    login: (next: Omit<AnnaAuthState, 'updatedAt'>) => {
      saveAnnaAuth(next);
      setAuth(loadAnnaAuth());
    },
    logout: () => {
      clearAnnaAuth();
      setAuth(EMPTY_ANNA_AUTH);
    },
  };
}
