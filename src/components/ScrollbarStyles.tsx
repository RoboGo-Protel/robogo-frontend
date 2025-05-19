"use client";

import { useDarkMode } from "@/context/DarkModeContext";

export default function ScrollbarStyles() {
  const { isDark } = useDarkMode();

  const scrollbarStyle = `
    ::-webkit-scrollbar {
      width: 8px;
      background-color: ${isDark ? "#1D7C9F" : "#D9D9D9"};
      border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb {
      background-color: ${isDark ? "#3BD5FF" : "#367AF2"};
      border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background-color: ${isDark ? "#367AF2" : "#3BD5FF"};
    }
  `;

  return <style>{scrollbarStyle}</style>;
}