'use client';

import { RiskBadgeProps } from '@/lib/types';

export function RiskBadge({ riskLevel, riskScore, size = 'md' }: RiskBadgeProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'bg-green-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-black';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'EXTREME':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getRiskEmoji = (level: string) => {
    switch (level) {
      case 'LOW':
        return '🟢';
      case 'MEDIUM':
        return '🟡';
      case 'HIGH':
        return '🟠';
      case 'EXTREME':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${getRiskColor(
        riskLevel
      )} ${sizeClasses[size]}`}
    >
      <span>{getRiskEmoji(riskLevel)}</span>
      <span>{riskLevel}</span>
      <span className="opacity-90">({Math.round(riskScore)})</span>
    </span>
  );
}

