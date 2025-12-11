'use client';

import { PredictionData } from '@/lib/api';

interface PredictiveAlertProps {
  data: PredictionData;
}

export default function PredictiveAlert({ data }: PredictiveAlertProps) {
  const { crash_probability, confidence, alert_level, recommendation, factors } = data;

  const getAlertColor = () => {
    switch (alert_level) {
      case 'CRITICAL':
        return 'bg-red-600';
      case 'HIGH':
        return 'bg-orange-500';
      case 'MODERATE':
        return 'bg-yellow-400';
      default:
        return 'bg-green-500';
    }
  };

  const getAlertTextColor = () => {
    return alert_level === 'LOW' ? 'text-black' : 'text-white';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Predictive Alert</h3>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-600">Crash Probability</div>
            <div className="text-4xl font-bold text-red-600">{crash_probability.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mt-1">Next {data.prediction_window}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Confidence</div>
            <div className="text-2xl font-bold">{confidence}%</div>
          </div>
        </div>

        <div className={`${getAlertColor()} ${getAlertTextColor()} px-4 py-3 rounded text-center font-medium`}>
          {alert_level} RISK
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-medium mb-2">Recommendation</h4>
        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{recommendation}</p>
      </div>

      <div>
        <h4 className="font-medium mb-2">Key Factors</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-xs text-gray-600">Current Risk</div>
            <div className="text-lg font-bold text-blue-600">{factors.current_risk.toFixed(1)}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-xs text-gray-600">Volatility</div>
            <div className="text-lg font-bold text-purple-600">{factors.volatility.toFixed(2)}%</div>
          </div>
          <div className="bg-orange-50 p-3 rounded">
            <div className="text-xs text-gray-600">Volume Anomaly</div>
            <div className="text-lg font-bold text-orange-600">
              {factors.volume_anomaly ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

