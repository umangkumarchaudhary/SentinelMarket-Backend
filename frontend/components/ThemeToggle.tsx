'use client';

import { useTheme } from './ThemeProvider';
import { useState, useRef, useEffect } from 'react';

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const themes: { value: 'dark' | 'light' | 'system'; label: string }[] = [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'system', label: 'System' },
    ];

    const getCurrentIcon = () => {
        if (theme === 'system') {
            return (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            );
        }
        if (resolvedTheme === 'dark') {
            return (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            );
        }
        return (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        );
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center h-9 w-9 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-all duration-200"
                aria-label="Toggle theme"
            >
                {getCurrentIcon()}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 shadow-xl shadow-black/20 py-1 z-50 animate-fadeIn">
                    {themes.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => {
                                setTheme(t.value);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors ${theme === t.value
                                    ? 'text-white bg-red-600/20'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {t.value === 'light' && (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            )}
                            {t.value === 'dark' && (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                            {t.value === 'system' && (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            )}
                            {t.label}
                        </button>
                    ))}
                </div>
            )}

            <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }
      `}</style>
        </div>
    );
}
