"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface LayoutPanelsContextType {
  isLeftSidebarOpen: boolean;
  toggleLeftSidebar: () => void;
  setLeftSidebarOpen: (open: boolean) => void;
  isRightSidebarOpen: boolean;
  toggleRightSidebar: () => void;
  setRightSidebarOpen: (open: boolean) => void;
  isBottomTerminalOpen: boolean;
  toggleBottomTerminal: () => void;
  setBottomTerminalOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  activeNavTab: string;
  setActiveNavTab: (tab: string) => void;
}

const LayoutPanelsContext = createContext<LayoutPanelsContextType | null>(null);

export const LayoutPanelsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLeftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [isBottomTerminalOpen, setBottomTerminalOpen] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState('chat');

  const toggleLeftSidebar = useCallback(() => setLeftSidebarOpen((prev) => !prev), []);
  const toggleRightSidebar = useCallback(() => setRightSidebarOpen((prev) => !prev), []);
  const toggleBottomTerminal = useCallback(() => setBottomTerminalOpen((prev) => !prev), []);
  const toggleCommandPalette = useCallback(() => setCommandPaletteOpen((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // Ctrl+` or Cmd+` toggles terminal (never on typing in input or accidental quotes)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === '`' || e.code === 'Backquote') && !isInput) {
        e.preventDefault();
        setBottomTerminalOpen((prev) => !prev);
      }
      // Ctrl+B or Cmd+B toggles sidebar
      if ((e.ctrlKey || e.metaKey) && !isInput && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setLeftSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <LayoutPanelsContext.Provider
      value={{
        isLeftSidebarOpen,
        toggleLeftSidebar,
        setLeftSidebarOpen,
        isRightSidebarOpen,
        toggleRightSidebar,
        setRightSidebarOpen,
        isBottomTerminalOpen,
        toggleBottomTerminal,
        setBottomTerminalOpen,
        isCommandPaletteOpen,
        setCommandPaletteOpen,
        toggleCommandPalette,
        activeNavTab,
        setActiveNavTab,
      }}
    >
      {children}
    </LayoutPanelsContext.Provider>
  );
};

export const useLayoutPanels = () => {
  const context = useContext(LayoutPanelsContext);
  if (!context) {
    return {
      isLeftSidebarOpen: true,
      toggleLeftSidebar: () => {},
      setLeftSidebarOpen: () => {},
      isRightSidebarOpen: false,
      toggleRightSidebar: () => {},
      setRightSidebarOpen: () => {},
      isBottomTerminalOpen: false,
      toggleBottomTerminal: () => {},
      setBottomTerminalOpen: () => {},
      isCommandPaletteOpen: false,
      setCommandPaletteOpen: () => {},
      toggleCommandPalette: () => {},
      activeNavTab: 'chat',
      setActiveNavTab: () => {},
    };
  }
  return context;
};
