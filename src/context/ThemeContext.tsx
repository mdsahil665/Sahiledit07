import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('sahil-edits-theme') || localStorage.getItem('sahil_edits_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark'; // Default to dark mode
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      const meta = document.getElementById('theme-color-meta');
      if (meta) meta.setAttribute('content', '#09090b');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      const meta = document.getElementById('theme-color-meta');
      if (meta) meta.setAttribute('content', '#ffffff');
    }
    localStorage.setItem('sahil-edits-theme', theme);
    localStorage.setItem('sahil_edits_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
