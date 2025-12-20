'use client';

import { useEffect, useState } from 'react';
import type { Analytics } from '@/lib/api';

interface Stat {
    label: string;
    value: number;
    suffix?: string;
    icon: React.ReactNode;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sentinelmarket-backend.onrender.com';

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
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/analytics?exchange=nse`);
                if (response.ok) {
                    const data = await response.json();
                    setAnalytics(data);
                }
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();

        // Refresh every 60 seconds
        const interval = setInterval(fetchAnalytics, 60000);
        return () => clearInterval(interval);
    }, []);

    // Fallback values
    const stocksMonitored = analytics?.total_stocks || 30;
    const highRiskCount = analytics?.high_risk_count || 8;
    const avgRiskScore = analytics?.average_risk_score || 42.5;

    const stats: Stat[] = [
        {
            label: 'Stocks Monitored',
            value: stocksMonitored,
            suffix: '',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            label: 'High Risk Alerts',
            value: highRiskCount,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
            label: 'Avg Risk Score',
            value: Math.round(avgRiskScore),
            suffix: '/100',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
                        {isLoading ? 'Loading...' : 'System Active'}
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
