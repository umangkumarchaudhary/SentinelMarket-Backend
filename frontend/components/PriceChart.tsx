'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface PriceChartProps {
  data: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

export function PriceChart({ data }: PriceChartProps) {
  // Format data for chart
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    price: item.close,
    high: item.high,
    low: item.low,
  }));

  // Calculate average price for reference line
  const avgPrice =
    chartData.reduce((sum, item) => sum + item.price, 0) / chartData.length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
      <h3 className="mb-4 text-base font-semibold text-black sm:text-lg">Price Movement</h3>
      <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: number) => `₹${value.toFixed(2)}`}
          />
          <ReferenceLine
            y={avgPrice}
            stroke="#9ca3af"
            strokeDasharray="3 3"
            label={{ value: 'Avg', position: 'right' }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            name="Close Price"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

