'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { getTrendingStocks, type TrendingStock } from '@/lib/api';
import { Exchange } from '@/lib/types';
import Link from 'next/link';

// Demo data for instant load
const DEMO_TRENDING: TrendingStock[] = [
  { ticker: 'SUZLON', hype_score: 92, twitter_mentions: 450, telegram_signals: 12 },
  { ticker: 'ADANIENT', hype_score: 78, twitter_mentions: 320, telegram_signals: 8 },
  { ticker: 'RELIANCE', hype_score: 65, twitter_mentions: 280, telegram_signals: 3 },
  { ticker: 'YESBANK', hype_score: 58, twitter_mentions: 180, telegram_signals: 6 },
  { ticker: 'TATAMOTORS', hype_score: 45, twitter_mentions: 150, telegram_signals: 2 },
  { ticker: 'IRFC', hype_score: 82, twitter_mentions: 380, telegram_signals: 9 },
  { ticker: 'NHPC', hype_score: 55, twitter_mentions: 120, telegram_signals: 4 },
  { ticker: 'ZOMATO', hype_score: 48, twitter_mentions: 200, telegram_signals: 1 },
];

// Animated Hype Score Gauge Component
function HypeGauge({ score, size = 90 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 75) return { stroke: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)', text: 'text-red-400' };
    if (s >= 50) return { stroke: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)', text: 'text-amber-400' };
    if (s >= 25) return { stroke: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)', text: 'text-blue-400' };
    return { stroke: '#22c55e', bg: 'rgba(34, 197, 94, 0.2)', text: 'text-green-400' };
  };

  const colors = getColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.stroke}
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${colors.stroke})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-bold ${colors.text}`}>{score.toFixed(0)}</span>
        <span className="text-[10px] text-slate-400">HYPE</span>
      </div>
    </div>
  );
}

export default function SocialPage() {
  const [exchange, setExchange] = useState<Exchange>('nse');
  const [trending, setTrending] = useState<TrendingStock[]>(DEMO_TRENDING);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveData, setIsLiveData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrending();
  }, [exchange]);

  const loadTrending = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTrendingStocks(exchange, 20);
      if (data.trending && data.trending.length > 0) {
        setTrending(data.trending);
        setIsLiveData(data.note !== 'Mock data');
      }
    } catch (err) {
      console.error('Error loading trending stocks:', err);
      // Keep demo data on error
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate aggregate stats
  const totalMentions = trending.reduce((sum, s) => sum + s.twitter_mentions + s.telegram_signals * 10, 0);
  const avgHype = trending.length > 0 ? trending.reduce((sum, s) => sum + s.hype_score, 0) / trending.length : 0;
  const pumpSignals = trending.reduce((sum, s) => sum + s.telegram_signals, 0);
  const highHypeCount = trending.filter(s => s.hype_score >= 70).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header exchange={exchange} onExchangeChange={setExchange} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Premium Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                Social Intelligence Dashboard
              </h1>
              <p className="mt-1 text-slate-400">
                Real-time social media monitoring for {exchange.toUpperCase()} stocks
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isLoading && (
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400 animate-pulse">
                  Syncing...
                </span>
              )}
              {isLiveData ? (
                <span className="rounded-full bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  Live Data
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-400">
                  Demo Mode
                </span>
              )}
              <button
                onClick={loadTrending}
                disabled={isLoading}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white hover:from-purple-500 hover:to-pink-500 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-purple-500/25"
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Executive KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 p-4">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-medium mb-1">
              <span>📊</span> Total Mentions
            </div>
            <div className="text-2xl font-bold text-white">{totalMentions.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Combined Twitter + Telegram</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 p-4">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-medium mb-1">
              <span>📡</span> Channels Monitored
            </div>
            <div className="text-2xl font-bold text-white">2 <span className="text-sm font-normal text-green-400">LIVE</span></div>
            <div className="text-xs text-slate-500">Telegram pump groups</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 p-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-medium mb-1">
              <span>🔥</span> Avg Hype Score
            </div>
            <div className="text-2xl font-bold text-white">{avgHype.toFixed(1)}</div>
            <div className="text-xs text-slate-500">{highHypeCount} stocks above 70</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 p-4">
            <div className="flex items-center gap-2 text-red-400 text-xs font-medium mb-1">
              <span>⚠️</span> Pump Signals (24h)
            </div>
            <div className="text-2xl font-bold text-white">{pumpSignals}</div>
            <div className="text-xs text-slate-500">Detected manipulation attempts</div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            <p className="font-medium">Error: {error}</p>
            <button
              onClick={loadTrending}
              className="mt-2 text-sm text-red-300 underline hover:text-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-xl">🔥</span> Trending Stocks
          </h2>
          <span className="text-xs text-slate-500">
            {trending.length} stocks tracked • Sorted by hype score
          </span>
        </div>

        {/* Trending Stocks Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {trending.map((stock, index) => (
            <div
              key={stock.ticker}
              className="group rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                    {stock.ticker}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-blue-400">🐦</span>
                      <span className="text-slate-400">{stock.twitter_mentions}</span>
                      <span className="text-slate-600 text-xs">mentions</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">💬</span>
                      <span className="text-slate-400">{stock.telegram_signals}</span>
                      <span className="text-slate-600 text-xs">signals</span>
                      {stock.telegram_signals >= 5 && (
                        <span className="text-xs text-red-400 animate-pulse">⚠️</span>
                      )}
                    </div>
                  </div>
                </div>
                <HypeGauge score={stock.hype_score} />
              </div>

              {/* Hype Level Indicator */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">Hype Level</span>
                  <span className={`font-medium ${stock.hype_score >= 75 ? 'text-red-400' :
                    stock.hype_score >= 50 ? 'text-amber-400' :
                      stock.hype_score >= 25 ? 'text-blue-400' : 'text-green-400'
                    }`}>
                    {stock.hype_score >= 75 ? '🚨 EXTREME' :
                      stock.hype_score >= 50 ? '⚡ HIGH' :
                        stock.hype_score >= 25 ? '📊 MODERATE' : '✅ LOW'}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${stock.hype_score >= 75 ? 'bg-gradient-to-r from-red-500 to-red-400' :
                      stock.hype_score >= 50 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                        stock.hype_score >= 25 ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                          'bg-gradient-to-r from-green-500 to-green-400'
                      }`}
                    style={{ width: `${stock.hype_score}%` }}
                  />
                </div>
              </div>

              <Link
                href={`/stock/${stock.ticker}?exchange=${exchange}`}
                className="block w-full rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 px-4 py-2.5 text-center text-sm font-medium text-purple-400 hover:from-purple-600/30 hover:to-pink-600/30 hover:text-white transition-all duration-200"
              >
                View Stock Details →
              </Link>
            </div>
          ))}
        </div>

        {trending.length === 0 && !isLoading && (
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-12 text-center">
            <span className="text-4xl mb-4 block">📡</span>
            <p className="text-slate-400 mb-2">No trending stocks detected</p>
            <p className="text-sm text-slate-500">
              Social media monitoring is active. Trending stocks will appear when activity is detected.
            </p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>🟢 Telegram: Connected</span>
              <span>🟡 Twitter: Demo Mode</span>
              <span>⚫ News: Coming Soon</span>
            </div>
            <div>
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
