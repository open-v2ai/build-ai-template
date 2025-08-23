'use client';

import { useEffect } from 'react';

export default function ThemeProvider() {
  useEffect(() => {
    // 检查localStorage中的主题设置
    const savedTheme = localStorage.getItem('theme');
    // 检查系统主题偏好
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    const initialTheme = savedTheme as 'light' | 'dark' || systemTheme;
    
    // 应用主题到document
    const root = document.documentElement;
    if (initialTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  return null;
}
