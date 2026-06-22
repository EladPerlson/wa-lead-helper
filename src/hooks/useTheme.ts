import { useEffect } from 'react';

export function useTheme(darkMode: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);
}

export function applyThemeToElement(element: HTMLElement, darkMode: boolean) {
  if (darkMode) {
    element.classList.add('dark');
  } else {
    element.classList.remove('dark');
  }
}
