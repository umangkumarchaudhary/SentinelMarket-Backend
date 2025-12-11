'use client';

import { PatternMatchResponse } from '@/lib/api';

interface PatternMatchPanelProps {
  data: PatternMatchResponse;
}

export default function PatternMatchPanel({ data }: PatternMatchPanelProps) {
  const { current_pattern, best_match, similarity_score, warning } = data;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Pattern Matching</h3>

      <div className="mb-6">
        <h4 className="font-medium mb-2">Current Pattern</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-xs text-gray-600">Type</div>
            <div className="text-sm font-medium">{current_pattern.type}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-xs text-gray-600">Price Change (30d)</div>
            <div className="text-sm font-medium">{current_pattern.price_change_30d.toFixed(1)}%</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-xs text-gray-600">Volume Spike</div>
            <div className="text-sm font-medium">{current_pattern.volume_spike.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {warning && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-medium">⚠️ Warning</span>
          </div>
          <p className="text-sm text-red-800 mt-1">{warning}</p>
        </div>
      )}

      {best_match && (
        <div className="mb-6">
          <h4 className="font-medium mb-2">Best Historical Match</h4>
          <div className="bg-gray-50 p-4 rounded">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-medium">{best_match.stock}</div>
                <div className="text-sm text-gray-600">{best_match.date}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-red-600">{best_match.similarity.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">Similarity</div>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <div className="font-medium text-red-600">Outcome: {best_match.outcome}</div>
              <div className="text-gray-600 mt-1">Pattern Type: {best_match.pattern_type}</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">Overall Similarity Score</div>
          <div className="text-2xl font-bold text-red-600">{similarity_score.toFixed(1)}%</div>
        </div>
        {similarity_score > 75 && (
          <div className="bg-red-100 text-red-800 px-4 py-2 rounded font-medium">
            High Risk Pattern
          </div>
        )}
      </div>
    </div>
  );
}

