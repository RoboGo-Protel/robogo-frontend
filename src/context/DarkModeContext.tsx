"use client";

import { createContext, useContext, useEffect, useState } from "react";

type DarkModeContextType = {
  isDark: boolean;
  toggleDark: () => void;
};

const DarkModeContext = createContext<DarkModeContextType | undefined>(
  undefined
);

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");

    if (saved === null) {
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    } else {
      setIsDark(saved === "dark");
    }
  }, []);

  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <DarkModeContext.Provider value={{ isDark, toggleDark }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const ctx = useContext(DarkModeContext);
  if (!ctx) throw new Error("useDarkMode must be used within DarkModeProvider");
  return ctx;
}
