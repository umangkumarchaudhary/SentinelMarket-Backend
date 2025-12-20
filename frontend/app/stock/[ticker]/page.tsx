'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { RiskBadge } from '@/components/RiskBadge';
import { PriceChart } from '@/components/PriceChart';
import { VolumeChart } from '@/components/VolumeChart';
import { RiskTrendChart } from '@/components/RiskTrendChart';
import { RefreshIndicator } from '@/components/RefreshIndicator';
import { Toast } from '@/components/Toast';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import { getStockDetail, getStockSocial, getStockExplanation, getPatternMatches, getCrashPrediction, type StockDetail, type SocialMediaData, type ExplanationData, type PatternMatchResponse, type PredictionData } from '@/lib/api';
import CandlestickChart from '@/components/CandlestickChart';
import SocialMetrics from '@/components/SocialMetrics';
import HypeScore from '@/components/HypeScore';
import SentimentChart from '@/components/SentimentChart';
import SocialFeed from '@/components/SocialFeed';
import ExplainabilityPanel from '@/components/ExplainabilityPanel';
import PatternMatchPanel from '@/components/PatternMatchPanel';
import PredictiveAlert from '@/components/PredictiveAlert';
import { Exchange } from '@/lib/types';
import Link from 'next/link';

// Generate demo stock data for instant display
function generateDemoStock(ticker: string, exchange: string): StockDetail {
  const basePrice = Math.random() * 2000 + 100;
  const riskScore = Math.random() * 40 + 50; // 50-90 range for demo
  const riskLevel = riskScore >= 80 ? 'EXTREME' : riskScore >= 60 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW';

  // Generate chart data for last 30 days
  const chartData = [];
  let price = basePrice;
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const open = price;
    const change = (Math.random() - 0.5) * price * 0.05;
    const close = price + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    chartData.push({
      date: date.toISOString(),
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    });
    price = close;
  }

  // Generate risk history
  const riskHistory = chartData.map((d, i) => ({
    date: d.date,
    risk_score: Math.min(100, Math.max(0, riskScore + (Math.random() - 0.5) * 20)),
  }));

  return {
    ticker,
    exchange: exchange.toUpperCase(),
    risk_score: riskScore,
    risk_level: riskLevel as any,
    is_suspicious: riskScore >= 60,
    price: price,
    price_change_percent: (Math.random() - 0.3) * 10,
    volume: Math.floor(Math.random() * 50000000) + 5000000,
    last_updated: new Date().toISOString(),
    recommendation: riskScore >= 70 ? 'Avoid trading - High manipulation risk detected' : 'Monitor closely - Elevated risk indicators present',
    explanation: `${ticker} is showing ${riskLevel.toLowerCase()} risk patterns. Our ML models have detected unusual trading activity that warrants attention. Volume is ${Math.floor(Math.random() * 200 + 100)}% above average.`,
    red_flags: [
      'Unusual volume spike detected',
      'Social media mentions increasing rapidly',
      'Price momentum exceeds normal ranges',
    ].slice(0, Math.floor(Math.random() * 3) + 1),
    individual_scores: {
      volume_spike: Math.random() * 40 + 30,
      price_anomaly: Math.random() * 40 + 20,
      ml_anomaly: Math.random() * 40 + 25,
      social_sentiment: Math.random() * 40 + 15,
    },
    ml_status: {
      enabled: true,
      score: Math.random() * 30 + 50,
    },
    chart_data: chartData,
    risk_history: riskHistory,
    details: {},
  };
}

// Generate demo explanation data
function generateDemoExplanation(ticker: string): ExplanationData {
  return {
    ticker,
    risk_score: 72.5,
    risk_level: 'HIGH',
    explanation: 'Multiple risk factors detected including unusual volume patterns and social media coordination signals.',
    red_flags: ['Volume anomaly', 'Social media hype', 'Rapid price movement'],
    feature_importance: {
      volume_change: 0.35,
      price_momentum: 0.25,
      social_mentions: 0.20,
      volatility: 0.15,
      market_correlation: 0.05,
    },
    top_contributions: [
      { feature: 'volume_change', contribution: 0.35, impact: 'high' },
      { feature: 'price_momentum', contribution: 0.25, impact: 'high' },
      { feature: 'social_mentions', contribution: 0.20, impact: 'medium' },
    ],
    detector_scores: {
      volume: 78,
      price: 65,
      ml: 72,
      social: 58,
    },
    ml_status: { enabled: true, score: 72 },
    last_updated: new Date().toISOString(),
  };
}

// Generate demo pattern data
function generateDemoPattern(ticker: string): PatternMatchResponse {
  return {
    ticker,
    current_pattern: {
      type: 'potential_pump',
      price_change_30d: 15.5,
      volume_spike: 180.5,
      risk_score: 68.0,
    },
    historical_matches: [
      {
        stock: 'YESBANK',
        date: '2020-03-01',
        similarity: 78.5,
        outcome: 'Crash: -45% in 10 days',
        pattern_type: 'pump_pattern',
      },
      {
        stock: 'RPOWER',
        date: '2021-06-15',
        similarity: 72.3,
        outcome: 'Crash: -32% in 7 days',
        pattern_type: 'pump_pattern',
      },
    ],
    best_match: {
      stock: 'YESBANK',
      date: '2020-03-01',
      similarity: 78.5,
      outcome: 'Crash: -45% in 10 days',
      pattern_type: 'pump_pattern',
    },
    similarity_score: 78.5,
    warning: 'Pattern similarity to historical manipulation events detected',
    last_updated: new Date().toISOString(),
  };
}

// Generate demo prediction data
function generateDemoPrediction(ticker: string): PredictionData {
  return {
    ticker,
    crash_probability: 62.5,
    confidence: 75,
    alert_level: 'HIGH',
    prediction_window: '7 days',
    risk_score: 68.5,
    recommendation: 'Monitor closely - elevated crash risk',
    factors: {
      current_risk: 68.5,
      volatility: 15.2,
      volume_anomaly: true,
    },
    last_updated: new Date().toISOString(),
  };
}

// Retry helper with exponential backoff
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

export default function StockDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticker = params.ticker as string;
  const exchangeParam = searchParams.get('exchange') || 'nse';
  const exchange = (exchangeParam === 'bse' ? 'bse' : 'nse') as Exchange;

  // Initialize with demo data immediately
  const [stock, setStock] = useState<StockDetail>(() => generateDemoStock(ticker, exchange));
  const [socialData, setSocialData] = useState<SocialMediaData | null>(null);
  const [explanationData, setExplanationData] = useState<ExplanationData>(() => generateDemoExplanation(ticker));
  const [patternData, setPatternData] = useState<PatternMatchResponse>(() => generateDemoPattern(ticker));
  const [predictionData, setPredictionData] = useState<PredictionData>(() => generateDemoPrediction(ticker));
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveData, setIsLiveData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  const loadStockDetail = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const [detail, social, explanation, patterns, prediction] = await Promise.allSettled([
        fetchWithRetry(() => getStockDetail(ticker, exchange)),
        fetchWithRetry(() => getStockSocial(ticker, exchange)),
        fetchWithRetry(() => getStockExplanation(ticker, exchange)),
        fetchWithRetry(() => getPatternMatches(ticker, exchange)),
        fetchWithRetry(() => getCrashPrediction(ticker, exchange)),
      ]);

      let hasLiveData = false;

      if (detail.status === 'fulfilled' && detail.value) {
        setStock(detail.value);
        hasLiveData = true;
      }
      if (social.status === 'fulfilled') setSocialData(social.value);
      if (explanation.status === 'fulfilled') setExplanationData(explanation.value);
      if (patterns.status === 'fulfilled') setPatternData(patterns.value);
      if (prediction.status === 'fulfilled') setPredictionData(prediction.value);

      setIsLiveData(hasLiveData);

      if (hasLiveData) {
        setToast({ message: 'Live data loaded', type: 'success' });
      }
    } catch (err) {
      console.error('Error loading stock detail:', err);
      // Keep demo data on error
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [ticker, exchange]);

  const { lastRefresh, isRefreshing, refresh } = useAutoRefresh({
    interval: 60000,
    enabled: autoRefreshEnabled && !isLoading,
    onRefresh: loadStockDetail,
  });

  // Load real data in background after initial render
  useEffect(() => {
    // Regenerate demo data for new ticker
    setStock(generateDemoStock(ticker, exchange));
    setExplanationData(generateDemoExplanation(ticker));
    setPatternData(generateDemoPattern(ticker));
    setPredictionData(generateDemoPrediction(ticker));
    setIsLiveData(false);

    // Then fetch real data
    loadStockDetail(false);
  }, [ticker, exchange, loadStockDetail]);

  const handleManualRefresh = async () => {
    setIsLoading(true);
    await loadStockDetail(false);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header exchange={exchange} onExchangeChange={(e) => router.push(`/stock/${ticker}?exchange=${e}`)} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/"
          className="mb-4 inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">
                  {stock.ticker} ({stock.exchange})
                </h1>
                {!isLiveData && !isLoading && (
                  <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-400 animate-pulse">
                    Demo Mode
                  </span>
                )}
                {isLiveData && (
                  <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                    ● Live Data
                  </span>
                )}
                {isLoading && (
                  <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400 animate-pulse">
                    Syncing...
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <p className="text-sm text-slate-400">
                  Last updated: {new Date(stock.last_updated).toLocaleString()}
                </p>
                <RefreshIndicator lastRefresh={lastRefresh} isRefreshing={isRefreshing} />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <RiskBadge riskLevel={stock.risk_level} riskScore={stock.risk_score} size="lg" />
              <button
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-white"></div>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Risk Assessment Card */}
        <div className="mb-8 rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Risk Assessment</h2>
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Risk Score</span>
              <span className="text-2xl font-bold text-white">{(stock.risk_score ?? 0).toFixed(1)}/100</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all"
                style={{ width: `${stock.risk_score ?? 0}%` }}
              ></div>
            </div>
          </div>
          <div className="rounded-lg bg-slate-700/50 p-4">
            <p className="font-medium text-white">Recommendation:</p>
            <p className="mt-1 text-slate-300">{stock.recommendation}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {stock.chart_data && stock.chart_data.length > 0 && (
            <>
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Price Chart (Candlestick)</h3>
                <CandlestickChart data={stock.chart_data} />
              </div>
              <VolumeChart data={stock.chart_data} />
            </>
          )}
        </div>

        {stock.risk_history && stock.risk_history.length > 0 && (
          <div className="mb-8">
            <RiskTrendChart data={stock.risk_history} />
          </div>
        )}

        {/* Detection Breakdown */}
        <div className="mb-8 rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Detection Breakdown</h2>
          <div className="space-y-4">
            {[
              { label: 'Volume Spike', value: stock.individual_scores?.volume_spike ?? 0, color: 'from-blue-500 to-blue-400' },
              { label: 'Price Anomaly', value: stock.individual_scores?.price_anomaly ?? 0, color: 'from-purple-500 to-purple-400' },
              { label: 'ML Anomaly Detection', value: stock.individual_scores?.ml_anomaly ?? 0, color: 'from-pink-500 to-pink-400' },
              { label: 'Social Sentiment', value: stock.individual_scores?.social_sentiment ?? 0, color: 'from-orange-500 to-orange-400' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="font-medium text-white">{value.toFixed(1)}/100</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                  <div className={`h-full bg-gradient-to-r ${color}`} style={{ width: `${value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Red Flags */}
        {stock.red_flags && stock.red_flags.length > 0 && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-6">
            <h2 className="mb-4 text-xl font-semibold text-red-400">⚠️ Red Flags</h2>
            <ul className="list-disc space-y-2 pl-5">
              {stock.red_flags.map((flag, idx) => (
                <li key={idx} className="text-red-300">
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Metrics */}
        <div className="mb-8 rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Key Metrics</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-slate-700/50 p-4">
              <p className="text-sm text-slate-400">Current Price</p>
              <p className="text-2xl font-bold text-white">₹{(stock.price ?? 0).toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-4">
              <p className="text-sm text-slate-400">Price Change</p>
              <p className={`text-2xl font-bold ${(stock.price_change_percent ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(stock.price_change_percent ?? 0) >= 0 ? '+' : ''}
                {(stock.price_change_percent ?? 0).toFixed(2)}%
              </p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-4">
              <p className="text-sm text-slate-400">Volume</p>
              <p className="text-2xl font-bold text-white">
                {((stock.volume ?? 0) / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-4">
              <p className="text-sm text-slate-400">ML Status</p>
              <p className="text-2xl font-bold text-white">
                {stock.ml_status?.enabled ? '✅ Enabled' : '❌ Disabled'}
              </p>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="mb-8 rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Analysis Explanation</h2>
          <p className="text-slate-300">{stock.explanation}</p>
        </div>

        {/* Phase 5: Advanced Features */}

        {/* Social Media Section */}
        {socialData && (
          <div className="mb-8 space-y-6">
            <h2 className="text-2xl font-bold text-white">Social Media Analysis</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <SocialMetrics data={socialData} />
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 flex flex-col items-center justify-center">
                <HypeScore score={socialData.combined_hype_score} />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <SentimentChart data={socialData.twitter.sentiment_distribution} />
              <SocialFeed mentions={socialData.twitter.recent_mentions} platform="twitter" />
            </div>
            {socialData.telegram.recent_mentions.length > 0 && (
              <SocialFeed mentions={socialData.telegram.recent_mentions} platform="telegram" />
            )}
          </div>
        )}

        {/* ML Explainability */}
        {explanationData && (
          <div className="mb-8">
            <ExplainabilityPanel data={explanationData} />
          </div>
        )}

        {/* Pattern Matching */}
        {patternData && (
          <div className="mb-8">
            <PatternMatchPanel data={patternData} />
          </div>
        )}

        {/* Predictive Alert */}
        {predictionData && (
          <div className="mb-8">
            <PredictiveAlert data={predictionData} />
          </div>
        )}
      </main>
    </div>
  );
}
