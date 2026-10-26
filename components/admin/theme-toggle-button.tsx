'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className="rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      title={theme === 'light' ? t('theme.switchToDarkMode') : t('theme.switchToLightMode')}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-neutral-500" />
      ) : (
        <Sun className="w-5 h-5 text-neutral-500" />
      )}
    </Button>
  );
}
