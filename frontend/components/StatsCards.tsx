'use client';

import { Analytics } from '@/lib/api';
import { useEffect, useState } from 'react';

interface StatsCardsProps {
  analytics: Analytics | null;
  isLoading?: boolean;
}

// Animated counter component
function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.round(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <>{displayValue}</>;
}

export function StatsCards({ analytics, isLoading }: StatsCardsProps) {
  if (isLoading || !analytics) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl p-6 glass"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <div className="h-4 w-24 animate-pulse rounded-lg" style={{ background: 'var(--border-subtle)' }} />
            <div className="mt-3 h-8 w-20 animate-pulse rounded-lg" style={{ background: 'var(--border-subtle)' }} />
            <div className="mt-2 h-3 w-32 animate-pulse rounded-lg" style={{ background: 'var(--border-subtle)' }} />
          </div>
        ))}
      </div>
    );
  }

  const riskDistributionTotal =
    analytics.risk_distribution.low +
    analytics.risk_distribution.medium +
    analytics.risk_distribution.high +
    analytics.risk_distribution.extreme;

  const cards = [
    {
      title: 'Total Stocks',
      value: analytics.total_stocks,
      subtitle: analytics.exchange,
      color: 'from-blue-500 to-blue-600',
      bgGlow: 'rgba(59, 130, 246, 0.1)',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
      ),
    },
    {
      title: 'High Risk Alerts',
      value: analytics.high_risk_count,
      subtitle: `${analytics.risk_distribution.high} High + ${analytics.risk_distribution.extreme} Extreme`,
      color: 'from-red-500 to-red-600',
      bgGlow: 'rgba(239, 68, 68, 0.1)',
      isAlert: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      title: 'Avg Risk Score',
      value: Math.round(analytics.average_risk_score * 10) / 10,
      subtitle: 'Out of 100',
      color: analytics.average_risk_score > 50 ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-green-500',
      bgGlow: analytics.average_risk_score > 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
      isDecimal: true,
      progress: analytics.average_risk_score,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: 'Risk Distribution',
      isDistribution: true,
      distribution: analytics.risk_distribution,
      total: riskDistributionTotal,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className="relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Background Glow */}
          {!card.isDistribution && (
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(circle at 50% 0%, ${card.bgGlow}, transparent 70%)` }}
            />
          )}

          {/* Header */}
          <div className="relative flex items-center justify-between mb-3">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {card.title}
            </span>
            <div
              className={`p-2 rounded-lg bg-gradient-to-br ${card.isDistribution ? 'from-purple-500 to-violet-600' : card.color}`}
              style={{ opacity: 0.9 }}
            >
              <div className="text-white">{card.icon}</div>
            </div>
          </div>

          {/* Content */}
          <div className="relative">
            {card.isDistribution ? (
              /* Risk Distribution Mini Chart */
              <div className="space-y-2">
                {[
                  { label: 'Low', value: card.distribution!.low, color: 'bg-emerald-500' },
                  { label: 'Med', value: card.distribution!.medium, color: 'bg-amber-500' },
                  { label: 'High', value: card.distribution!.high, color: 'bg-orange-500' },
                  { label: 'Ext', value: card.distribution!.extreme, color: 'bg-red-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-medium w-7"
                      style={{ color: 'var(--foreground-muted)' }}
                    >
                      {item.label}
                    </span>
                    <div
                      className="flex-1 h-2 rounded-full overflow-hidden"
                      style={{ background: 'var(--border-subtle)' }}
                    >
                      <div
                        className={`h-full ${item.color} transition-all duration-700`}
                        style={{ width: `${card.total! > 0 ? (item.value / card.total!) * 100 : 0}%` }}
                      />
                    </div>
                    <span
                      className="text-xs font-bold tabular-nums w-6 text-right"
                      style={{ color: 'var(--foreground-secondary)' }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Main Value */}
                <div
                  className="text-3xl font-bold tracking-tight tabular-nums"
                  style={{ color: 'var(--foreground)' }}
                >
                  {card.isDecimal ? (
                    card.value
                  ) : (
                    <AnimatedNumber value={card.value as number} />
                  )}
                </div>

                {/* Subtitle */}
                <p
                  className="mt-1 text-xs font-medium"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {card.subtitle}
                </p>

                {/* Progress bar for risk score */}
                {card.progress !== undefined && (
                  <div
                    className="mt-3 h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--border-subtle)' }}
                  >
                    <div
                      className={`h-full bg-gradient-to-r ${card.color} transition-all duration-1000`}
                      style={{ width: `${card.progress}%` }}
                    />
                  </div>
                )}

                {/* Alert pulse for high risk */}
                {card.isAlert && card.value > 0 && (
                  <div className="absolute top-0 right-0 w-2 h-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

