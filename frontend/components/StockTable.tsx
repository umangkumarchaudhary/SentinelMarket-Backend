'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Stock } from '@/lib/api';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { RiskBadge } from './RiskBadge';

interface StockTableProps {
  stocks: Stock[];
  isLoading?: boolean;
}

type SortField = 'ticker' | 'risk_score' | 'price' | 'price_change_percent' | 'volume';
type SortDirection = 'asc' | 'desc';

export function StockTable({ stocks, isLoading }: StockTableProps) {
  const [sortField, setSortField] = useState<SortField>('risk_score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Filter stocks
  const filteredStocks = useMemo(() => {
    let filtered = stocks;

    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (stock) =>
          stock.ticker.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          stock.exchange.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    if (filterRiskLevel !== 'all') {
      filtered = filtered.filter((stock) => stock.risk_level === filterRiskLevel);
    }

    return filtered;
  }, [stocks, debouncedSearchQuery, filterRiskLevel]);

  // Sort stocks
  const sortedStocks = useMemo(() => {
    const sorted = [...filteredStocks];
    sorted.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'ticker':
          aValue = a.ticker;
          bValue = b.ticker;
          break;
        case 'risk_score':
          aValue = a.risk_score;
          bValue = b.risk_score;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'price_change_percent':
          aValue = a.price_change_percent;
          bValue = b.price_change_percent;
          break;
        case 'volume':
          aValue = a.volume;
          bValue = b.volume;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    return sorted;
  }, [filteredStocks, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-3 h-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
      >
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl" style={{ background: 'var(--border-subtle)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div
        className="rounded-2xl p-12 text-center"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
      >
        <p style={{ color: 'var(--foreground-muted)' }}>No stocks found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div
        className="flex flex-col sm:flex-row gap-3 rounded-2xl p-4"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
      >
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: 'var(--foreground-muted)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by ticker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50"
            style={{
              background: 'var(--background-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)'
            }}
          />
        </div>
        <select
          value={filterRiskLevel}
          onChange={(e) => setFilterRiskLevel(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50 cursor-pointer"
          style={{
            background: 'var(--background-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)'
          }}
        >
          <option value="all">All Risk Levels</option>
          <option value="LOW">Low Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="HIGH">High Risk</option>
          <option value="EXTREME">Extreme Risk</option>
        </select>
      </div>

      {/* Results count */}
      <div className="text-sm px-1" style={{ color: 'var(--foreground-muted)' }}>
        Showing {sortedStocks.length} of {stocks.length} stocks
      </div>

      {/* Desktop Table */}
      <div
        className="hidden md:block overflow-hidden rounded-2xl"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ background: 'var(--background-tertiary)' }}>
                {[
                  { key: 'ticker', label: 'Ticker' },
                  { key: null, label: 'Exchange' },
                  { key: 'risk_score', label: 'Risk Level' },
                  { key: 'price', label: 'Price' },
                  { key: 'price_change_percent', label: 'Change' },
                  { key: 'volume', label: 'Volume' },
                  { key: null, label: 'Action' },
                ].map((col, i) => (
                  <th
                    key={i}
                    className={`px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider ${col.key ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                    style={{ color: 'var(--foreground-muted)' }}
                    onClick={() => col.key && handleSort(col.key as SortField)}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {col.key && <SortIcon field={col.key as SortField} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {sortedStocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center" style={{ color: 'var(--foreground-muted)' }}>
                    No stocks match your filters
                  </td>
                </tr>
              ) : (
                sortedStocks.map((stock, index) => (
                  <tr
                    key={`${stock.ticker}-${stock.exchange}`}
                    className="transition-colors hover:bg-white/5"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <td className="px-5 py-4">
                      <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                        {stock.ticker}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: 'var(--background-tertiary)',
                          color: 'var(--foreground-secondary)'
                        }}
                      >
                        {stock.exchange}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <RiskBadge riskLevel={stock.risk_level} riskScore={stock.risk_score} />
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>
                        ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="font-semibold tabular-nums"
                        style={{ color: stock.price_change_percent >= 0 ? 'var(--success)' : 'var(--danger)' }}
                      >
                        {stock.price_change_percent >= 0 ? '+' : ''}
                        {stock.price_change_percent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="tabular-nums" style={{ color: 'var(--foreground-secondary)' }}>
                        {(stock.volume / 1000000).toFixed(2)}M
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/stock/${stock.ticker}?exchange=${stock.exchange.toLowerCase()}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
                        style={{
                          background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
                          color: 'white'
                        }}
                      >
                        View
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {sortedStocks.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <p style={{ color: 'var(--foreground-muted)' }}>No stocks match your filters</p>
          </div>
        ) : (
          sortedStocks.map((stock) => (
            <Link
              key={`${stock.ticker}-${stock.exchange}-mobile`}
              href={`/stock/${stock.ticker}?exchange=${stock.exchange.toLowerCase()}`}
              className="block rounded-2xl p-4 transition-all active:scale-[0.98]"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
            >
              {/* Header Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                    {stock.ticker}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: 'var(--background-tertiary)', color: 'var(--foreground-muted)' }}
                  >
                    {stock.exchange}
                  </span>
                </div>
                <RiskBadge riskLevel={stock.risk_level} riskScore={stock.risk_score} />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--foreground-muted)' }}>
                    Price
                  </p>
                  <p className="font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>
                    ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--foreground-muted)' }}>
                    Change
                  </p>
                  <p
                    className="font-semibold tabular-nums"
                    style={{ color: stock.price_change_percent >= 0 ? 'var(--success)' : 'var(--danger)' }}
                  >
                    {stock.price_change_percent >= 0 ? '+' : ''}{stock.price_change_percent.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--foreground-muted)' }}>
                    Volume
                  </p>
                  <p className="font-semibold tabular-nums" style={{ color: 'var(--foreground-secondary)' }}>
                    {(stock.volume / 1000000).toFixed(2)}M
                  </p>
                </div>
              </div>

              {/* Tap indicator */}
              <div className="mt-3 flex items-center justify-end gap-1 text-xs" style={{ color: 'var(--foreground-muted)' }}>
                <span>View details</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
