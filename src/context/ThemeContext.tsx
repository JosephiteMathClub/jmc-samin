"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type HighContrastTheme = "default" | "contrast-dark" | "contrast-light" | "terminal-amber";

interface ThemeContextType {
  theme: HighContrastTheme;
  setTheme: (theme: HighContrastTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<HighContrastTheme>("default");

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("jmc_accessibility_theme") as HighContrastTheme;
      if (savedTheme && ["default", "contrast-dark", "contrast-light", "terminal-amber"].includes(savedTheme)) {
        setThemeState(savedTheme);
        applyTheme(savedTheme);
      }
    }
  }, []);

  const applyTheme = (t: HighContrastTheme) => {
    if (typeof document === "undefined") return;
    
    // Remove all old custom theme classes
    document.body.classList.remove("theme-contrast-dark", "theme-contrast-light", "theme-contrast-amber");
    
    // Apply new theme class if not default
    if (t === "contrast-dark") {
      document.body.classList.add("theme-contrast-dark");
    } else if (t === "contrast-light") {
      document.body.classList.add("theme-contrast-light");
    } else if (t === "terminal-amber") {
      document.body.classList.add("theme-contrast-amber");
    }
  };

  const setTheme = (newTheme: HighContrastTheme) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("jmc_accessibility_theme", newTheme);
    }
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
