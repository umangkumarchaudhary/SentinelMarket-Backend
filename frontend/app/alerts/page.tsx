'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { RiskBadge } from '@/components/RiskBadge';
import { getAlerts, getPredictiveAlerts, type Alert, type PredictiveAlert } from '@/lib/api';
import { Exchange } from '@/lib/types';
import Link from 'next/link';
import PredictiveAlert from '@/components/PredictiveAlert';

export default function AlertsPage() {
  const router = useRouter();
  const [exchange, setExchange] = useState<Exchange>('nse');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [predictiveAlerts, setPredictiveAlerts] = useState<PredictiveAlert[]>([]);
  const [activeTab, setActiveTab] = useState<'current' | 'predictive'>('current');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
    loadPredictiveAlerts();
  }, [exchange]);

  const loadAlerts = async () => {
    try {
      const data = await getAlerts(exchange, 'high', 50);
      setAlerts(data.alerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
      console.error('Error loading alerts:', err);
    }
  };

  const loadPredictiveAlerts = async () => {
    try {
      const data = await getPredictiveAlerts(exchange, 20, 50);
      setPredictiveAlerts(data.alerts);
    } catch (err) {
      console.error('Error loading predictive alerts:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header exchange={exchange} onExchangeChange={setExchange} />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Alerts & Notifications</h1>
          <p className="mt-2 text-gray-600">
            High-risk stocks detected for {exchange.toUpperCase()}
          </p>
          
          {/* Tabs */}
          <div className="mt-4 flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'current'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Current Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('predictive')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'predictive'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Predictive Alerts ({predictiveAlerts.length})
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            <p className="font-medium">Error: {error}</p>
            <button
              onClick={loadAlerts}
              className="mt-2 text-sm text-red-600 underline hover:text-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200"></div>
            ))}
          </div>
        ) : activeTab === 'current' ? (
          alerts.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
              <p className="text-gray-500">No high-risk alerts at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={`${alert.ticker}-${alert.exchange}`}
                  className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <RiskBadge riskLevel={alert.risk_level as any} riskScore={alert.risk_score} />
                        <h3 className="text-xl font-bold text-black">{alert.ticker}</h3>
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {alert.exchange}
                        </span>
                      </div>
                      <p className="mb-3 text-gray-700">{alert.message}</p>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>Price: ₹{alert.price.toFixed(2)}</span>
                        <span
                          className={
                            alert.price_change_percent >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {alert.price_change_percent >= 0 ? '+' : ''}
                          {alert.price_change_percent.toFixed(2)}%
                        </span>
                        <span>
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/stock/${alert.ticker}?exchange=${alert.exchange.toLowerCase()}`}
                      className="ml-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          predictiveAlerts.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
              <p className="text-gray-500">No predictive alerts at this time</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {predictiveAlerts.map((alert) => {
                const predictionData = {
                  ticker: alert.ticker,
                  crash_probability: alert.crash_probability,
                  confidence: 70,
                  alert_level: alert.alert_level as 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW',
                  prediction_window: alert.predicted_window,
                  risk_score: alert.risk_score,
                  recommendation: alert.crash_probability > 70 ? 'Avoid trading' : 'Monitor closely',
                  factors: {
                    current_risk: alert.risk_score,
                    volatility: 0,
                    volume_anomaly: false,
                  },
                  last_updated: new Date().toISOString(),
                };
                return (
                  <div key={`${alert.ticker}-${alert.exchange}`}>
                    <PredictiveAlert data={predictionData} />
                  </div>
                );
              })}
            </div>
          )
        )}

        <div className="mt-8">
          <button
            onClick={() => {
              setIsLoading(true);
              Promise.all([loadAlerts(), loadPredictiveAlerts()]).finally(() => setIsLoading(false));
            }}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Refresh Alerts
          </button>
        </div>
      </main>
    </div>
  );
}

