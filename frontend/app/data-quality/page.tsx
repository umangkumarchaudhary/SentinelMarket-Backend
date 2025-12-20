'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import {
  getStockQuality,
  getSocialQuality,
  getOverallQuality,
  type StockQualityReport,
  type SocialQualityReport,
  type OverallQualityReport,
} from '@/lib/api_data_engineering';
import { Exchange } from '@/lib/types';

// Demo data for instant load
const DEMO_STOCK_REPORT: StockQualityReport = {
  type: 'stock',
  ticker: 'RELIANCE',
  days: 7,
  completeness: 98.5,
  valid_ratio: 96.2,
  total_records: 2016,
  timestamp: new Date().toISOString()
};

const DEMO_SOCIAL_REPORT: SocialQualityReport = {
  type: 'social',
  ticker: 'RELIANCE',
  hours: 24,
  completeness: 94.8,
  valid_ratio: 91.5,
  total_records: 342,
  timestamp: new Date().toISOString()
};

const DEMO_OVERALL: OverallQualityReport = {
  window_hours: 24,
  stock: { type: 'stock', ticker: 'ALL', days: 7, completeness: 97.2, valid_ratio: 95.8, total_records: 15240, timestamp: new Date().toISOString() },
  social: { type: 'social', hours: 24, completeness: 93.5, valid_ratio: 89.2, total_records: 4520, timestamp: new Date().toISOString() }
};

// Animated Quality Gauge Component
function QualityGauge({ value, label, size = 100, color }: { value: number; label: string; size?: number; color: string }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;

  const getGradeColor = (v: number) => {
    if (v >= 95) return { grade: 'A+', color: '#22c55e' };
    if (v >= 90) return { grade: 'A', color: '#22c55e' };
    if (v >= 80) return { grade: 'B', color: '#3b82f6' };
    if (v >= 70) return { grade: 'C', color: '#f59e0b' };
    return { grade: 'D', color: '#ef4444' };
  };

  const grade = getGradeColor(value);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{value.toFixed(1)}%</span>
          <span className="text-xs px-2 py-0.5 rounded-full mt-1" style={{ backgroundColor: `${grade.color}30`, color: grade.color }}>
            Grade {grade.grade}
          </span>
        </div>
      </div>
      <span className="text-sm text-slate-400 mt-2">{label}</span>
    </div>
  );
}

export default function DataQualityPage() {
  const [exchange, setExchange] = useState<Exchange>('nse');
  const [ticker, setTicker] = useState('RELIANCE');
  const [stockReport, setStockReport] = useState<StockQualityReport | null>(DEMO_STOCK_REPORT);
  const [socialReport, setSocialReport] = useState<SocialQualityReport | null>(DEMO_SOCIAL_REPORT);
  const [overallReport, setOverallReport] = useState<OverallQualityReport | null>(DEMO_OVERALL);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveData, setIsLiveData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    setIsLoading(true);
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
      setIsLiveData(true);
    } catch (err) {
      console.error('Error loading quality reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Calculate overall quality score
  const overallScore = overallReport
    ? (overallReport.stock.completeness + overallReport.stock.valid_ratio + overallReport.social.completeness + overallReport.social.valid_ratio) / 4
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header exchange={exchange} onExchangeChange={setExchange} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Premium Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Data Quality Observatory
              </h1>
              <p className="mt-1 text-slate-400">
                Enterprise-grade data validation and quality monitoring
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isLoading && (
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400 animate-pulse">
                  Analyzing...
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
            </div>
          </div>
        </div>

        {/* Executive KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 p-4">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium mb-1">
              <span>📊</span> Overall Quality
            </div>
            <div className="text-2xl font-bold text-white">{overallScore.toFixed(1)}%</div>
            <div className="text-xs text-slate-500">Composite score</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 p-4">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-medium mb-1">
              <span>📈</span> Stock Records
            </div>
            <div className="text-2xl font-bold text-white">{overallReport?.stock.total_records.toLocaleString() || 0}</div>
            <div className="text-xs text-slate-500">Last 24 hours</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 p-4">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-medium mb-1">
              <span>💬</span> Social Records
            </div>
            <div className="text-2xl font-bold text-white">{overallReport?.social.total_records.toLocaleString() || 0}</div>
            <div className="text-xs text-slate-500">Last 24 hours</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 p-4">
            <div className="flex items-center gap-2 text-green-400 text-xs font-medium mb-1">
              <span>✅</span> Validation Rate
            </div>
            <div className="text-2xl font-bold text-white">{overallReport ? ((overallReport.stock.valid_ratio + overallReport.social.valid_ratio) / 2).toFixed(1) : 0}%</div>
            <div className="text-xs text-slate-500">Records passing checks</div>
          </div>
        </div>

        {/* Ticker Search */}
        <div className="mb-6 rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Analyze Specific Ticker</label>
              <input
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white uppercase focus:border-teal-500 focus:outline-none"
                placeholder="RELIANCE"
              />
            </div>
            <button
              onClick={loadReports}
              disabled={isLoading || !ticker}
              className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-medium text-white hover:from-emerald-500 hover:to-teal-500 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-emerald-500/25"
            >
              {isLoading ? 'Analyzing...' : '🔍 Analyze Quality'}
            </button>
          </div>
        </div>

        {/* Overall Quality Section */}
        {overallReport && (
          <div className="mb-6 rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span className="text-xl">📊</span> System-Wide Quality (Last 24 Hours)
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <QualityGauge
                value={overallReport.stock.completeness}
                label="Stock Completeness"
                color="#22d3ee"
              />
              <QualityGauge
                value={overallReport.stock.valid_ratio}
                label="Stock Validity"
                color="#06b6d4"
              />
              <QualityGauge
                value={overallReport.social.completeness}
                label="Social Completeness"
                color="#a855f7"
              />
              <QualityGauge
                value={overallReport.social.valid_ratio}
                label="Social Validity"
                color="#9333ea"
              />
            </div>
          </div>
        )}

        {/* Ticker-Specific Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Quality */}
          <div className="rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📈</span>
              <div>
                <h2 className="text-xl font-bold text-white">Stock Data Quality</h2>
                <p className="text-sm text-slate-400">For {stockReport?.ticker || ticker}</p>
              </div>
            </div>

            {stockReport ? (
              <div className="space-y-4">
                <div className="flex justify-center py-4">
                  <QualityGauge
                    value={(stockReport.completeness + stockReport.valid_ratio) / 2}
                    label="Overall Score"
                    size={120}
                    color="#22d3ee"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                    <div className="text-xs text-slate-500">Completeness</div>
                    <div className="text-lg font-bold text-cyan-400">{stockReport.completeness.toFixed(1)}%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                    <div className="text-xs text-slate-500">Valid Ratio</div>
                    <div className="text-lg font-bold text-cyan-400">{stockReport.valid_ratio.toFixed(1)}%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                    <div className="text-xs text-slate-500">Window</div>
                    <div className="text-lg font-bold text-white">{stockReport.days} days</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                    <div className="text-xs text-slate-500">Records</div>
                    <div className="text-lg font-bold text-white">{stockReport.total_records.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">No stock quality data</div>
            )}
          </div>

          {/* Social Quality */}
          <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">💬</span>
              <div>
                <h2 className="text-xl font-bold text-white">Social Data Quality</h2>
                <p className="text-sm text-slate-400">For {socialReport?.ticker || ticker}</p>
              </div>
            </div>

            {socialReport ? (
              <div className="space-y-4">
                <div className="flex justify-center py-4">
                  <QualityGauge
                    value={(socialReport.completeness + socialReport.valid_ratio) / 2}
                    label="Overall Score"
                    size={120}
                    color="#a855f7"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                    <div className="text-xs text-slate-500">Completeness</div>
                    <div className="text-lg font-bold text-purple-400">{socialReport.completeness.toFixed(1)}%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                    <div className="text-xs text-slate-500">Valid Ratio</div>
                    <div className="text-lg font-bold text-purple-400">{socialReport.valid_ratio.toFixed(1)}%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                    <div className="text-xs text-slate-500">Window</div>
                    <div className="text-lg font-bold text-white">{socialReport.hours} hours</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                    <div className="text-xs text-slate-500">Records</div>
                    <div className="text-lg font-bold text-white">{socialReport.total_records.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">No social quality data</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>🔬 DataValidator + DataQualityMetrics</span>
              <span>📊 Real-time monitoring</span>
            </div>
            <div>
              Quality measured on every pipeline run
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
