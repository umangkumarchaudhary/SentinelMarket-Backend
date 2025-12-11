'use client';

interface HypeScoreProps {
  score: number;
  size?: number;
}

export default function HypeScore({ score, size = 120 }: HypeScoreProps) {
  const percentage = Math.min(Math.max(score, 0), 100);
  const circumference = 2 * Math.PI * (size / 2 - 10);
  const offset = circumference - (percentage / 100) * circumference;
  
  const getColor = () => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStrokeColor = () => {
    if (score >= 70) return 'stroke-red-600';
    if (score >= 40) return 'stroke-yellow-600';
    return 'stroke-green-600';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 10}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 10}
            fill="none"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={getStrokeColor()}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getColor()}`}>
              {score.toFixed(0)}
            </div>
            <div className="text-xs text-gray-500">Hype</div>
          </div>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-600">
        {score >= 70 ? '⚠️ Very High' : score >= 40 ? '⚡ Moderate' : '✓ Low'}
      </div>
    </div>
  );
}

