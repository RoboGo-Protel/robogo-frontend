'use client';

import { useDarkMode } from '@/context/DarkModeContext';

export default function DarkModeToggle() {
  const { isDark, toggleDark } = useDarkMode();

  return (
    <button
      onClick={toggleDark}
      className={`p-2 rounded ${
        isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'
      }`}
    >
      {isDark ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
