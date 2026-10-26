'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function ThemeToggleButton() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const t = useTranslations();

  // Initialize theme
  useEffect(() => {
    // Check theme setting in localStorage
    const savedTheme = localStorage.getItem('theme');
    // Check system theme preference
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    const initialTheme = savedTheme as 'light' | 'dark' || systemTheme;
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  // Apply theme to document
  const applyTheme = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  };

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className="rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      title={theme === 'light' ? t('common.theme.switchToDark') : t('common.theme.switchToLight')}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-foreground" />
      ) : (
        <Sun className="w-5 h-5 text-foreground" />
      )}
    </Button>
  );
}
