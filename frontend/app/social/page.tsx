'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { getTrendingStocks, type TrendingStock } from '@/lib/api';
import { Exchange } from '@/lib/types';
import Link from 'next/link';
import HypeScore from '@/components/HypeScore';

export default function SocialPage() {
  const [exchange, setExchange] = useState<Exchange>('nse');
  const [trending, setTrending] = useState<TrendingStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrending();
  }, [exchange]);

  const loadTrending = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTrendingStocks(exchange, 20);
      setTrending(data.trending);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trending stocks');
      console.error('Error loading trending stocks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header exchange={exchange} onExchangeChange={setExchange} />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Social Media Trending</h1>
          <p className="mt-2 text-gray-600">
            Stocks trending on social media for {exchange.toUpperCase()}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            <p className="font-medium">Error: {error}</p>
            <button
              onClick={loadTrending}
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
        ) : trending.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-500">No trending stocks at this time</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trending.map((stock) => (
              <div
                key={stock.ticker}
                className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-black">{stock.ticker}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {stock.twitter_mentions} Twitter mentions
                    </p>
                    <p className="text-sm text-gray-600">
                      {stock.telegram_signals} Telegram signals
                    </p>
                  </div>
                  <HypeScore score={stock.hype_score} size={80} />
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Hype Score</span>
                    <span className={`font-bold ${
                      stock.hype_score >= 70 ? 'text-red-600' :
                      stock.hype_score >= 40 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {stock.hype_score.toFixed(1)}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/stock/${stock.ticker}?exchange=${exchange}`}
                  className="mt-4 block w-full rounded-md bg-red-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-red-700"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={loadTrending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Refresh Trending
          </button>
        </div>
      </main>
    </div>
  );
}

