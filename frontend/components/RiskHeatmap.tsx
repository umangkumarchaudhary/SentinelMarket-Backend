'use client';

import { HeatmapItem } from '@/lib/api';

interface RiskHeatmapProps {
  data: HeatmapItem[];
}

export default function RiskHeatmap({ data }: RiskHeatmapProps) {
  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-red-600';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const getRiskTextColor = (score: number) => {
    if (score >= 60) return 'text-white';
    return 'text-black';
  };

  // Organize into grid (10 columns)
  const columns = 10;
  const rows = Math.ceil(data.length / columns);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Risk Heatmap</h3>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {data.map((item, index) => (
          <div
            key={index}
            className={`${getRiskColor(item.risk_score)} ${getRiskTextColor(item.risk_score)} p-2 rounded text-xs text-center cursor-pointer hover:opacity-80 transition-opacity`}
            title={`${item.ticker}: ${item.risk_score.toFixed(1)}`}
          >
            <div className="font-medium">{item.ticker}</div>
            <div className="text-xs opacity-90">{item.risk_score.toFixed(0)}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Low (0-40)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 rounded"></div>
          <span>Medium (40-60)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span>High (60-80)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded"></div>
          <span>Extreme (80+)</span>
        </div>
      </div>
    </div>
  );
}

