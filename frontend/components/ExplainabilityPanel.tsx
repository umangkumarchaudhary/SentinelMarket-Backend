'use client';

import { ExplanationData } from '@/lib/api';

interface ExplainabilityPanelProps {
  data: ExplanationData;
}

export default function ExplainabilityPanel({ data }: ExplainabilityPanelProps) {
  const { top_contributions, detector_scores, explanation, red_flags } = data;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">ML Model Explanation</h3>

      <div className="mb-6">
        <h4 className="font-medium mb-2">Explanation</h4>
        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{explanation}</p>
      </div>

      {red_flags && red_flags.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-2">Red Flags</h4>
          <ul className="list-disc list-inside space-y-1">
            {red_flags.map((flag, index) => (
              <li key={index} className="text-sm text-red-600">{flag}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6">
        <h4 className="font-medium mb-2">Detector Scores</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-xs text-gray-600">Volume</div>
            <div className="text-lg font-bold text-blue-600">{detector_scores.volume.toFixed(1)}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-xs text-gray-600">Price</div>
            <div className="text-lg font-bold text-purple-600">{detector_scores.price.toFixed(1)}</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-xs text-gray-600">ML</div>
            <div className="text-lg font-bold text-green-600">{detector_scores.ml.toFixed(1)}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded">
            <div className="text-xs text-gray-600">Social</div>
            <div className="text-lg font-bold text-orange-600">{detector_scores.social.toFixed(1)}</div>
          </div>
        </div>
      </div>

      {top_contributions && top_contributions.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Top Contributing Features</h4>
          <div className="space-y-2">
            {top_contributions.map((contribution, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">{contribution.feature}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    contribution.contribution > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {contribution.contribution > 0 ? '+' : ''}{contribution.contribution.toFixed(3)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    contribution.impact === 'high' ? 'bg-red-100 text-red-800' :
                    contribution.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {contribution.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

