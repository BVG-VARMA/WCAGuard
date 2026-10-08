import React from 'react';

export default function ThemeToggle({ darkMode, setDarkMode }) {
  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="px-2.5 py-1.5 rounded-lg text-blue-100 hover:bg-blue-800 transition-colors font-medium text-xs flex items-center gap-1.5"
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="text-sm select-none">{darkMode ? '☀' : '☾'}</span>
      <span className="hidden sm:inline text-[11px]">{darkMode ? 'Light' : 'Dark'}</span>
    </button>
  );
}
