'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ThemeToggleButton() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const t = useTranslations();

  // 初始化主题
  useEffect(() => {
    // 检查localStorage中的主题设置
    const savedTheme = localStorage.getItem('theme');
    // 检查系统主题偏好
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    const initialTheme = savedTheme as 'light' | 'dark' || systemTheme;
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  // 应用主题到document
  const applyTheme = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  };

  // 切换主题
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
      title={theme === 'light' ? t('SWITCH_TO_DARK_MODE') : t('SWITCH_TO_LIGHT_MODE')}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-foreground" />
      ) : (
        <Sun className="w-5 h-5 text-foreground" />
      )}
    </Button>
  );
}
