'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AnomalyAlert {
    ticker: string;
    risk_level: string;
    risk_score: number;
    price_change_percent?: number;
    volume_change?: number;
    timestamp: string;
    exchange: string;
}

// Fallback demo alerts while loading real data
const fallbackAlerts: AnomalyAlert[] = [
    {
        ticker: 'RELIANCE',
        risk_level: 'HIGH',
        risk_score: 87.5,
        price_change_percent: 8.2,
        volume_change: 245,
        timestamp: new Date().toISOString(),
        exchange: 'NSE',
    },
    {
        ticker: 'TCS',
        risk_level: 'MEDIUM',
        risk_score: 65.3,
        price_change_percent: 3.5,
        volume_change: 120,
        timestamp: new Date().toISOString(),
        exchange: 'NSE',
    },
    {
        ticker: 'HDFC BANK',
        risk_level: 'HIGH',
        risk_score: 82.1,
        price_change_percent: -2.8,
        volume_change: 187,
        timestamp: new Date().toISOString(),
        exchange: 'NSE',
    },
    {
        ticker: 'INFY',
        risk_level: 'LOW',
        risk_score: 28.4,
        price_change_percent: 0.3,
        timestamp: new Date().toISOString(),
        exchange: 'NSE',
    },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sentinelmarket-backend.onrender.com';

const getSeverityStyles = (riskLevel: string, riskScore: number) => {
    // Determine severity based on risk level and score
    if (riskLevel === 'EXTREME' || riskScore >= 80) {
        return {
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            dot: 'bg-red-500',
            text: 'text-red-400',
            severity: 'high' as const,
        };
    } else if (riskLevel === 'HIGH' || riskScore >= 60) {
        return {
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/30',
            dot: 'bg-orange-500',
            text: 'text-orange-400',
            severity: 'high' as const,
        };
    } else if (riskLevel === 'MEDIUM' || riskScore >= 40) {
        return {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/30',
            dot: 'bg-amber-500',
            text: 'text-amber-400',
            severity: 'medium' as const,
        };
    } else {
        return {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/30',
            dot: 'bg-emerald-500',
            text: 'text-emerald-400',
            severity: 'low' as const,
        };
    }
};

const getAlertMessage = (alert: AnomalyAlert): string => {
    if (alert.volume_change && alert.volume_change > 150) {
        return 'Volume Spike Detected';
    } else if (alert.price_change_percent && Math.abs(alert.price_change_percent) > 5) {
        return 'Price Movement Alert';
    } else if (alert.risk_level === 'EXTREME' || alert.risk_level === 'HIGH') {
        return 'Unusual Activity Flagged';
    } else {
        return 'Risk Pattern Detected';
    }
};

const getChangeDisplay = (alert: AnomalyAlert): string => {
    if (alert.volume_change && alert.volume_change > 100) {
        return `↑${alert.volume_change}% vol`;
    } else if (alert.price_change_percent !== undefined) {
        const sign = alert.price_change_percent >= 0 ? '↑' : '↓';
        return `${sign}${Math.abs(alert.price_change_percent).toFixed(1)}%`;
    } else {
        return `Risk: ${alert.risk_score.toFixed(0)}`;
    }
};

const getAlertIcon = (alert: AnomalyAlert) => {
    if (alert.volume_change && alert.volume_change > 150) {
        return (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
        );
    } else if (alert.price_change_percent && Math.abs(alert.price_change_percent) > 5) {
        return (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    } else {
        return (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        );
    }
};

const getTimeAgo = (timestamp: string): string => {
    try {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now.getTime() - then.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
        return 'Recently';
    }
};

export function LiveAnomalyFeed() {
    const [alerts, setAlerts] = useState<AnomalyAlert[]>(fallbackAlerts.slice(0, 4));
    const [isLoading, setIsLoading] = useState(true);
    const [useFallback, setUseFallback] = useState(true);

    const fetchRealAlerts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/alerts?limit=8`);

            if (response.ok) {
                const data = await response.json();

                if (data.alerts && data.alerts.length > 0) {
                    // Transform backend alerts to our format
                    const transformedAlerts: AnomalyAlert[] = data.alerts.map((alert: any) => ({
                        ticker: alert.ticker,
                        risk_level: alert.risk_level,
                        risk_score: alert.risk_score,
                        price_change_percent: alert.price_change_percent,
                        volume_change: alert.volume_change,
                        timestamp: alert.timestamp || new Date().toISOString(),
                        exchange: alert.exchange || 'NSE',
                    }));

                    setAlerts(transformedAlerts.slice(0, 4));
                    setUseFallback(false);
                }
            }
        } catch (error) {
            console.error('Failed to fetch real alerts, using fallback:', error);
            setUseFallback(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Fetch immediately
        fetchRealAlerts();

        // Refresh every 30 seconds
        const interval = setInterval(fetchRealAlerts, 30000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className="rounded-2xl p-5 lg:p-6 mb-6 overflow-hidden"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                    </div>
                    <h3
                        className="font-bold text-base lg:text-lg"
                        style={{ color: 'var(--foreground)' }}
                    >
                        Live Anomaly Feed
                    </h3>
                    <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--background-tertiary)', color: 'var(--foreground-muted)' }}
                    >
                        {useFallback ? 'Demo' : 'Live'}
                    </span>
                </div>

                <Link
                    href="/alerts"
                    className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                    style={{ color: 'var(--accent)' }}
                >
                    View All
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>

            {/* Alert Cards */}
            <div
                className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-3 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
            >
                {alerts.map((alert, index) => {
                    const styles = getSeverityStyles(alert.risk_level, alert.risk_score);
                    const message = getAlertMessage(alert);
                    const change = getChangeDisplay(alert);
                    const timeAgo = getTimeAgo(alert.timestamp);

                    return (
                        <div
                            key={`${alert.ticker}-${index}`}
                            className={`relative rounded-xl p-4 border ${styles.bg} ${styles.border} transition-all hover:scale-[1.02] cursor-pointer`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {/* Severity indicator */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
                                    <span
                                        className="font-bold text-sm"
                                        style={{ color: 'var(--foreground)' }}
                                    >
                                        {alert.ticker}
                                    </span>
                                </div>
                                <span
                                    className="text-[10px]"
                                    style={{ color: 'var(--foreground-muted)' }}
                                >
                                    {timeAgo}
                                </span>
                            </div>

                            {/* Alert info */}
                            <div className="flex items-start gap-2">
                                <div className={styles.text}>
                                    {getAlertIcon(alert)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p
                                        className="text-xs font-medium truncate"
                                        style={{ color: 'var(--foreground-secondary)' }}
                                    >
                                        {message}
                                    </p>
                                    <p className={`text-sm font-bold ${styles.text}`}>
                                        {change}
                                    </p>
                                </div>
                            </div>

                            {/* Risk score badge */}
                            <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px]" style={{ color: 'var(--foreground-muted)' }}>
                                        Risk Score
                                    </span>
                                    <span className={`text-xs font-bold ${styles.text}`}>
                                        {alert.risk_score.toFixed(0)}/100
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Status Hint */}
            <p
                className="text-center text-[10px] mt-4 opacity-60"
                style={{ color: 'var(--foreground-muted)' }}
            >
                {useFallback
                    ? 'Using demo data • Backend API unavailable'
                    : 'Live data • Auto-refreshes every 30s'
                }
            </p>
        </div>
    );
}
