'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { RiskBadge } from '@/components/RiskBadge';
import { getAlerts, getPredictiveAlerts, type Alert, type PredictiveAlert as PredictiveAlertData } from '@/lib/api';
import { Exchange } from '@/lib/types';
import Link from 'next/link';
import PredictiveAlert from '@/components/PredictiveAlert';

// Demo data for instant display
const DEMO_ALERTS: Alert[] = [
  {
    ticker: 'ADANIENT',
    exchange: 'NSE',
    risk_score: 78.5,
    risk_level: 'HIGH',
    price: 2845.50,
    price_change_percent: 8.2,
    timestamp: new Date().toISOString(),
    message: 'Unusual volume spike detected - 340% above average. Price momentum indicates potential pump pattern.',
  },
  {
    ticker: 'SUZLON',
    exchange: 'NSE',
    risk_score: 85.2,
    risk_level: 'EXTREME',
    price: 42.15,
    price_change_percent: 12.5,
    timestamp: new Date().toISOString(),
    message: 'Multiple red flags: Volume anomaly, social media hype surge, and rapid price increase.',
  },
  {
    ticker: 'YESBANK',
    exchange: 'NSE',
    risk_score: 72.8,
    risk_level: 'HIGH',
    price: 24.80,
    price_change_percent: -3.2,
    timestamp: new Date().toISOString(),
    message: 'High volatility detected. Historical pattern similarity to previous manipulation events.',
  },
  {
    ticker: 'IDEA',
    exchange: 'NSE',
    risk_score: 68.4,
    risk_level: 'HIGH',
    price: 12.35,
    price_change_percent: 5.8,
    timestamp: new Date().toISOString(),
    message: 'Telegram pump signals detected. Coordinated buying activity suspected.',
  },
  {
    ticker: 'RPOWER',
    exchange: 'NSE',
    risk_score: 74.1,
    risk_level: 'HIGH',
    price: 18.90,
    price_change_percent: 7.1,
    timestamp: new Date().toISOString(),
    message: 'Unusual trading pattern detected with volume 280% above normal.',
  },
];

const DEMO_PREDICTIVE_ALERTS: PredictiveAlertData[] = [
  {
    ticker: 'SUZLON',
    exchange: 'NSE',
    crash_probability: 78.5,
    risk_score: 82.3,
    alert_level: 'CRITICAL',
    predicted_window: '7 days',
    current_price: 42.15,
  },
  {
    ticker: 'ADANIENT',
    exchange: 'NSE',
    crash_probability: 65.2,
    risk_score: 71.8,
    alert_level: 'HIGH',
    predicted_window: '7 days',
    current_price: 2845.50,
  },
  {
    ticker: 'YESBANK',
    exchange: 'NSE',
    crash_probability: 58.4,
    risk_score: 68.2,
    alert_level: 'MODERATE',
    predicted_window: '7 days',
    current_price: 24.80,
  },
  {
    ticker: 'RPOWER',
    exchange: 'NSE',
    crash_probability: 52.1,
    risk_score: 62.5,
    alert_level: 'MODERATE',
    predicted_window: '7 days',
    current_price: 18.90,
  },
];

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

export default function AlertsPage() {
  const [exchange, setExchange] = useState<Exchange>('nse');
  const [alerts, setAlerts] = useState<Alert[]>(DEMO_ALERTS);
  const [predictiveAlerts, setPredictiveAlerts] = useState<PredictiveAlertData[]>(DEMO_PREDICTIVE_ALERTS);
  const [activeTab, setActiveTab] = useState<'current' | 'predictive'>('current');
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveData, setIsLiveData] = useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await fetchWithRetry(() => getAlerts(exchange, 'high', 50));
      if (data.alerts && data.alerts.length > 0) {
        setAlerts(data.alerts);
        setIsLiveData(true);
      }
    } catch (err) {
      console.error('Error loading alerts:', err);
    }
  }, [exchange]);

  const loadPredictiveAlerts = useCallback(async () => {
    try {
      const data = await fetchWithRetry(() => getPredictiveAlerts(exchange, 20, 50));
      if (data.alerts && data.alerts.length > 0) {
        setPredictiveAlerts(data.alerts);
      }
    } catch (err) {
      console.error('Error loading predictive alerts:', err);
    }
  }, [exchange]);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([loadAlerts(), loadPredictiveAlerts()]);
    setIsLoading(false);
  }, [loadAlerts, loadPredictiveAlerts]);

  useEffect(() => {
    loadAll();
  }, [exchange, loadAll]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header exchange={exchange} onExchangeChange={setExchange} />

      {/* Main Content - Alerts First! */}
      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">

        {/* Compact Header with Title + Stats */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Risk Alerts</h1>
              </div>
              {!isLiveData && !isLoading && (
                <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-yellow-400">
                  Demo
                </span>
              )}
              {isLiveData && (
                <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-green-400">
                  ● Live
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={loadAll}
                disabled={isLoading}
                className="rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white shadow-lg shadow-red-500/25 transition-all hover:shadow-red-500/40 disabled:opacity-50"
              >
                {isLoading ? 'Syncing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Compact Stats Row */}
          <div className="flex flex-wrap gap-3 sm:gap-6 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Total:</span>
              <span className="font-semibold text-white">{alerts.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Critical:</span>
              <span className="font-semibold text-red-400">{alerts.filter(a => a.risk_level === 'EXTREME').length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">High:</span>
              <span className="font-semibold text-orange-400">{alerts.filter(a => a.risk_level === 'HIGH').length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Predictions:</span>
              <span className="font-semibold text-purple-400">{predictiveAlerts.length}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 border-b border-slate-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-3 sm:px-4 py-2 font-medium transition-colors text-sm whitespace-nowrap ${activeTab === 'current'
              ? 'border-b-2 border-red-500 text-red-400'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            🚨 Current ({alerts.length})
          </button>
          <button
            onClick={() => setActiveTab('predictive')}
            className={`px-3 sm:px-4 py-2 font-medium transition-colors text-sm whitespace-nowrap ${activeTab === 'predictive'
              ? 'border-b-2 border-orange-500 text-orange-400'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            🔮 Predictive ({predictiveAlerts.length})
          </button>
        </div>

        {/* Alert Cards */}
        {activeTab === 'current' ? (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={`${alert.ticker}-${index}`}
                className="rounded-lg sm:rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-4 sm:p-5 transition-all hover:border-slate-600 hover:bg-slate-800/80"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <RiskBadge riskLevel={alert.risk_level as any} riskScore={alert.risk_score} />
                      <h3 className="text-lg font-bold text-white">{alert.ticker}</h3>
                      <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                        {alert.exchange}
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-slate-300 line-clamp-2">{alert.message}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="font-medium">₹{alert.price.toFixed(2)}</span>
                      <span className={alert.price_change_percent >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {alert.price_change_percent >= 0 ? '+' : ''}{alert.price_change_percent.toFixed(2)}%
                      </span>
                      <span className="hidden sm:inline">{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <Link
                    href={`/stock/${alert.ticker}?exchange=${alert.exchange.toLowerCase()}`}
                    className="rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-500/25 transition-all hover:shadow-red-500/40 hover:scale-105 text-center w-full sm:w-auto"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <span className="text-4xl mb-4 block">✅</span>
                <p>No high-risk alerts at the moment.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            {predictiveAlerts.map((alert, index) => (
              <div key={`${alert.ticker}-${index}`}>
                <PredictiveAlert data={{
                  ticker: alert.ticker,
                  crash_probability: alert.crash_probability,
                  confidence: 70,
                  alert_level: alert.alert_level as 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW',
                  prediction_window: alert.predicted_window,
                  risk_score: alert.risk_score,
                  recommendation: alert.crash_probability > 70 ? 'Avoid trading' : 'Monitor closely',
                  factors: { current_risk: alert.risk_score, volatility: 0, volume_anomaly: false },
                  last_updated: new Date().toISOString(),
                }} />
              </div>
            ))}

            {predictiveAlerts.length === 0 && (
              <div className="col-span-2 text-center py-12 text-slate-400">
                <span className="text-4xl mb-4 block">🔮</span>
                <p>No predictive alerts available.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
