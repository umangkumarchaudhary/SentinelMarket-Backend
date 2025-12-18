'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SentimentChartProps {
  data: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

const COLORS = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#6b7280',
};

export default function SentimentChart({ data }: SentimentChartProps) {
  const chartData = [
    { name: 'Positive', value: data.positive, color: COLORS.positive },
    { name: 'Negative', value: data.negative, color: COLORS.negative },
    { name: 'Neutral', value: data.neutral, color: COLORS.neutral },
  ].filter(item => item.value > 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

