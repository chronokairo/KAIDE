'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'chronokairo_harness_mode';

interface HarnessModeContextType {
  isHarnessMode: boolean;
  enterHarnessMode: () => void;
  exitHarnessMode: () => void;
  toggleHarnessMode: () => void;
}

const HarnessModeContext = createContext<HarnessModeContextType>({
  isHarnessMode: false,
  enterHarnessMode: () => {},
  exitHarnessMode: () => {},
  toggleHarnessMode: () => {},
});

export const HarnessModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHarnessModeState, setIsHarnessModeState] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'true') setIsHarnessModeState(true);
    } catch {
      // SSR ignore
    }
  }, []);

  const enterHarnessMode = useCallback(() => {
    setIsHarnessModeState(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  const exitHarnessMode = useCallback(() => {
    setIsHarnessModeState(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const toggleHarnessMode = useCallback(() => {
    setIsHarnessModeState((prev) => {
      const next = !prev;
      try {
        if (next) localStorage.setItem(STORAGE_KEY, 'true');
        else localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const isHarnessMode = isHarnessModeState || (pathname != null && pathname.startsWith('/dev'));

  return (
    <HarnessModeContext.Provider value={{ isHarnessMode, enterHarnessMode, exitHarnessMode, toggleHarnessMode }}>
      {children}
    </HarnessModeContext.Provider>
  );
};

export const useHarnessMode = () => useContext(HarnessModeContext);
