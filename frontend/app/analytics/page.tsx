'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import {
  getAnalytics,
  getHeatmapData,
  getCorrelationMatrix,
  getTrendingStocks,
  type Analytics,
  type HeatmapItem,
  type TrendingStock
} from '@/lib/api';
import { Exchange } from '@/lib/types';
import RiskHeatmap from '@/components/RiskHeatmap';
import CorrelationHeatmap from '@/components/CorrelationHeatmap';
import Link from 'next/link';

// Demo data for instant display
const DEMO_ANALYTICS: Analytics = {
  total_stocks: 50,
  risk_distribution: { low: 25, medium: 15, high: 7, extreme: 3 },
  average_risk_score: 42.5,
  high_risk_count: 10,
  exchange: 'NSE'
};

const DEMO_HEATMAP: HeatmapItem[] = [
  { ticker: 'RELIANCE', risk_score: 32, risk_level: 'LOW', price: 2450.50 },
  { ticker: 'TCS', risk_score: 28, risk_level: 'LOW', price: 3850.25 },
  { ticker: 'HDFCBANK', risk_score: 45, risk_level: 'MEDIUM', price: 1650.75 },
  { ticker: 'INFY', risk_score: 38, risk_level: 'LOW', price: 1520.00 },
  { ticker: 'ADANIENT', risk_score: 78, risk_level: 'HIGH', price: 2850.25 },
  { ticker: 'SUZLON', risk_score: 85, risk_level: 'EXTREME', price: 42.15 },
  { ticker: 'YESBANK', risk_score: 72, risk_level: 'HIGH', price: 24.80 },
  { ticker: 'ICICIBANK', risk_score: 35, risk_level: 'LOW', price: 1050.50 },
  { ticker: 'BHARTIARTL', risk_score: 42, risk_level: 'MEDIUM', price: 1250.25 },
  { ticker: 'SBIN', risk_score: 48, risk_level: 'MEDIUM', price: 650.75 },
  { ticker: 'TATAMOTORS', risk_score: 55, risk_level: 'MEDIUM', price: 950.50 },
  { ticker: 'WIPRO', risk_score: 30, risk_level: 'LOW', price: 450.50 },
];

const DEMO_TRENDING: TrendingStock[] = [
  { ticker: 'SUZLON', hype_score: 92, twitter_mentions: 450, telegram_signals: 12 },
  { ticker: 'ADANIENT', hype_score: 78, twitter_mentions: 320, telegram_signals: 8 },
  { ticker: 'RELIANCE', hype_score: 65, twitter_mentions: 280, telegram_signals: 3 },
  { ticker: 'YESBANK', hype_score: 58, twitter_mentions: 180, telegram_signals: 6 },
  { ticker: 'TATAMOTORS', hype_score: 45, twitter_mentions: 150, telegram_signals: 2 },
];

export default function AnalyticsPage() {
  const [exchange, setExchange] = useState<Exchange>('nse');
  const [analytics, setAnalytics] = useState<Analytics>(DEMO_ANALYTICS);
  const [heatmapData, setHeatmapData] = useState<HeatmapItem[]>(DEMO_HEATMAP);
  const [correlationData, setCorrelationData] = useState<any>(null);
  const [trendingData, setTrendingData] = useState<TrendingStock[]>(DEMO_TRENDING);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveData, setIsLiveData] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'correlation' | 'social'>('overview');

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, heatmapRes, correlationRes, trendingRes] = await Promise.allSettled([
        getAnalytics(exchange),
        getHeatmapData(exchange, 50),
        getCorrelationMatrix(exchange, undefined, 20),
        getTrendingStocks(exchange, 10),
      ]);

      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value);
        setIsLiveData(true);
      }
      if (heatmapRes.status === 'fulfilled' && heatmapRes.value.heatmap) {
        setHeatmapData(heatmapRes.value.heatmap);
      }
      if (correlationRes.status === 'fulfilled') {
        setCorrelationData(correlationRes.value);
      }
      if (trendingRes.status === 'fulfilled' && trendingRes.value.trending) {
        setTrendingData(trendingRes.value.trending);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [exchange]);

  useEffect(() => {
    loadAnalytics();
  }, [exchange, loadAnalytics]);

  // Calculate percentages for donut chart
  const total = analytics.total_stocks || 1;
  const riskPercentages = {
    low: Math.round((analytics.risk_distribution.low / total) * 100),
    medium: Math.round((analytics.risk_distribution.medium / total) * 100),
    high: Math.round((analytics.risk_distribution.high / total) * 100),
    extreme: Math.round((analytics.risk_distribution.extreme / total) * 100),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header exchange={exchange} onExchangeChange={setExchange} />

      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-white">Analytics Dashboard</h1>
              {!isLiveData && !isLoading && (
                <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-yellow-400">Demo</span>
              )}
              {isLiveData && (
                <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-green-400">● Live</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMethodology(!showMethodology)}
                className="rounded-lg bg-slate-700/50 border border-slate-600 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
              >
                {showMethodology ? 'Hide' : 'How Analytics Work'}
              </button>
              <button
                onClick={loadAnalytics}
                disabled={isLoading}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* How Analytics Work - Collapsible */}
        {showMethodology && (
          <div className="mb-6 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/50 border border-slate-700/50 p-4 sm:p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-blue-400">📊</span> Analytics Methodology
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Data Sources */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Data Sources</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                    <span className="text-xl">📈</span>
                    <div>
                      <div className="font-medium text-white text-sm">Yahoo Finance API</div>
                      <div className="text-xs text-slate-400">Historical OHLCV data (Open, High, Low, Close, Volume) for 3 months</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                    <span className="text-xl">💹</span>
                    <div>
                      <div className="font-medium text-white text-sm">NSE/BSE Real-time</div>
                      <div className="text-xs text-slate-400">Live price updates and market indices (NIFTY 50, SENSEX, BANK NIFTY)</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                    <span className="text-xl">📱</span>
                    <div>
                      <div className="font-medium text-white text-sm">Social Media Signals</div>
                      <div className="text-xs text-slate-400">Telegram pump channels & Twitter sentiment analysis for hype detection</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Calculation */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Risk Score Formula</h4>
                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-600/30 font-mono text-sm">
                  <div className="text-slate-400 mb-2">// Final Risk Score (0-100)</div>
                  <div className="text-green-400">Risk = </div>
                  <div className="pl-4 text-orange-400">Volume_Spike × <span className="text-white">0.30</span> +</div>
                  <div className="pl-4 text-yellow-400">Price_Anomaly × <span className="text-white">0.25</span> +</div>
                  <div className="pl-4 text-purple-400">ML_Anomaly × <span className="text-white">0.25</span> +</div>
                  <div className="pl-4 text-sky-400">Social_Signal × <span className="text-white">0.20</span></div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20">
                    <div className="font-medium text-orange-400">Volume Spike</div>
                    <div className="text-slate-400">Z-score vs 20-day avg</div>
                  </div>
                  <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                    <div className="font-medium text-yellow-400">Price Anomaly</div>
                    <div className="text-slate-400">Abnormal price moves</div>
                  </div>
                  <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
                    <div className="font-medium text-purple-400">ML Anomaly</div>
                    <div className="text-slate-400">Isolation Forest model</div>
                  </div>
                  <div className="p-2 rounded bg-sky-500/10 border border-sky-500/20">
                    <div className="font-medium text-sky-400">Social Signal</div>
                    <div className="text-slate-400">Pump hype detection</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Who Benefits */}
            <div className="mt-6 pt-4 border-t border-slate-700/50">
              <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Who Benefits</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { role: 'Risk Managers', desc: 'Portfolio risk assessment' },
                  { role: 'Trading Desks', desc: 'Avoid manipulation traps' },
                  { role: 'Compliance Teams', desc: 'Market monitoring' },
                  { role: 'Research Analysts', desc: 'Deep dive analysis' },
                ].map((item, i) => (
                  <div key={i} className="px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600/50 text-xs">
                    <span className="font-medium text-white">{item.role}</span>
                    <span className="text-slate-400"> – {item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Executive KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* Total Stocks */}
          <div className="rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/50 border border-slate-700/50 p-4 sm:p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs sm:text-sm">Stocks Monitored</span>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{analytics.total_stocks}</div>
            <div className="text-xs text-slate-500 mt-1">{exchange.toUpperCase()} Exchange</div>
          </div>

          {/* High Risk */}
          <div className="rounded-xl bg-gradient-to-br from-red-900/30 to-slate-800/50 border border-red-500/20 p-4 sm:p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-400 text-xs sm:text-sm">High Risk</span>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-red-400">{analytics.high_risk_count}</div>
            <div className="text-xs text-slate-500 mt-1">Requires attention</div>
          </div>

          {/* Avg Risk Score */}
          <div className="rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/50 border border-slate-700/50 p-4 sm:p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs sm:text-sm">Avg Risk Score</span>
              <span className="text-2xl">📉</span>
            </div>
            <div className="flex items-end gap-2">
              <span className={`text-2xl sm:text-3xl font-bold ${analytics.average_risk_score >= 60 ? 'text-red-400' :
                  analytics.average_risk_score >= 40 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                {analytics.average_risk_score.toFixed(1)}
              </span>
              <span className="text-slate-500 text-sm mb-1">/ 100</span>
            </div>
            <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${analytics.average_risk_score >= 60 ? 'bg-red-500' :
                    analytics.average_risk_score >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                style={{ width: `${analytics.average_risk_score}%` }}
              />
            </div>
          </div>

          {/* Market Status */}
          <div className="rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/50 border border-slate-700/50 p-4 sm:p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs sm:text-sm">Market Status</span>
              <span className="text-2xl">🏛️</span>
            </div>
            {(() => {
              const hour = new Date().getHours();
              const isOpen = hour >= 9 && hour < 16;
              return (
                <>
                  <div className={`text-2xl sm:text-3xl font-bold ${isOpen ? 'text-green-400' : 'text-slate-400'}`}>
                    {isOpen ? 'OPEN' : 'CLOSED'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {isOpen ? 'Trading active' : 'Opens 9:15 AM IST'}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4 flex gap-1 border-b border-slate-700 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Overview', count: null },
            { id: 'heatmap', label: '🔥 Risk Heatmap', count: heatmapData.length },
            { id: 'correlation', label: '🔗 Correlations', count: null },
            { id: 'social', label: '📱 Social Signals', count: trendingData.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 sm:px-4 py-2 font-medium transition-colors text-sm whitespace-nowrap ${activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              {tab.label} {tab.count !== null && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Risk Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribution Chart */}
              <div className="rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/50 border border-slate-700/50 p-5 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4">Risk Distribution</h3>
                <div className="flex items-center gap-8">
                  {/* Simple Donut Representation */}
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="12" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="12"
                        strokeDasharray={`${riskPercentages.low * 2.51} 251.2`} strokeDashoffset="0" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#eab308" strokeWidth="12"
                        strokeDasharray={`${riskPercentages.medium * 2.51} 251.2`}
                        strokeDashoffset={`${-riskPercentages.low * 2.51}`} />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f97316" strokeWidth="12"
                        strokeDasharray={`${riskPercentages.high * 2.51} 251.2`}
                        strokeDashoffset={`${-(riskPercentages.low + riskPercentages.medium) * 2.51}`} />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="12"
                        strokeDasharray={`${riskPercentages.extreme * 2.51} 251.2`}
                        strokeDashoffset={`${-(riskPercentages.low + riskPercentages.medium + riskPercentages.high) * 2.51}`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">{analytics.total_stocks}</div>
                        <div className="text-[10px] text-slate-400">Stocks</div>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex-1 space-y-2">
                    {[
                      { label: 'Low Risk', value: analytics.risk_distribution.low, pct: riskPercentages.low, color: 'bg-green-500' },
                      { label: 'Medium Risk', value: analytics.risk_distribution.medium, pct: riskPercentages.medium, color: 'bg-yellow-500' },
                      { label: 'High Risk', value: analytics.risk_distribution.high, pct: riskPercentages.high, color: 'bg-orange-500' },
                      { label: 'Extreme Risk', value: analytics.risk_distribution.extreme, pct: riskPercentages.extreme, color: 'bg-red-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="text-sm text-slate-300">{item.label}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold text-white">{item.value}</span>
                          <span className="text-slate-500 ml-1">({item.pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Risk Stocks */}
              <div className="rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/50 border border-slate-700/50 p-5 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4">Top Risk Stocks</h3>
                <div className="space-y-2">
                  {heatmapData
                    .sort((a, b) => b.risk_score - a.risk_score)
                    .slice(0, 5)
                    .map((stock, i) => (
                      <Link
                        key={stock.ticker}
                        href={`/stock/${stock.ticker}?exchange=${exchange}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors border border-slate-600/30"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-500">#{i + 1}</span>
                          <span className="font-semibold text-white">{stock.ticker}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-400">₹{stock.price.toFixed(2)}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${stock.risk_level === 'EXTREME' ? 'bg-red-500/20 text-red-400' :
                              stock.risk_level === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                                stock.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-green-500/20 text-green-400'
                            }`}>
                            {stock.risk_score}
                          </span>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/50 border border-slate-700/50 p-5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-2">Risk Heatmap</h3>
            <p className="text-sm text-slate-400 mb-4">Click any stock to analyze. Color indicates risk level.</p>
            <RiskHeatmap data={heatmapData} />
          </div>
        )}

        {activeTab === 'correlation' && (
          <div className="rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/50 border border-slate-700/50 p-5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-2">Stock Correlations</h3>
            <p className="text-sm text-slate-400 mb-4">
              Identify stocks that move together. High correlation between risky stocks indicates sector-wide issues.
            </p>
            {correlationData?.correlation ? (
              <CorrelationHeatmap correlation={correlationData.correlation} tickers={correlationData.tickers} />
            ) : (
              <div className="text-center py-12 text-slate-400">
                <span className="text-4xl mb-4 block">🔗</span>
                <p>Loading correlation data...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'social' && (
          <div className="rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/50 border border-slate-700/50 p-5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-2">Social Media Signals</h3>
            <p className="text-sm text-slate-400 mb-4">
              Stocks trending on social media with high hype scores may indicate pump-and-dump activity.
            </p>
            <div className="space-y-3">
              {trendingData.map((stock, i) => (
                <Link
                  key={stock.ticker}
                  href={`/stock/${stock.ticker}?exchange=${exchange}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors border border-slate-600/30"
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-bold ${stock.hype_score >= 80 ? 'text-red-400' :
                        stock.hype_score >= 60 ? 'text-orange-400' :
                          stock.hype_score >= 40 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                      #{i + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-white">{stock.ticker}</div>
                      <div className="text-xs text-slate-400">
                        🐦 {stock.twitter_mentions} mentions • 📱 {stock.telegram_signals} signals
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{stock.hype_score}</div>
                    <div className="text-xs text-slate-400">Hype Score</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
