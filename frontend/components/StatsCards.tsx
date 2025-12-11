'use client';

import { Analytics } from '@/lib/api';

interface StatsCardsProps {
  analytics: Analytics | null;
  isLoading?: boolean;
}

export function StatsCards({ analytics, isLoading }: StatsCardsProps) {
  if (isLoading || !analytics) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-6"
          >
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Stocks */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm font-medium text-gray-600">Total Stocks</p>
        <p className="mt-2 text-3xl font-bold text-black">
          {analytics.total_stocks}
        </p>
        <p className="mt-1 text-xs text-gray-500">{analytics.exchange}</p>
      </div>

      {/* High Risk Count */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm font-medium text-gray-600">High Risk Stocks</p>
        <p className="mt-2 text-3xl font-bold text-red-600">
          {analytics.high_risk_count}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {analytics.risk_distribution.high} HIGH +{' '}
          {analytics.risk_distribution.extreme} EXTREME
        </p>
      </div>

      {/* Average Risk Score */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm font-medium text-gray-600">Average Risk Score</p>
        <p className="mt-2 text-3xl font-bold text-black">
          {analytics.average_risk_score.toFixed(1)}
        </p>
        <p className="mt-1 text-xs text-gray-500">Out of 100</p>
      </div>
    </div>
  );
}

