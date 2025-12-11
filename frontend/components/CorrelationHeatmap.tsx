'use client';

import { CorrelationMatrix } from '@/lib/api';
import { useMemo } from 'react';

interface CorrelationHeatmapProps {
  correlation: CorrelationMatrix;
  tickers: string[];
}

export default function CorrelationHeatmap({ correlation, tickers }: CorrelationHeatmapProps) {
  const maxCorrelation = useMemo(() => {
    let max = 0;
    tickers.forEach((t1) => {
      tickers.forEach((t2) => {
        if (t1 !== t2 && correlation[t1]?.[t2] !== undefined) {
          max = Math.max(max, Math.abs(correlation[t1][t2]));
        }
      });
    });
    return max;
  }, [correlation, tickers]);

  const getColor = (value: number) => {
    const normalized = Math.abs(value) / maxCorrelation;
    if (value > 0) {
      // Positive correlation - blue scale
      const intensity = Math.floor(normalized * 255);
      return `rgb(${255 - intensity}, ${255 - intensity}, 255)`;
    } else {
      // Negative correlation - red scale
      const intensity = Math.floor(normalized * 255);
      return `rgb(255, ${255 - intensity}, ${255 - intensity})`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
      <h3 className="text-lg font-semibold mb-4">Stock Correlation Matrix</h3>
      <div className="min-w-full">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 text-xs font-medium"></th>
              {tickers.map((ticker) => (
                <th key={ticker} className="border p-2 text-xs font-medium">
                  {ticker}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickers.map((ticker1) => (
              <tr key={ticker1}>
                <td className="border p-2 text-xs font-medium">{ticker1}</td>
                {tickers.map((ticker2) => {
                  const value = correlation[ticker1]?.[ticker2] ?? 0;
                  return (
                    <td
                      key={ticker2}
                      className="border p-2 text-center text-xs"
                      style={{
                        backgroundColor: getColor(value),
                        color: Math.abs(value) > 0.5 ? 'white' : 'black',
                      }}
                    >
                      {value.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-xs text-gray-600">
        <p>Values range from -1 (negative correlation) to +1 (positive correlation)</p>
      </div>
    </div>
  );
}

