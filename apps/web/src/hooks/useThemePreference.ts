import { useEffect, useState } from 'react';
import type { ThemeMode } from '../types';

export function useThemePreference() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('zenshin-theme') as ThemeMode) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('zenshin-theme', theme);
    document.body.classList.toggle('theme-red', theme === 'red');
  }, [theme]);

  return {
    theme,
    toggleTheme: () => setTheme((previous) => (previous === 'dark' ? 'red' : 'dark')),
  };
}