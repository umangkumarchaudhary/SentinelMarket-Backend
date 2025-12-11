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
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce search input

  // Filter stocks (using debounced search)
  const filteredStocks = useMemo(() => {
    let filtered = stocks;

    // Search filter (using debounced query)
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (stock) =>
          stock.ticker.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          stock.exchange.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Risk level filter
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
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">No stocks found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by ticker or exchange..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
          />
        </div>
        <div>
          <select
            value={filterRiskLevel}
            onChange={(e) => setFilterRiskLevel(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
          >
            <option value="all">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="EXTREME">Extreme Risk</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {sortedStocks.length} of {stocks.length} stocks
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                  onClick={() => handleSort('ticker')}
                >
                  <div className="flex items-center gap-1">
                    Ticker <SortIcon field="ticker" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Exchange
                </th>
                <th
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                  onClick={() => handleSort('risk_score')}
                >
                  <div className="flex items-center gap-1">
                    Risk Level <SortIcon field="risk_score" />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center gap-1">
                    Price <SortIcon field="price" />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                  onClick={() => handleSort('price_change_percent')}
                >
                  <div className="flex items-center gap-1">
                    Change <SortIcon field="price_change_percent" />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                  onClick={() => handleSort('volume')}
                >
                  <div className="flex items-center gap-1">
                    Volume <SortIcon field="volume" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedStocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No stocks match your filters
                  </td>
                </tr>
              ) : (
                sortedStocks.map((stock) => (
                  <tr
                    key={`${stock.ticker}-${stock.exchange}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-black">
                      {stock.ticker}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {stock.exchange}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <RiskBadge riskLevel={stock.risk_level} riskScore={stock.risk_score} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-black">
                      ₹{stock.price.toFixed(2)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-6 py-4 text-sm font-medium ${
                        stock.price_change_percent >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {stock.price_change_percent >= 0 ? '+' : ''}
                      {stock.price_change_percent.toFixed(2)}%
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {(stock.volume / 1000000).toFixed(2)}M
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <Link
                        href={`/stock/${stock.ticker}?exchange=${stock.exchange.toLowerCase()}`}
                        className="text-red-600 hover:text-red-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
