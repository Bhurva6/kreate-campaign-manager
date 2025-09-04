import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  useEffect(() => {
    // Load theme preference from localStorage if available
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Default to dark mode if no preference is saved
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    // Apply theme class to document body
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.body.classList.toggle('light-mode', !isDarkMode);
    
    // Apply theme colors
    const root = document.documentElement;
    
    // Common colors
    root.style.setProperty('--primary', '#1A018D');
    root.style.setProperty('--secondary', '#FF5E32');
    root.style.setProperty('--accent', '#B6CF4F');
    
    // Theme-specific colors
    if (isDarkMode) {
      root.style.setProperty('--background', '#000000');
      root.style.setProperty('--foreground', '#EFE7D4');
    } else {
      root.style.setProperty('--background', '#EFE7D4');
      root.style.setProperty('--foreground', '#000000');
    }
    
    // Log the theme change to verify it's working
    console.log('Theme changed to:', isDarkMode ? 'dark' : 'light');
    
    // Save theme preference to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    console.log('Toggle theme called, current:', isDarkMode, 'switching to:', !isDarkMode);
    setIsDarkMode(prevMode => !prevMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
