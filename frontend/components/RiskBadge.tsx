'use client';

import { RiskBadgeProps } from '@/lib/types';

export function RiskBadge({ riskLevel, riskScore, size = 'md' }: RiskBadgeProps) {
  const getRiskStyle = (level: string) => {
    switch (level) {
      case 'LOW':
        return {
          bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
          text: 'text-white',
          glow: 'shadow-emerald-500/25'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-gradient-to-r from-amber-500 to-yellow-500',
          text: 'text-white',
          glow: 'shadow-amber-500/25'
        };
      case 'HIGH':
        return {
          bg: 'bg-gradient-to-r from-orange-500 to-red-500',
          text: 'text-white',
          glow: 'shadow-orange-500/25'
        };
      case 'EXTREME':
        return {
          bg: 'bg-gradient-to-r from-red-600 to-red-700',
          text: 'text-white',
          glow: 'shadow-red-600/30'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-zinc-500 to-zinc-600',
          text: 'text-white',
          glow: ''
        };
    }
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  const style = getRiskStyle(riskLevel);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center rounded-lg font-semibold shadow-lg ${style.bg} ${style.text} ${style.glow} ${sizeClasses[size]}`}
      >
        <span className="font-bold">{riskLevel}</span>
        <span className="opacity-80">•</span>
        <span className="tabular-nums">{Math.round(riskScore)}</span>
      </span>

      {/* Mini risk gauge */}
      {size !== 'sm' && (
        <div
          className="w-12 h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--border-subtle)' }}
        >
          <div
            className={`h-full ${style.bg} transition-all duration-500`}
            style={{ width: `${Math.min(riskScore, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

