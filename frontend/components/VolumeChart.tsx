'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface VolumeChartProps {
  data: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

export function VolumeChart({ data }: VolumeChartProps) {
  // Format data for chart
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    volume: item.volume / 1000000, // Convert to millions
  }));

  // Calculate average volume
  const avgVolume =
    chartData.reduce((sum, item) => sum + item.volume, 0) / chartData.length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
      <h3 className="mb-4 text-base font-semibold text-black sm:text-lg">Trading Volume</h3>
      <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Volume (M)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: number) => `${value.toFixed(2)}M`}
          />
          <Bar
            dataKey="volume"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            name="Volume"
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 text-sm text-gray-600">
        Average Volume: {avgVolume.toFixed(2)}M
      </div>
    </div>
  );
}

