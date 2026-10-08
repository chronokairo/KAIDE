"use client";

// Vendirado de @chronokairo/platform/ui (removido como dependência).
// Cópia fiel de ThemeProvider + useTheme + ThemeToggle. Ponto estável:
// `@/shared/components/ui/theme`. Chave de storage preservada
// (`chronokairo-pantone-theme`) para não resetar o tema de quem já usa.
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("chronokairo-pantone-theme") as Theme | null;
    const initial = saved || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    setThemeState(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("chronokairo-pantone-theme", newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <div className={theme} style={{ minHeight: "100vh" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`w-9 h-9 rounded-xl border transition-all flex items-center justify-center ${
        theme === "dark"
          ? "bg-[#121212] border-[#262626] text-white hover:bg-[#1a1a1a] shadow-xs"
          : "bg-[#f4f4f5] border-[#e4e4e7] text-black hover:bg-[#e4e4e7] shadow-xs"
      } ${className}`}
      title={theme === "dark" ? "Mudar para Tema Claro (Branco Pantone)" : "Mudar para Tema Escuro (Preto Pantone)"}
      aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      <span className="material-symbols-outlined text-base">
        {theme === "dark" ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
};
