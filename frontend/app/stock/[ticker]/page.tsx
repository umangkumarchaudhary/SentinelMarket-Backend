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

export default function StockDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticker = params.ticker as string;
  const exchangeParam = searchParams.get('exchange') || 'nse';
  const exchange = (exchangeParam === 'bse' ? 'bse' : 'nse') as Exchange;

  const [stock, setStock] = useState<StockDetail | null>(null);
  const [socialData, setSocialData] = useState<SocialMediaData | null>(null);
  const [explanationData, setExplanationData] = useState<ExplanationData | null>(null);
  const [patternData, setPatternData] = useState<PatternMatchResponse | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false); // Disabled by default for detail page

  const loadStockDetail = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [detail, social, explanation, patterns, prediction] = await Promise.allSettled([
        getStockDetail(ticker, exchange),
        getStockSocial(ticker, exchange),
        getStockExplanation(ticker, exchange),
        getPatternMatches(ticker, exchange),
        getCrashPrediction(ticker, exchange),
      ]);
      
      if (detail.status === 'fulfilled') setStock(detail.value);
      if (social.status === 'fulfilled') setSocialData(social.value);
      if (explanation.status === 'fulfilled') setExplanationData(explanation.value);
      if (patterns.status === 'fulfilled') setPatternData(patterns.value);
      if (prediction.status === 'fulfilled') setPredictionData(prediction.value);
      
      if (detail.status === 'rejected') {
        const errorMessage = detail.reason instanceof Error ? detail.reason.message : 'Failed to load stock data';
        setError(errorMessage);
        setToast({ message: errorMessage, type: 'error' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stock data';
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
      console.error('Error loading stock detail:', err);
    } finally {
      setIsLoading(false);
    }
  }, [ticker, exchange]);

  const { lastRefresh, isRefreshing, refresh } = useAutoRefresh({
    interval: 60000, // 60 seconds for detail page
    enabled: autoRefreshEnabled && !isLoading,
    onRefresh: loadStockDetail,
  });

  useEffect(() => {
    loadStockDetail();
  }, [ticker, exchange, loadStockDetail]);

  const handleManualRefresh = async () => {
    await refresh();
    setToast({ message: 'Stock data refreshed', type: 'success' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header exchange={exchange} onExchangeChange={(e) => router.push(`/stock/${ticker}?exchange=${e}`)} />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="h-32 animate-pulse rounded-lg bg-gray-200"></div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
              <div className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
            </div>
            <div className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header exchange={exchange} onExchangeChange={(e) => router.push(`/stock/${ticker}?exchange=${e}`)} />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            <p className="font-medium">Error: {error || 'Stock not found'}</p>
            <Link href="/" className="mt-2 inline-block text-sm text-red-600 underline">
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header exchange={exchange} onExchangeChange={(e) => router.push(`/stock/${ticker}?exchange=${e}`)} />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/"
          className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-black"
        >
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">
                {stock.ticker} ({stock.exchange})
              </h1>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <p className="text-sm text-gray-600">
                  Last updated: {new Date(stock.last_updated).toLocaleString()}
                </p>
                <RefreshIndicator lastRefresh={lastRefresh} isRefreshing={isRefreshing} />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <RiskBadge riskLevel={stock.risk_level} riskScore={stock.risk_score} size="lg" />
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefreshing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
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
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-black">Risk Assessment</h2>
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Risk Score</span>
              <span className="text-2xl font-bold text-black">{stock.risk_score.toFixed(1)}/100</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-red-600 transition-all"
                style={{ width: `${stock.risk_score}%` }}
              ></div>
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="font-medium text-black">Recommendation:</p>
            <p className="mt-1 text-gray-700">{stock.recommendation}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {stock.chart_data && stock.chart_data.length > 0 && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Price Chart (Candlestick)</h3>
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
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-black">Detection Breakdown</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Volume Spike</span>
              <span className="font-medium text-black">
                {stock.individual_scores.volume_spike.toFixed(1)}/100
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${stock.individual_scores.volume_spike}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Price Anomaly</span>
              <span className="font-medium text-black">
                {stock.individual_scores.price_anomaly.toFixed(1)}/100
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${stock.individual_scores.price_anomaly}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ML Anomaly Detection</span>
              <span className="font-medium text-black">
                {stock.individual_scores.ml_anomaly.toFixed(1)}/100
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${stock.individual_scores.ml_anomaly}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Social Sentiment</span>
              <span className="font-medium text-black">
                {stock.individual_scores.social_sentiment.toFixed(1)}/100
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${stock.individual_scores.social_sentiment}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Red Flags */}
        {stock.red_flags.length > 0 && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-6">
            <h2 className="mb-4 text-xl font-semibold text-red-800">Red Flags</h2>
            <ul className="list-disc space-y-2 pl-5">
              {stock.red_flags.map((flag, idx) => (
                <li key={idx} className="text-red-700">
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Metrics */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-black">Key Metrics</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-600">Current Price</p>
              <p className="text-2xl font-bold text-black">₹{stock.current_price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Price Change</p>
              <p
                className={`text-2xl font-bold ${
                  stock.price_change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stock.price_change_percent >= 0 ? '+' : ''}
                {stock.price_change_percent.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Volume</p>
              <p className="text-2xl font-bold text-black">
                {(stock.volume / 1000000).toFixed(2)}M
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ML Status</p>
              <p className="text-2xl font-bold text-black">
                {stock.ml_status.enabled ? '✅ Enabled' : '❌ Disabled'}
              </p>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-black">Analysis Explanation</h2>
          <p className="text-gray-700">{stock.explanation}</p>
        </div>

        {/* Phase 5: Advanced Features */}
        
        {/* Social Media Section */}
        {socialData && (
          <div className="mb-8 space-y-6">
            <h2 className="text-2xl font-bold text-black">Social Media Analysis</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <SocialMetrics data={socialData} />
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center">
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

