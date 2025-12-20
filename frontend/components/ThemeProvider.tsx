'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>('system');
    const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');
    const [mounted, setMounted] = useState(false);

    // Get system preference
    const getSystemTheme = (): 'dark' | 'light' => {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'dark';
    };

    // Resolve actual theme based on preference
    const resolveTheme = (t: Theme): 'dark' | 'light' => {
        if (t === 'system') {
            return getSystemTheme();
        }
        return t;
    };

    // Load saved theme on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('sentinel-theme') as Theme | null;
        if (savedTheme && ['dark', 'light', 'system'].includes(savedTheme)) {
            setThemeState(savedTheme);
            setResolvedTheme(resolveTheme(savedTheme));
        } else {
            setResolvedTheme(resolveTheme('system'));
        }
        setMounted(true);
    }, []);

    // Listen for system preference changes
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            setResolvedTheme(getSystemTheme());
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    // Apply theme class to document
    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(resolvedTheme);

        // Also set color-scheme for native elements
        root.style.colorScheme = resolvedTheme;
    }, [resolvedTheme, mounted]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        setResolvedTheme(resolveTheme(newTheme));
        localStorage.setItem('sentinel-theme', newTheme);
    };

    // Prevent flash by not rendering until mounted
    if (!mounted) {
        return (
            <div className="min-h-screen bg-black">
                {children}
            </div>
        );
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
