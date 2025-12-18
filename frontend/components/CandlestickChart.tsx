'use client';

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface CandlestickChartProps {
  data: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  height?: number;
}

export default function CandlestickChart({ data, height = 400 }: CandlestickChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-500">No chart data available</p>
      </div>
    );
  }

  // Format data for recharts
  const chartData = data.map((item) => {
    const date = new Date(item.date);
    const isUp = item.close >= item.open;
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      timestamp: date.getTime(),
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
      isUp,
      change: ((item.close - item.open) / item.open) * 100,
    };
  });

  // Sort by timestamp
  chartData.sort((a, b) => a.timestamp - b.timestamp);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="font-semibold">{data.date}</p>
          <p className="text-sm">
            <span className="text-gray-600">Open:</span>{' '}
            <span className="font-medium">₹{data.open.toFixed(2)}</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">High:</span>{' '}
            <span className="font-medium text-green-600">₹{data.high.toFixed(2)}</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Low:</span>{' '}
            <span className="font-medium text-red-600">₹{data.low.toFixed(2)}</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Close:</span>{' '}
            <span
              className={`font-medium ${data.isUp ? 'text-green-600' : 'text-red-600'}`}
            >
              ₹{data.close.toFixed(2)}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Change:</span>{' '}
            <span
              className={`font-medium ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {data.change >= 0 ? '+' : ''}
              {data.change.toFixed(2)}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate price range for Y-axis
  const allPrices = chartData.flatMap((d) => [d.high, d.low]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice;
  const yAxisDomain = [
    minPrice - priceRange * 0.1,
    maxPrice + priceRange * 0.1,
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
      <h3 className="mb-4 text-base font-semibold text-black sm:text-lg">
        Price Chart (OHLC)
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            domain={yAxisDomain}
            label={{ value: 'Price (₹)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={chartData[0]?.open} stroke="#9ca3af" strokeDasharray="2 2" />
          
          {/* High price line (green) */}
          <Line
            type="monotone"
            dataKey="high"
            stroke="#10b981"
            strokeWidth={1.5}
            dot={false}
            name="High"
            connectNulls
          />
          
          {/* Low price line (red) */}
          <Line
            type="monotone"
            dataKey="low"
            stroke="#ef4444"
            strokeWidth={1.5}
            dot={false}
            name="Low"
            connectNulls
          />
          
          {/* Close price line (blue, thicker) - main trend */}
          <Line
            type="monotone"
            dataKey="close"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ fill: '#3b82f6', r: 3 }}
            name="Close Price"
            connectNulls
          />
          
          {/* Open price line (gray, dashed) */}
          <Line
            type="monotone"
            dataKey="open"
            stroke="#9ca3af"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={false}
            name="Open"
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500"></div>
          <span>Close Price</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-4 bg-green-500"></div>
          <span>High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-4 bg-red-500"></div>
          <span>Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-4 bg-gray-400 border-dashed border border-gray-400"></div>
          <span>Open</span>
        </div>
      </div>
    </div>
  );
}
