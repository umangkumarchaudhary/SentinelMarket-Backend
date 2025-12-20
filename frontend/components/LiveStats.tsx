'use client';

import { useEffect, useState } from 'react';

interface Stat {
    label: string;
    value: number;
    suffix?: string;
    icon: React.ReactNode;
}

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 2000) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(Math.round(easeOutQuart * target));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [target, duration]);

    return count;
}

function AnimatedStat({ label, value, suffix = '', icon }: Stat) {
    const animatedValue = useAnimatedCounter(value, 2500);

    return (
        <div className="flex items-center gap-3">
            <div
                className="p-2 rounded-lg"
                style={{ background: 'var(--background-tertiary)' }}
            >
                <div style={{ color: 'var(--foreground-muted)' }}>{icon}</div>
            </div>
            <div>
                <p
                    className="text-2xl font-bold tabular-nums"
                    style={{ color: 'var(--foreground)' }}
                >
                    {animatedValue.toLocaleString()}{suffix}
                </p>
                <p
                    className="text-xs font-medium"
                    style={{ color: 'var(--foreground-muted)' }}
                >
                    {label}
                </p>
            </div>
        </div>
    );
}

export function LiveStats() {
    const stats: Stat[] = [
        {
            label: 'Stocks Monitored',
            value: 30,
            suffix: '+',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            label: 'Risk Assessments Today',
            value: 2847,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
        },
        {
            label: 'Data Freshness',
            value: 15,
            suffix: ' min',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            label: 'ML Model Accuracy',
            value: 94,
            suffix: '%',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
        },
    ];

    return (
        <div
            className="rounded-2xl p-4 lg:p-6 mb-6"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-8">
                {/* Live indicator */}
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span
                        className="text-sm font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--success)' }}
                    >
                        System Active
                    </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                    {stats.map((stat) => (
                        <AnimatedStat key={stat.label} {...stat} />
                    ))}
                </div>
            </div>
        </div>
    );
}
