"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

export default function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) {
      setTheme(saved);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      const fallback: Theme = prefersDark ? "dark" : "light";
      setTheme(fallback);
      localStorage.setItem("theme", fallback);
    }

    const handleThemeChange = () => {
      const updated = localStorage.getItem("theme") as Theme;
      setTheme(updated);
    };

    window.addEventListener("theme-change", handleThemeChange);
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const newTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    window.dispatchEvent(new Event("theme-change"));
  };

  return [theme, toggleTheme];
}
