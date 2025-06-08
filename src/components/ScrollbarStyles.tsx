"use client";

import { useDarkMode } from "@/context/DarkModeContext";

export default function ScrollbarStyles() {
  const { isDark } = useDarkMode();

  const scrollbarStyle = `
    ::-webkit-scrollbar {
      width: 8px;
      background-color: ${isDark ? '#1D7C9F' : '#D9D9D9'};
      border-radius: 10px;
    }    ::-webkit-scrollbar-thumb {
      background-color: ${isDark ? '#3b82f6' : '#60a5fa'};
      border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background-color: ${isDark ? '#60a5fa' : '#3b82f6'};
    }
  `;

  return <style>{scrollbarStyle}</style>;
}