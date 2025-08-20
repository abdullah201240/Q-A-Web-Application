import { useEffect, useState } from "react"
import { ThemeProviderContext, type Theme } from "@/contexts/theme-context"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}


export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // First check for saved theme in localStorage
    const storedTheme = localStorage.getItem(storageKey) as Theme | null;
    if (storedTheme) {
      return storedTheme;
    }
    // Then check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    // Fall back to default theme
    return defaultTheme;
  });

  // Handle system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply theme class to document element
  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    let themeToApply = newTheme;
    if (newTheme === 'system') {
      themeToApply = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    root.classList.add(themeToApply);
    root.setAttribute('data-theme', themeToApply);
  };

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
