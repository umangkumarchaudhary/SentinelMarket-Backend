'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RiskTrendChartProps {
  data: Array<{
    date: string;
    risk_score: number;
  }>;
}

export function RiskTrendChart({ data }: RiskTrendChartProps) {
  // Format data for chart
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    risk: item.risk_score,
  }));

  // Get risk color based on score
  const getRiskColor = (score: number) => {
    if (score >= 80) return '#dc2626'; // Red - Extreme
    if (score >= 60) return '#f97316'; // Orange - High
    if (score >= 30) return '#eab308'; // Yellow - Medium
    return '#22c55e'; // Green - Low
  };

  const avgRisk =
    chartData.reduce((sum, item) => sum + item.risk, 0) / chartData.length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
      <h3 className="mb-4 text-base font-semibold text-black sm:text-lg">Risk Score Trend</h3>
      <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={getRiskColor(avgRisk)}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={getRiskColor(avgRisk)}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
            label={{ value: 'Risk Score', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: number) => `${value.toFixed(1)}/100`}
          />
          <Area
            type="monotone"
            dataKey="risk"
            stroke={getRiskColor(avgRisk)}
            strokeWidth={2}
            fill="url(#riskGradient)"
            name="Risk Score"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-2 text-sm text-gray-600">
        Average Risk: {avgRisk.toFixed(1)}/100
      </div>
    </div>
  );
}

