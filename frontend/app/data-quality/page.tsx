'use client';

import { useEffect, useState } from 'react';
import {
  getStockQuality,
  getSocialQuality,
  getOverallQuality,
  type StockQualityReport,
  type SocialQualityReport,
  type OverallQualityReport,
} from '@/lib/api_data_engineering';

export default function DataQualityPage() {
  const [ticker, setTicker] = useState('RELIANCE');
  const [stockReport, setStockReport] = useState<StockQualityReport | null>(null);
  const [socialReport, setSocialReport] = useState<SocialQualityReport | null>(null);
  const [overallReport, setOverallReport] = useState<OverallQualityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stock, social, overall] = await Promise.all([
        getStockQuality(ticker.toUpperCase(), 7),
        getSocialQuality(ticker.toUpperCase(), 24),
        getOverallQuality(24),
      ]);
      setStockReport(stock);
      setSocialReport(social);
      setOverallReport(overall);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data quality reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Data Quality & Validation</h1>
          <p className="mt-2 text-gray-600">
            High-level data quality metrics for stock price and social media pipelines.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ticker</label>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm uppercase"
              placeholder="RELIANCE"
            />
          </div>
          <button
            onClick={loadReports}
            disabled={loading || !ticker}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Refresh Reports'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Overall quality summary */}
        {overallReport && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">24h Overall Data Quality</h2>
            <p className="text-sm text-gray-600 mb-4">
              Window: last {overallReport.window_hours} hours across all tickers.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-semibold mb-2">Stock Data</h3>
                <p>
                  <span className="font-medium">Completeness:</span>{' '}
                  {overallReport.stock.completeness.toFixed(1)}%
                </p>
                <p>
                  <span className="font-medium">Valid Ratio:</span>{' '}
                  {overallReport.stock.valid_ratio.toFixed(1)}%
                </p>
                <p>
                  <span className="font-medium">Records:</span>{' '}
                  {overallReport.stock.total_records.toLocaleString()}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Social Data</h3>
                <p>
                  <span className="font-medium">Completeness:</span>{' '}
                  {overallReport.social.completeness.toFixed(1)}%
                </p>
                <p>
                  <span className="font-medium">Valid Ratio:</span>{' '}
                  {overallReport.social.valid_ratio.toFixed(1)}%
                </p>
                <p>
                  <span className="font-medium">Records:</span>{' '}
                  {overallReport.social.total_records.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stock quality */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Stock Data Quality</h2>
            {stockReport ? (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Ticker:</span> {stockReport.ticker}
                </p>
                <p>
                  <span className="font-medium">Window:</span> last {stockReport.days} days
                </p>
                <p>
                  <span className="font-medium">Records:</span>{' '}
                  {stockReport.total_records.toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">Completeness:</span>{' '}
                  {stockReport.completeness.toFixed(1)}%
                </p>
                <p>
                  <span className="font-medium">Valid Ratio:</span>{' '}
                  {stockReport.valid_ratio.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Computed from warehouse historical stock data.
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No stock quality data yet.</p>
            )}
          </div>

          {/* Social quality */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Social Media Data Quality</h2>
            {socialReport ? (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Ticker:</span>{' '}
                  {socialReport.ticker || ticker.toUpperCase()}
                </p>
                <p>
                  <span className="font-medium">Window:</span> last {socialReport.hours} hours
                </p>
                <p>
                  <span className="font-medium">Records:</span>{' '}
                  {socialReport.total_records.toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">Completeness:</span>{' '}
                  {socialReport.completeness.toFixed(1)}%
                </p>
                <p>
                  <span className="font-medium">Valid Ratio:</span>{' '}
                  {socialReport.valid_ratio.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Computed from warehouse social_mentions data.
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No social quality data yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


